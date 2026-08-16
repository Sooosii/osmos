/**
 * Zenginleştirme yöneticisi — alan adı başına bütün ölçümleri sırayla koşar.
 *
 * ⚠️ Hata "zarifçe geçilecek" ama SESSİZCE değil: ulaşılamayan her alan adının
 * sebebi `notes` sütununa yazılıyor. Sessiz geçiş, boş bir CSV'nin neden boş
 * olduğunu kimsenin bilememesi demekti.
 */
import type { DatabaseSync } from 'node:sqlite';
import { ekleKanit, upsertLead } from '../db.ts';
import { adayHostlar } from '../domain.ts';
import { naziceGetir, type Cevap } from '../net/fetch.ts';
import { robotsGetir } from '../net/robots.ts';
import { segmentCikar, ulkeCikar } from '../infer.ts';
import { olcekCikar } from '../olcek.ts';
import { puanla } from '../score.ts';
import type { Lead } from '../types.ts';
import { baslikCek, olcBaglanti } from './contact.ts';
import { olcPlatform } from './platform.ts';
import { olcBenzerUrun } from './similar.ts';

/**
 * Aynı anda kaç ayrı alan adı işlensin.
 *
 * ⚠️ Nezaket ANA BİLGİSAYAR başına uygulanıyor (`net/fetch.ts`), bu sayı
 * ise kaç FARKLI siteye aynı anda gidildiği. Tek bir siteye yüklenme riski
 * yok. Apify binlerce alan adı getirince 3 işçiyle 3.000 site ~5,5 saat
 * sürüyordu; 8 işçiyle ~2 saat.
 */
export const ESZAMANLI = 4;

export interface ZenginlestirmeSonucu {
  readonly domain: string;
  readonly durum: Lead['durum'];
  readonly not: string | null;
}

interface AcilisSonucu {
  readonly origin: string | null;
  readonly anaSayfa: Cevap | null;
  /** Her adayın neyle karşıladığı — başarısızlık sebebi kaydedilsin diye. */
  readonly denemeler: readonly string[];
}

/**
 * İlk açılan adayı bulur — çıplak alan adı 301 verebiliyor (ölçüldü).
 *
 * ⚠️ Başarısızlık sebebi TOPLANIYOR. "Ulaşılamadı" tek başına işe yaramaz:
 * 403 ile çözülemeyen alan adı bambaşka iki durum. Birincisi gerçek
 * tarayıcıyla açılır (deponun kendi dersi), ikincisi ölü bir adrestir.
 * Ayırmadan bakınca ikisi de aynı boş satır olarak görünür.
 */
async function calisanOrigin(domain: string, seedUrl: string | null): Promise<AcilisSonucu> {
  const denemeler: string[] = [];
  for (const host of adayHostlar(domain, seedUrl)) {
    const c = await naziceGetir(`https://${host}/`);
    if (c.ok && c.body.length > 200) {
      const u = new URL(c.finalUrl);
      return { origin: `${u.protocol}//${u.host}`, anaSayfa: c, denemeler };
    }
    denemeler.push(`${host}: ${c.hata ?? `HTTP ${c.status}${c.ok ? ' (govde cok kisa)' : ''}`}`);
  }
  return { origin: null, anaSayfa: null, denemeler };
}

/**
 * 403/401 gördüysek engel robota özel; gerçek tarayıcı bunu kaldırabilir.
 *
 * ⚠️ 429 buraya DAHİL DEĞİL. Başta dahildi ve yanlıştı: 429 "girme" değil
 * "yavaşla" demek. Aynı torbaya konunca ulaşılabilir 56 dükkân "robota
 * kapalı" diye işaretlenip listeden düşmüştü.
 */
function robotaKapaliMi(denemeler: readonly string[]): boolean {
  return denemeler.some((d) => d.includes('HTTP 403') || d.includes('HTTP 401'));
}

/** Hız sınırına takıldıysak sonra yeniden denenebilir. */
function hizSinirindaMi(denemeler: readonly string[]): boolean {
  return denemeler.some((d) => d.includes('HTTP 429'));
}

