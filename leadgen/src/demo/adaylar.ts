/**
 * `demo-adaylari` — hangi hedefe demo BUGÜN kurulabilir.
 *
 * Satış sırası "anlat, sonra göster" değil: bespoke bir ürün ancak kurulup
 * gösterilerek satılıyor. Bu komut o sıranın ilk adımını ölçüyor — hedefin
 * sattığı markalar bizim kataloğumuzda varsa demo dakikalar içinde kurulur.
 *
 * ⚠️ Ücretsiz: yalnız Shopify `products.json` okunuyor, Apify yok.
 */
import type { DatabaseSync } from 'node:sqlite';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { tumLeadler, upsertLead } from '../db.ts';
import { adayHostlar } from '../domain.ts';
import { jsonAyristir, naziceGetir } from '../net/fetch.ts';
import { temizAd } from '../export/outreach.ts';
import {
  ortusmeHesapla, urunOrtusmesiHesapla,
  type KatalogParfumu, type Ortusme, type UrunOrtusmesi,
} from './markalar.ts';
import type { DukkanUrunu } from './taslak.ts';
import type { Lead } from '../types.ts';

/** Sayfa başına ürün — Shopify'ın tavanı. */
const URUN_SINIRI = 250;

/**
 * En çok kaç sayfa okunacak (5.000 ürün).
 *
 * ⚠️ Sınırsız değil ve bilerek: sayfalama bir dükkâna onlarca istek atabilir
 * ve `naziceGetir` host başına sırayla gidiyor, yani süre gerçek. Bu tavana
 * dayanan bir dükkân zaten bizim seçkimizin hedefi değil.
 */
const EN_COK_SAYFA = 20;

interface ShopifyUrun { readonly vendor?: string; readonly title?: string; readonly handle?: string }
interface ShopifyListe { readonly products?: readonly ShopifyUrun[] }

export interface AdayOlcumu {
  readonly lead: Lead;
  readonly ortusme: Ortusme | null;
  /** ⚠️ Demo seçkisini kuran gerçek ölçüm bu; marka örtüşmesi ön elemedir. */
  readonly urunOrtusmesi: UrunOrtusmesi | null;
  readonly not: string | null;
}

export interface HedefKatalogu {
  /**
   * Katalogu GERÇEKTEN veren host — ürün adresleri bundan kurulur.
   *
   * ⚠️ **Bu alan ölçülmüş bir hatadan doğdu (2026-08-19).** Host bilinip
   * atılıyordu; taslak sonra adresleri `lead.domain`den kuruyordu ve o
   * `normalizeDomain` yüzünden `www.`siz. Yalnız `www.` üstünden yayın yapan
   * bir dükkânda taslağın **her adresi 404** oluyordu — nicheessence.com'da
   * 7/7 ölçüldü. Üstelik sessizce: dosya derleniyor, harita çiziliyor,
   * yalnızca ziyaretçi hiçbir yere varamıyor.
   */
  readonly host: string;
  readonly markalar: readonly string[];
  /** Marka + ad birleşik başlıklar — ürün eşleştirmesi bunun üstünde. */
  readonly basliklar: readonly string[];
  /**
   * Ürünlerin kendisi — `handle` ürün adresini kuruyor.
   *
   * ⚠️ `basliklar` ile AYNI sıradan üretiliyor: eşleştirme başlık üstünde
   * yapılıp adres buradan alınıyor, ikisi ayrışırsa yanlış ürüne bağlanırdık.
   */
  readonly urunler: readonly DukkanUrunu[];
}

/**
 * Bir host'un BÜTÜN ürünleri — Shopify sayfa başına en çok 250 veriyor.
 *
 * ⚠️ **Sayfalama ölçülmüş bir hatadan sonra eklendi (2026-08-19).** Tek
 * istek atılıyordu ve dükkânın ilk 250 ürünü okunuyordu; gerisi hiç
 * görülmüyordu. Sonucu nicheessence.com'da görüldü: eşleştirici yalnız
 * **3 ml numune** sayfalarını buldu, çünkü asıl şişeler ilk 250'nin dışında
 * kalmıştı. Demo, müşterinin $320'lık şişesi yerine $18'lik numunesine
 * bağlanıyordu — yani "her yol sizin ürün sayfanızda bitiyor" sözü teknik
 * olarak doğru, ticari olarak yanlıştı.
 *
 * Ayrıca örtüşme OLDUĞUNDAN AZ ölçülüyordu: bulunamayan her ürün "bu dükkânda
 * yok" sayılıyordu ve demo seçkisi gereksiz yere küçülüyordu.
 *
 * `null` = bu host Shopify katalogu vermiyor (öbür adayı dene).
 */
