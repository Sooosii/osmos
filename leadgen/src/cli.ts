/**
 * Tek giriş noktası: `node src/cli.ts <komut>`.
 *
 * Komutlar bilerek ayrı: zenginleştirme ağa çıkıyor ve dakikalar sürüyor,
 * puanlama ve dışa aktarma saniyeler. Tek bir "hepsini yap" komutu, CSV
 * biçimindeki küçük bir düzeltme için bütün siteleri yeniden gezdirirdi.
 */
import { parseArgs } from 'node:util';
import { join } from "node:path";
import { existsSync } from "node:fs";
import { acVeritabani, ekleTemas, toplamHarcama, tumLeadler, upsertLead } from './db.ts';
import { ApifyIstemcisi } from './apify/istemci.ts';
import { topla } from './apify/topla.ts';
import { elemedenGecer } from './apify/kanallar/eleme.ts';
import { zenginlestirHepsi } from './enrich/index.ts';
import { katalogParfumSayisi, katalogTohumlari, varsayilanKatalogDizini } from './seed.ts';
import { puanla } from './score.ts';
import { olcekCikar } from './olcek.ts';
import { yazLeadsCsv } from './export/leads.ts';
import { yazOutreachCsv } from './export/outreach.ts';
import { yazDmListesi } from './export/dm-listesi.ts';
import { yazIlkTur } from './export/ilk-tur.ts';
import { olcAdaylar, yazDemoRaporu } from './demo/adaylar.ts';
import { osmosMarkalari, osmosParfumleri } from './demo/markalar.ts';
import { yazRapor } from './report.ts';

/**
 * `.env.local` dosyasını ortama yükler.
 *
 * ⚠️ Bu eksikti ve sessiz bir hataydı: `ApifyIstemcisi.ortamdan()`
 * `process.env.APIFY_TOKEN`e bakıyor ama Node bir `.env` dosyasını
 * KENDILIGINDEN okumuyor. Token dosyaya doğru yazılmış olmasına rağmen
 * "APIFY_TOKEN yok" deniyordu — yani hata kullanıcıyı kendi doğru işini
 * sorgulamaya itiyordu, en kötü hata türü.
 *
 * `process.loadEnvFile` Node 20.12'den beri gömülü; bağımlılık eklenmiyor.
 * Depo kökündeki dosya okunuyor çünkü site de aynı dosyayı kullanıyor ve
 * anahtarların iki yerde durması ikisinin ayrışması demekti.
 */
function ortamiYukle(): void {
  const yol = join(import.meta.dirname, '..', '..', '.env.local');
  if (!existsSync(yol)) return;
  try {
    process.loadEnvFile(yol);
  } catch {
    /* Bozuk satır varsa boru hattı durmasın; token yoksa zaten anlaşılır. */
  }
}

const VERI = join(import.meta.dirname, '..', 'data');
const DB_YOLU = join(VERI, 'leads.db');

const log = (s: string): void => { process.stdout.write(`${s}\n`); };

const KOMUTLAR = [
  'seed', 'topla', 'enrich', 'demo-adaylari', 'score', 'export', 'report', 'temas', 'hepsi',
] as const;
type Komut = typeof KOMUTLAR[number];

interface Secenekler {
  readonly komut: Komut;
  readonly sinir: number | null;
  readonly sonda: boolean;
  readonly onayla: boolean;
  readonly kanal: string | null;
}

function komutOku(): Secenekler {
  const { positionals, values } = parseArgs({
    allowPositionals: true,
    options: {
      sinir: { type: 'string' },
      sonda: { type: 'boolean' },
      onayla: { type: 'boolean' },
      kanal: { type: 'string' },
    },
  });
  const ham = positionals[0] ?? '';
  if (!(KOMUTLAR as readonly string[]).includes(ham)) {
    log(`kullanim: node src/cli.ts <${KOMUTLAR.join('|')}> [--sinir N] [--sonda] [--onayla] [--kanal <ad>]`);
    process.exit(1);
  }
  const sinir = values.sinir === undefined ? null : Number.parseInt(values.sinir, 10);
  return {
    komut: ham as Komut,
    sinir: sinir !== null && Number.isFinite(sinir) ? sinir : null,
    sonda: values.sonda === true,
    onayla: values.onayla === true,
    kanal: typeof values.kanal === 'string' ? values.kanal : null,
  };
}