export async function zenginlestirBir(
  db: DatabaseSync,
  lead: Pick<Lead, 'domain' | 'shop_name' | 'source' | 'seed_url'>,
): Promise<ZenginlestirmeSonucu> {
  const { domain } = lead;
  const acilan = await calisanOrigin(domain, lead.seed_url);
  if (acilan.origin === null || acilan.anaSayfa === null) {
    const engel = robotaKapaliMi(acilan.denemeler)
      ? 'ROBOTA KAPALI (gercek tarayici gerekir): '
      : hizSinirindaMi(acilan.denemeler)
        ? 'HIZ SINIRI (sonra yeniden denenecek): '
        : 'acilmadi: ';
    const not = engel + acilan.denemeler.join(' · ');
    upsertLead(db, {
      ...lead, durum: 'ulasilamadi', notes: not, score: 0,
      olcek: olcekCikar({ product_count: null, platform: 'bilinmiyor', notes: not }),
    });
    return { domain, durum: 'ulasilamadi', not };
  }

  const origin = acilan.origin;
  const anaSayfa = acilan.anaSayfa;
  const robots = await robotsGetir(origin);
  if (!robots.izinliMi('/')) {
    const not = 'robots.txt kok dizini kapatiyor — gezilmedi';
    upsertLead(db, { ...lead, durum: 'elendi', notes: not, score: 0 });
    return { domain, durum: 'elendi', not };
  }

  const platform = await olcPlatform(origin, anaSayfa);
  const baglanti = await olcBaglanti(origin, domain, anaSayfa, robots.izinliMi);
  const benzer = await olcBenzerUrun(origin, platform.urunAdaylari, anaSayfa, robots.izinliMi);

  const alanlar = {
    ...lead,
    shop_name: lead.shop_name ?? (baslikCek(anaSayfa.body) || null),
    platform: platform.platform,
    email: baglanti.email,
    instagram: baglanti.instagram,
    country: ulkeCikar(domain),
    product_count: platform.productCount,
    has_similar_feature: benzer.hasSimilar,
    segment: segmentCikar(platform.urunAdlari, platform.productCount, platform.platform),
    /*
      ⚠️ Zenginleştirme marka örtüşmesini ÖLÇMÜYOR — o `demo-adaylari`
      komutunun işi. Burada `null` geçiliyor ve `upsertLead` COALESCE ile
      daha önce ölçülmüş bir değeri korur; sıfır yazmak "ölçtüm, yok"
      demek olurdu ve yanlış olurdu.
    */
    marka_ortusmesi: null,
    urun_ortusmesi: null,
  } as const;

  const notParcalari = [
    platform.sayiTavanda ? `urun sayisi ${platform.productCount}+ (tavan)` : null,
    baglanti.elenenKisisel > 0 ? `${baglanti.elenenKisisel} kisisel gorunumlu adres elendi` : null,
    robots.kaynak === 'kapali' ? 'robots.txt bizden saklandi' : null,
  ].filter((p): p is string => p !== null);

  const notlar = notParcalari.length > 0 ? notParcalari.join(' · ') : null;
  const id = upsertLead(db, {
    ...alanlar,
    durum: 'zenginlestirildi',
    olcek: olcekCikar({ product_count: alanlar.product_count, platform: alanlar.platform, notes: notlar }),
    score: puanla(alanlar).toplam,
    notes: notlar,
  });

  for (const k of [...platform.kanit, ...baglanti.kanit, ...benzer.kanit]) {
    ekleKanit(db, { lead_id: id, kind: k.kind, url: k.url, snippet: k.snippet, http_status: k.status });
  }
  return { domain, durum: 'zenginlestirildi', not: notParcalari.join(' · ') || null };
}

/** Havuzu `ESZAMANLI` kadar paralel işler; her biten satırı loglar. */
export async function zenginlestirHepsi(
  db: DatabaseSync,
  leadler: readonly Pick<Lead, 'domain' | 'shop_name' | 'source' | 'seed_url'>[],
  log: (s: string) => void,
): Promise<void> {
  let sira = 0;
  let biten = 0;
  const isci = async (): Promise<void> => {
    for (;;) {
      const i = sira;
      sira += 1;
      const lead = leadler[i];
      if (lead === undefined) return;
      try {
        const s = await zenginlestirBir(db, lead);
        biten += 1;
        log(`[enrich] ${biten}/${leadler.length} ${s.domain} → ${s.durum}${s.not === null ? '' : ` (${s.not})`}`);
      } catch (e) {
        biten += 1;
        const not = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
        upsertLead(db, { ...lead, durum: 'ulasilamadi', notes: not, score: 0 });
        log(`[enrich] ${biten}/${leadler.length} ${lead.domain} → HATA ${not}`);
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(ESZAMANLI, leadler.length) }, isci));
}