async function hostUrunleri(host: string): Promise<readonly ShopifyUrun[] | null> {
  const hepsi: ShopifyUrun[] = [];
  for (let sayfa = 1; sayfa <= EN_COK_SAYFA; sayfa += 1) {
    const c = await naziceGetir(`https://${host}/products.json?limit=${URUN_SINIRI}&page=${sayfa}`);
    const veri = jsonAyristir<ShopifyListe>(c);
    const urunler = veri?.products;
    /* Ilk sayfa okunamadıysa bu host Shopify değil; sonrakiler sadece son. */
    if (urunler === undefined) return sayfa === 1 ? null : hepsi;
    hepsi.push(...urunler);
    /* Dolu olmayan sayfa sonuncudur — bir istek daha atmaya gerek yok. */
    if (urunler.length < URUN_SINIRI) break;
  }
  return hepsi;
}

/** Bir hedefin katalogunu okur. */
export async function hedefKatalogu(lead: Lead): Promise<HedefKatalogu | null> {
  for (const host of adayHostlar(lead.domain, lead.seed_url)) {
    const urunler = await hostUrunleri(host);
    if (urunler === null) continue;
    return {
      host,
      markalar: urunler.flatMap((u) => (u.vendor === undefined || u.vendor.trim() === '' ? [] : [u.vendor])),
      basliklar: urunler.map((u) => `${u.vendor ?? ''} ${u.title ?? ''}`),
      urunler: urunler.flatMap((u) => (u.handle === undefined ? [] : [{
        handle: u.handle,
        baslik: `${u.vendor ?? ''} ${u.title ?? ''}`,
      }])),
    };
  }
  return null;
}

/**
 * Adayları ölçer ve örtüşmeyi veritabanına yazar.
 *
 * ⚠️ Yalnız Shopify hedefleri geziliyor. WooCommerce'da marka alanı standart
 * değil; onları ölçmeye çalışmak yanlış sıfırlar üretirdi ve puanlama
 * "ölçüldü, yok" ile "ölçülmedi"yi ayırt ediyor.
 */
/**
 * Ölçüme girecek adayları seçer — saf, ağa çıkmıyor.
 *
 * ⚠️ **`yalnizYeni` varsayılan olarak KAPALI ve öyle kalmalı.** Ölçüm
 * bayatlıyor: dükkanın rafı değişiyor, bizim kataloğumuz büyüyor, yani
 * "bir kez ölçtüm" bir daha bakmamak için gerekçe değil. Bayrak yalnız
 * **hız** için: 27 yeni hedef eklendiğinde 278 dükkanın tamamını yeniden
 * gezmek (~40 dk) ücretsiz ama verimsizdi.
 *
 * ⚠️ Sınır seçimden SONRA uygulanıyor. Önce kesilseydi, listenin başındaki
 * ölçülmüş kayıtlar kotayı yer ve `--yalniz-yeni --sinir 5` beş yeni hedef
 * yerine beşte biri ölçerdi.
 */
export function olculecekAdaylar(
  leadler: readonly Lead[],
  sinir: number,
  yalnizYeni: boolean,
): readonly Lead[] {
  return leadler
    .filter((l) => l.platform === 'shopify' && l.durum === 'zenginlestirildi')
    .filter((l) => !yalnizYeni || l.marka_ortusmesi === null)
    .slice(0, sinir);
}