async function main(): Promise<void> {
  ortamiYukle();
  const { komut, sinir, sonda, onayla, kanal } = komutOku();
  const db = acVeritabani(DB_YOLU);

  if (komut === 'seed' || komut === 'hepsi') {
    const tohumlar = katalogTohumlari(varsayilanKatalogDizini());
    for (const t of tohumlar) {
      upsertLead(db, { domain: t.domain, shop_name: t.shopName, seed_url: t.seedUrl, source: 'katalog', durum: 'yeni' });
    }
    log(`[seed] ${tohumlar.length} alan adı kataloğdan eklendi`);
  }

  if (komut === 'topla') {
    /*
      ⚠️ `hepsi` bilerek Apify'ı ÇAĞIRMIYOR. Para harcayan tek adımın
      "hepsini yap" komutunun içine gizlenmesi, yanlışlıkla harcamanın en
      kolay yolu olurdu. Toplama her zaman açıkça istenir.
    */
    const istemci = ApifyIstemcisi.ortamdan();
    if (istemci === null) {
      log('[topla] APIFY_TOKEN yok. Apify konsolundan token alıp .env.local dosyasına');
      log('        APIFY_TOKEN=... diye yazman gerekiyor (dosya zaten gitignore listesinde).');
      process.exit(1);
    }
    const mod = sonda || !onayla ? 'sonda' : 'tam';
    if (mod === 'sonda' && !sonda) {
      log('[topla] --onayla verilmedi → yalnız SONDA koşuyor. Tam koşu için: topla --onayla');
    }
    const rapor = await topla(db, istemci, mod, onayla, log, kanal as never);
    log(`[topla] ${rapor.mod} bitti · ${rapor.toplamYeniAday} yeni aday ·`
      + ` bu koşu $${rapor.toplamGercekUsd.toFixed(4)} · toplam $${toplamHarcama(db).toFixed(4)}`);
    for (const b of rapor.bekleyenOnaylar) log(`[topla] ONAY BEKLIYOR → ${b}`);
  }

  if (komut === 'temas') {
    /*
      Elle yapılan işin kaydı. Tek amacı tekrarı önlemek: aynı kişiye ikinci
      kez aynı mesajı atmak, hiç atmamaktan kötü.
    */
    const [, domain, sonuc, ...notParcalari] = process.argv.slice(1).filter((a) => !a.startsWith('--'));
    if (domain === undefined || sonuc === undefined) {
      log('kullanim: node src/cli.ts temas <domain> <gonderildi|cevap|red|ilgilendi> [not]');
      process.exit(1);
    }
    const kanal = tumLeadler(db).find((l) => l.domain === domain)?.instagram === null ? 'mail' : 'dm';
    ekleTemas(db, { domain, kanal, sonuc, not: notParcalari.join(' ') || null });
    log(`[temas] ${domain} → ${sonuc} (${kanal})`);
  }

  if (komut === 'enrich' || komut === 'hepsi') {
    /*
      ⚠️ Hız sınırına takılanlar da kuyruğa giriyor. 429 kalıcı bir ret değil;
      ilk ölçümde 56 ulaşılabilir dükkân yalnızca biz çok hızlı gittiğimiz
      için listeden düşmüştü.
    */
    const bekleyen = tumLeadler(db).filter(
      (l) => l.durum === 'yeni' || (l.notes ?? '').includes('HIZ SINIRI'),
    );
    const kume = sinir === null ? bekleyen : bekleyen.slice(0, sinir);
    log(`[enrich] ${kume.length} alan adı ölçülecek (bekleyen ${bekleyen.length})`);
    await zenginlestirHepsi(db, kume, log);
  }

  if (komut === 'demo-adaylari') {
    /*
      ⚠️ `hepsi` içinde DEĞİL. Ağa çıkıyor ve dakikalar sürüyor; ayrıca
      sonucu bir satış kararına girdi olduğu için istenerek koşulmalı.
    */
    const dizin = varsayilanKatalogDizini();
    const bizimkiler = osmosMarkalari(dizin);
    const parfumlerimiz = osmosParfumleri(dizin);
    log(`[demo] kataloğumuzda ${parfumlerimiz.length} parfüm / ${bizimkiler.size} marka var`);
    const sonuclar = await olcAdaylar(db, bizimkiler, parfumlerimiz, sinir ?? 200, log);
    const n = yazDemoRaporu(sonuclar, join(VERI, 'demo-adaylari.md'));
    log(`[demo] demo-adaylari.md — ${n} hedefe demo bugün kurulabilir`);
  }

  if (komut === 'score' || komut === 'hepsi') {
    /*
      Puan ve ölçek ikisi de SAKLANAN alanlardan türüyor — ağa çıkmaya gerek
      yok. Formül değiştiğinde saatlerce süren taramayı tekrarlamadan bütün
      liste tazelenebiliyor; bu komutun asıl varlık sebebi bu.
    */
    let n = 0;
    let yeniElenen = 0;
    for (const l of tumLeadler(db)) {
      /*
        ⚠️ Eleme kuralı BURADA da uygulanıyor, yalnız toplama anında değil.
        Sebep ölçüldü: `threads.net` listedeyken Meta alan adını
        `threads.com`a taşıdı ve mecra sessizce hedef listesine girdi;
        aynı şekilde apkpure.net, snapchat.com, gmail.com ve faire.com.
        Kural sonradan genişlediğinde eski kayıtlar eskisi gibi kalıyordu,
        yani listeyi düzeltmenin tek yolu saatler süren taramayı
        tekrarlamaktı. Artık `score` bunu da tazeliyor.

        ⚠️ Ters yöne İŞLEMİYOR: bir kez elenmiş kayıt burada geri
        açılmıyor. Elenme sebepleri arasında ağdan gelen kararlar da var
        (robots.txt kökü kapatıyor) ve onu bu komut ölçemez.
      */
      if (l.durum !== 'elendi') {
        const eleme = elemedenGecer(l.domain, l.seed_url);
        if (!eleme.gecti) {
          upsertLead(db, { ...l, durum: 'elendi', notes: eleme.sebep, score: 0 });
          yeniElenen += 1;
          n += 1;
          continue;
        }
      }
      upsertLead(db, { ...l, score: puanla(l).toplam, olcek: olcekCikar(l) });
      n += 1;
    }
    log(`[score] ${n} adayın puanı ve ölçeği tazelendi`
      + (yeniElenen > 0 ? ` · ${yeniElenen} aday eleme kuralına takıldı` : ''));
  }

  if (komut === 'export' || komut === 'hepsi') {
    const parfumSayisi = katalogParfumSayisi(varsayilanKatalogDizini());
    const a = yazLeadsCsv(db, join(VERI, 'leads_ranked.csv'));
    const b = yazOutreachCsv(db, join(VERI, 'outreach.csv'), parfumSayisi);
    const d = yazDmListesi(db, join(VERI, 'dm-listesi.md'));
    log(`[export] leads_ranked.csv ${a} satır · outreach.csv ${b.yazilan} satır`
      + ` (${b.dm} DM, ${b.mail} mail)`
      + (b.kanitsiz > 0 ? ` · ${b.kanitsiz} tanesinde kanıt yok, açılış cümlesi boş bırakıldı` : ''));
    log(`[export] dm-listesi.md ${d.toplam} hesap (~${d.gun} gün)`
      + (d.atlanan > 0 ? ` · ${d.atlanan} tanesine daha önce yazılmış, atlandı` : ''));
    const t = yazIlkTur(db, join(VERI, 'ilk-tur.md'), parfumSayisi);
    log(`[export] ilk-tur.md ${t.dm} DM + ${t.mail} mail`
      + (t.turkiye > 0 ? ` (${t.turkiye} Türkiye adresi — İYS gerekiyor)` : ''));
  }

  if (komut === 'report' || komut === 'hepsi') {
    yazRapor(db, join(VERI, 'report.md'));
    log('[report] report.md yazıldı');
  }

  db.close();
}

await main();