export async function olcAdaylar(
  db: DatabaseSync,
  bizimkiler: ReadonlySet<string>,
  parfumlerimiz: readonly KatalogParfumu[],
  sinir: number,
  log: (s: string) => void,
  yalnizYeni = false,
): Promise<readonly AdayOlcumu[]> {
  const adaylar = olculecekAdaylar(tumLeadler(db), sinir, yalnizYeni);

  log(`[demo] ${adaylar.length} Shopify hedefinin marka listesi okunacak`
    + `${yalnizYeni ? ' (yalniz hic olculmemisler)' : ''}`);
  const sonuclar: AdayOlcumu[] = [];

  for (const [i, lead] of adaylar.entries()) {
    const katalog = await hedefKatalogu(lead);
    if (katalog === null) {
      sonuclar.push({ lead, ortusme: null, urunOrtusmesi: null, not: 'katalog okunamadi' });
      continue;
    }
    const ortusme = ortusmeHesapla(katalog.markalar, bizimkiler);
    const urunOrtusmesi = urunOrtusmesiHesapla(katalog.basliklar, parfumlerimiz);
    upsertLead(db, {
      ...lead,
      marka_ortusmesi: ortusme.sayi,
      urun_ortusmesi: urunOrtusmesi.sayi,
    });
    sonuclar.push({ lead, ortusme, urunOrtusmesi, not: null });
    if ((i + 1) % 25 === 0) log(`[demo] ${i + 1}/${adaylar.length}`);
  }
  return sonuclar;
}

export function yazDemoRaporu(sonuclar: readonly AdayOlcumu[], yol: string): number {
  /*
    ⚠️ Sıralama ÜRÜN örtüşmesine göre, marka örtüşmesine göre değil. Ölçüldü:
    marka örtüşmesi 25 olan dükkânda ürün örtüşmesi 4 çıktı. Marka sırasıyla
    sıralamak, demo kurulamayacak hedefleri listenin tepesine koyardı.
  */
  const kurulabilir = sonuclar
    .filter((s): s is AdayOlcumu & { ortusme: Ortusme; urunOrtusmesi: UrunOrtusmesi } =>
      s.ortusme !== null && s.urunOrtusmesi !== null && s.urunOrtusmesi.sayi > 0)
    .sort((a, b) => b.urunOrtusmesi.sayi - a.urunOrtusmesi.sayi);

  const satirlar = kurulabilir.map((s, i) => [
    `### ${i + 1}. ${temizAd(s.lead.shop_name) ?? s.lead.domain}`,
    '',
    `- ${s.lead.domain} · skor ${s.lead.score} · ${s.lead.product_count ?? '?'} ürün`
    + ` · ${s.lead.segment}`,
    `- **raflarında bizde de olan parfüm: ${s.urunOrtusmesi.sayi}**`
    + ` · ortak marka ${s.ortusme.sayi}/${s.ortusme.hedefMarkaSayisi}`,
    `- demo seçkisi (kimlikler): ${s.urunOrtusmesi.kimlikler.slice(0, 20).join(', ')}`,
    `- iletişim: ${s.lead.email ?? '—'}${s.lead.instagram === null ? '' : ` · @${s.lead.instagram}`}`,
    '',
  ].join('\n'));

  const metin = `# Demo adayları

**${kurulabilir.length} hedefin rafında bizde de olan parfüm var.**

⚠️ Ama sayılar küçük ve bu ÖLÇÜLDÜ: yirmi dükkânda ortalama **3 parfüm**.
Sebep katalogun biçimi — bizde marka başına 1-2 küratörlü parfüm var,
dükkânlar o markanın popüler parfümlerini satıyor. Yani "demo bedava kurulur"
varsayımı YANLIŞ; demo, müşterinin parfümlerinin bir kısmının girilmesini
gerektiriyor. Buradaki sayı, o işin ne kadarının hazır olduğunu söylüyor.

⚠️ Demo kuralları: gerçek bir işletmenin adıyla kurulan çalışma **noindex**,
sayfada "resmi olmayan çalışma" etiketi, **talep edilirse aynı gün kaldırılır.**

⚠️ Ortak marka sayısı yüksek olan üstte. Ama seçkinin koku ailelerine yayılması
da gerekiyor: dar bir seçki haritanın tek bir köşesinde toplanır. Gerekçesi
demo-selva katalogunun yorumunda yazılı.

---

${satirlar.join('\n')}`;

  mkdirSync(dirname(yol), { recursive: true });
  writeFileSync(yol, metin, 'utf8');
  return kurulabilir.length;
}
