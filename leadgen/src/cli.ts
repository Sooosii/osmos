/**
 * Tek giriş noktası: `node src/cli.ts <komut>`.
 *
 * Komutlar bilerek ayrı: zenginleştirme ağa çıkıyor ve dakikalar sürüyor,
 * puanlama ve dışa aktarma saniyeler. Tek bir "hepsini yap" komutu, CSV
 * biçimindeki küçük bir düzeltme için bütün siteleri yeniden gezdirirdi.
 */
import { parseArgs } from 'node:util';
import { join } from "node:path";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { acVeritabani, ekleTemas, toplamHarcama, tumLeadler, upsertLead } from './db.ts';
import { ApifyIstemcisi } from './apify/istemci.ts';
import { topla } from './apify/topla.ts';
import { ACTORLAR, type ActorAdi } from './apify/actors.ts';
import { AYLIK_TAVAN_USD } from './apify/butce.ts';
import { elemedenGecer } from './apify/kanallar/eleme.ts';
import { zenginlestirHepsi } from './enrich/index.ts';
import { katalogParfumSayisi, katalogTohumlari, varsayilanKatalogDizini } from './seed.ts';
import { puanla } from './score.ts';
import { olcekCikar } from './olcek.ts';
import { yazLeadsCsv } from './export/leads.ts';
import { temizAd, yazOutreachCsv } from './export/outreach.ts';
import { yazDmListesi } from './export/dm-listesi.ts';
import { yazIlkTur } from './export/ilk-tur.ts';
import {
  katalogSay, karsilastir, partiAlanAdlari, partiHedefleri, tavandaMi,
} from './export/parti-dogrula.ts';
import { konsolHtml, partiDamgasi } from './export/gonderim-konsolu.ts';
import { hedefKatalogu, olcAdaylar, yazDemoRaporu } from './demo/adaylar.ts';
import { takipAdaylari, takipMetni, EN_AZ_GUN } from './takip.ts';
import {
  adresAdaylari, katalogTaslagi, kayitTaslagi, kiraciKimligi,
} from './demo/taslak.ts';
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
/**
 * Defterin yeri.
 *
 * ⚠️ **`LEADGEN_DB` bir kolaylık değil, sınamanın gerçek deftere yazmasını
 * engelleyen şey.** `temas-argumanlari.test.ts` komutu gerçekten çalıştırıyor;
 * yol sabit kaldığı sürece her koşu canlı deftere sahte bir satır ekliyordu
 * (ölçüldü: iki çöp satır yazıldı ve elle silindi). Tekrar koruması bu deftere
 * bakıyor, yani kirlenmesi sessiz ve zararlı.
 */
const DB_YOLU = process.env.LEADGEN_DB?.trim() || join(VERI, 'leads.db');

const log = (s: string): void => { process.stdout.write(`${s}\n`); };

const KOMUTLAR = [
  'seed', 'topla', 'enrich', 'demo-adaylari', 'kiraci-taslak', 'score', 'export', 'report', 'temas',
  'takip', 'parti-dogrula', 'parti-konsol', 'hepsi',
] as const;
type Komut = typeof KOMUTLAR[number];

interface Secenekler {
  readonly komut: Komut;
  readonly sinir: number | null;
  readonly sonda: boolean;
  readonly onayla: boolean;
  readonly kanal: string | null;
  /** `parti-konsol --sun` — sayfayi localhost'ta sunar (pano guvenli baglam ister). */
  readonly sun: boolean;
  /** Komuttan sonraki serbest argümanlar — `temas <domain> <sonuc>` gibi. */
  readonly argumanlar: readonly string[];
}

function komutOku(): Secenekler {
  const { positionals, values } = parseArgs({
    allowPositionals: true,
    options: {
      sinir: { type: 'string' },
      sonda: { type: 'boolean' },
      onayla: { type: 'boolean' },
      kanal: { type: 'string' },
      sun: { type: 'boolean' },
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
    sun: values.sun === true,
    argumanlar: positionals.slice(1),
  };
}

async function main(): Promise<void> {
  ortamiYukle();
  const { komut, sinir, sonda, onayla, kanal, sun, argumanlar } = komutOku();
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
    /*
      ⚠️ **`as never` kastı GERÇEK bir hatayı gizliyordu (2026-08-20'de
      ölçüldü).** `--kanal` verilmediğinde CLI `null` üretiyor, `topla` ise
      `undefined` bekliyor; `null === undefined` yanlış olduğu için kanal
      listesi `filter(k => k === null)` ile **boşalıyordu**. Sonuç: komut
      hiçbir kanalı koşmuyor ve *"sonda bitti · 0 yeni aday · $0.0000"*
      yazıp başarıyla dönüyordu.

      TypeScript bunu yakalayacaktı (`string | null` ≠ `ActorAdi | undefined`);
      kast onu susturmuştu. Kast kaldırıldı, dönüşüm açıkça yapılıyor ve
      bilinmeyen kanal adı REDDEDILIYOR — sessizce hiçbir şey yapmaktansa
      durmak.
    */
    const kanalAdlari = Object.keys(ACTORLAR) as ActorAdi[];
    let yalnizKanal: ActorAdi | undefined;
    if (kanal !== null) {
      if (!(kanalAdlari as string[]).includes(kanal)) {
        log(`[topla] bilinmeyen kanal "${kanal}" — gecerli: ${kanalAdlari.join('|')}`);
        process.exit(1);
      }
      yalnizKanal = kanal as ActorAdi;
    }

    const rapor = await topla(db, istemci, mod, onayla, log, yalnizKanal);
    log(`[topla] ${rapor.mod} bitti · ${rapor.toplamYeniAday} yeni aday ·`
      + ` bu koşu $${rapor.toplamGercekUsd.toFixed(4)} · yerel defter $${toplamHarcama(db).toFixed(4)}`);
    /*
      ⚠️ Yerel defter EKSIK sayıyor (ölçüldü 2026-08-20: defter $2.03, Apify
      $4.72). Karar verilecek rakam Apify'ınki; ekrana o basılıyor ve kalan
      kredi açıkça yazılıyor.
    */
    if (rapor.apifyAylikUsd !== null) {
      const kalan = AYLIK_TAVAN_USD - rapor.apifyAylikUsd;
      log(`[topla] ⚠️ APIFY'a göre bu ay $${rapor.apifyAylikUsd.toFixed(4)}/$${AYLIK_TAVAN_USD.toFixed(2)}`
        + ` kullanıldı — kalan $${kalan.toFixed(4)}`);
    } else {
      log('[topla] ⚠️ Apify aylık kullanımı OKUNAMADI — kalan kredi bilinmiyor');
    }
    for (const b of rapor.bekleyenOnaylar) log(`[topla] ONAY BEKLIYOR → ${b}`);
  }

  if (komut === 'temas') {
    /*
      Elle yapılan işin kaydı. Tek amacı tekrarı önlemek: aynı kişiye ikinci
      kez aynı mesajı atmak, hiç atmamaktan kötü.
    */
    /*
      ⚠️ **Argümanlar `komutOku`dan geliyor, `process.argv`den DEĞİL — ve bu bir
      hatadan sonra böyle.** Burada bir zamanlar `process.argv.slice(1)` vardı ve
      bir kaydırma yapıyordu: `temas nischengold.com gonderildi` çağrısı deftere
      **domain=`temas`, sonuc=`nischengold.com`** diye yazılıyordu. Komut hata
      vermiyor, hatta makul bir satır basıyordu — yani ilk gerçek mesaj
      kaydedilmemiş, tekrar koruması da sessizce devre dışı kalmıştı. Defterin
      TEK işi tekrarı önlemek olduğu için bu, aracın kendisini işlevsiz kılan
      bir hataydı. `temas-argumanlari.test.ts` kaydırmayı tutuyor.
    */
    /*
      ⚠️ **`otomatik`, `cevap`tan AYRI bir sonuç — ölçülerek ayrıldı
      (2026-08-19).** perfume-parlour.pk'ten DM'e saniyeler içinde bir
      "Assalamualaikum … Welcome to Perfume Parlour" karşılaması geldi: hazır
      yanıt, insan değil. `cevap` diye yazılsaydı karar kuralının saydığı
      sayıyı şişirirdi ve *"iki cevap geldi, metin çalışıyor, 15/güne çık"*
      kararı bir botun üstünde dururdu. Otomatik yanıt yalnız şunu kanıtlıyor:
      mesaj ulaştı ve hesap canlı. Metne dair hiçbir şey söylemiyor.

      ⚠️ **`elendi` ise hiç yazılmayacak dükkânı defterde tutuyor.** Defterin
      dışlama listesi zaten partileri kuruyor; eleme kararı oraya yazılınca
      dükkân bir daha hiçbir partide çıkmıyor ve GEREKÇESI notta duruyor.
      Ilk kullanımı rojadoveperfumery.com oldu: 227 ürünün 96'sı (%42) kendi
      markası, yani dükkân değil parfüm evi. Eleme kuralı (`marka_ortusmesi
      === 1`) 16 markası olduğu için onu görmüyordu.
    */
    const [domain, sonuc, ...notParcalari] = argumanlar;
    if (domain === undefined || sonuc === undefined) {
      log('kullanim: node src/cli.ts temas <domain>'
        + ' <gonderildi|cevap|red|ilgilendi|otomatik|elendi> [not]'
        + ' [--kanal dm|mail|telefon|whatsapp]');
      process.exit(1);
    }
    /*
      ⚠️ **Kanal TAHMIN ediliyordu ve ilk gerçek mail gönderiminde yanlış
      yazdı (2026-08-19).** Eski kural şuydu: dükkânın Instagram'ı varsa `dm`,
      yoksa `mail`. Ama o, dükkâna hangi kanaldan ULAŞILABILECEĞINI söylüyor —
      mesajın hangi kanaldan GITTIĞINI değil. ParfumGroup'a DM'e verdikleri
      adresten mail atıldı; dükkânın Instagram'ı olduğu için defter `dm` yazdı.

      Defterin işi olan biteni kaydetmek; tahmin ettiği anda kayıt olmaktan
      çıkıp varsayım oluyor. `--kanal` verilirse o yazılıyor, verilmezse eski
      türetme **varsayılan olarak** duruyor (partiler DM'den gidiyor).
    */
    const KANALLAR = ['dm', 'mail', 'telefon', 'whatsapp'];
    if (kanal !== null && !KANALLAR.includes(kanal)) {
      log(`[temas] bilinmeyen kanal "${kanal}" — gecerli: ${KANALLAR.join('|')}`);
      process.exit(1);
    }
    const kanalYazilan = kanal
      ?? (tumLeadler(db).find((l) => l.domain === domain)?.instagram === null ? 'mail' : 'dm');
    ekleTemas(db, { domain, kanal: kanalYazilan, sonuc, not: notParcalari.join(' ') || null });
    log(`[temas] ${domain} → ${sonuc} (${kanalYazilan})`);
  }

  if (komut === 'takip') {
    /*
      Cevap gelmeyen dükkânlara TEK hatırlatma.

      ⚠️ **Bu komut mesaj GÖNDERMIYOR** — depoda hiçbir şey göndermiyor ve bu
      pazarlık dışı (`docs/b2b/gonderim-akisi.md`). Listeyi ve tek cümlelik
      metni basıyor; "Gönder"e insan basıyor, sonra `temas` ile deftere
      yazıyor. Deftere yazıldığı an dükkân bu listeden kendiliğinden düşüyor:
      "iki hatırlatma yok" kuralı böyle uygulanıyor.
    */
    const gun = sinir ?? EN_AZ_GUN;
    const adaylar = takipAdaylari(db, tumLeadler(db), new Date(), gun);

    if (adaylar.length === 0) {
      log(`[takip] ${gun} gündür cevapsız bekleyen yok.`);
    } else {
      log(`[takip] ${adaylar.length} dükkân ${gun}+ gündür cevapsız — her birine TEK hatırlatma:
`);
      for (const a of adaylar) {
        const nereye = a.kanal === 'mail' ? (a.email ?? '(adres yok)') : (a.instagram ?? '(hesap yok)');
        log(`  ${a.domain}  ·  ${a.gecenGun} gün  ·  ${a.kanal} → ${nereye}  ·  ${a.dil}`);
        log(`    ${takipMetni(a.dil)}`);
        log(`    kaydet: node src/cli.ts temas ${a.domain} gonderildi "hatirlatma" --kanal ${a.kanal}
`);
      }
    }
  }

  if (komut === 'parti-dogrula') {
    /*
      Akışın pazarlık dışı kuralını araca çeviriyor: "her mesajdan önce kanıt
      adresini AÇ; sayı tutmuyorsa gönderme."

      ⚠️ **Çıkış kodu 1 dönüyor ve bu bilinçli.** Rapor basıp 0 dönseydi
      kayan sayı ekranda kaybolurdu; gönderim günü elli satır arasında bir
      uyarı görülmüyor.
    */
    const dosya = join(VERI, 'ilk-parti.md');
    if (!existsSync(dosya)) {
      log(`[parti-dogrula] ${dosya} yok — once: node scripts/parti-kur.mjs`);
      process.exit(1);
    }
    const alanAdlari = partiAlanAdlari(readFileSync(dosya, 'utf8'));
    const leadler = tumLeadler(db);
    let kayan = 0;
    let okunamayan = 0;

    for (const domain of alanAdlari) {
      const lead = leadler.find((l) => l.domain === domain);
      if (lead?.product_count === null || lead?.product_count === undefined) {
        log(`  ?  ${domain.padEnd(28)} kayitta urun sayisi yok — sayi iddiasi da yok`);
        continue;
      }
      const tavanda = tavandaMi(lead.product_count, lead.notes);
      const bugun = await katalogSay(domain);
      const { durum, aciklama } = karsilastir(lead.product_count, tavanda, bugun);
      if (durum === 'kaymis') kayan += 1;
      if (durum === 'olculemedi') okunamayan += 1;
      const isaret = durum === 'tutuyor' ? 'OK' : (durum === 'kaymis' ? 'KAYMIS' : 'OKUNAMADI');
      log(`  ${isaret.padEnd(9)} ${domain.padEnd(28)} ${aciklama}`);
    }

    log('');
    log(`[parti-dogrula] ${alanAdlari.length} hedef · ${kayan} kaymis · ${okunamayan} okunamadi`);
    if (kayan > 0) {
      log('⚠️ KAYAN SAYI VAR. Duzeltmeden gonderme:');
      log('   veritabanindaki product_count guncellenir, sonra: export + parti-kur');
    }
    if (kayan > 0 || okunamayan > 0) process.exit(1);
  }

  if (komut === 'parti-konsol') {
    /*
      Partiyi Chrome'da açılabilen tek bir yerel sayfaya çeviriyor: her hedefte
      "DM'i aç" (hesap arama yok) ve "metni kopyala". Sunucu ve bağımlılık yok.

      ⚠️ Gönder'e insan basıyor — gerekçe `gonderim-konsolu.ts` başlığında.
    */
    const kaynak = join(VERI, 'ilk-parti.md');
    if (!existsSync(kaynak)) {
      log(`[parti-konsol] ${kaynak} yok — once: node scripts/parti-kur.mjs`);
      process.exit(1);
    }
    const metin = readFileSync(kaynak, 'utf8');
    const hedefler = partiHedefleri(metin);
    if (hedefler.length === 0) {
      log('[parti-konsol] parti dosyasinda hedef bulunamadi');
      process.exit(1);
    }
    /*
      Damga `localStorage` anahtarını ayırıyor: hangi partinin hangi işaretleri
      taşıdığını o belirliyor.

      ⚠️ Tarih TEK BAŞINA yetmiyor ve bu ölçülerek görüldü: 19 Ağustos'ta parti
      dört kez yeniden kuruldu (ölçüm bitti, süzgeç değişti, iki kötü aday
      elendi). Dördü de `Parti kuruldu: 2026-08-19` yazıyordu, yani aynı
      anahtarı paylaşıyorlardı — bir öncekinde işaretlenmiş bir dükkân yeni
      partide **gönderilmiş gibi** görünecekti ve atlanırdı. Sessiz bir kayıp:
      hata vermez, yalnız o dükkâna hiç yazılmaz.

      Hedef listesinin özeti damgaya giriyor: parti içeriği değişince anahtar
      da değişiyor, aynı parti yeniden üretilince işaretler duruyor.
    */
    const tarih = /^Parti kuruldu: (\S+)/m.exec(metin)?.[1] ?? 'parti';
    const damga = partiDamgasi(tarih, hedefler.map((h) => h.domain));
    const cikti = join(VERI, 'gonderim-konsolu.html');
    writeFileSync(cikti, konsolHtml({ hedefler, damga }), 'utf8');

    const dmsiz = hedefler.filter((h) => h.instagram === null).length;
    log(`[parti-konsol] ${cikti} yazildi — ${hedefler.length} hedef (damga ${damga})`);
    if (dmsiz > 0) log(`[parti-konsol] ⚠️ ${dmsiz} hedefte Instagram hesabi yok, DM dugmesi cikmadi`);

    /*
      ⚠️ **`--sun` bir kolaylık değil, ölçülemeyen bir belirsizliği kaldırıyor.**
      Sayfa `file://` ile açılabiliyor ama panoya yazma orada Chrome sürümüne
      göre engellenebiliyor — ve konsolun bütün değeri "metni kopyala"da.
      `localhost` güvenli bağlam sayılıyor, yani pano her koşulda çalışıyor.
      Gerçek tarayıcıda ölçüldü (2026-08-19): `isSecureContext` true, pano
      yazma çalışıyor, konsolda 0 hata.

      Sayfanın kendisinde yine de bir geri düşüş var (metni seçip Ctrl+C),
      çünkü dosyayı elle açan biri bu bayrağı bilmeyebilir.
    */
    if (sun) {
      const { createServer } = await import('node:http');
      const kapi = 4500;
      createServer((_istek, cevap) => {
        cevap.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
        cevap.end(readFileSync(cikti));
      }).listen(kapi, () => {
        log(`[parti-konsol] sunuluyor: http://localhost:${kapi}  (durdurmak icin Ctrl+C)`);
      });
      return;
    }
    log(`[parti-konsol] tarayicida ac: ${cikti}`);
    log('[parti-konsol] pano calismazsa: node src/cli.ts parti-konsol --sun');
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

  if (komut === 'kiraci-taslak') {
    /*
      ⚠️ `hepsi` içinde DEĞİL — ağa çıkıyor ve çıktısı bir satış kararına
      girdi. `demo-adaylari` ile aynı gerekçe.
    */
    const [domain] = argumanlar;
    if (domain === undefined) {
      log('kullanim: node src/cli.ts kiraci-taslak <domain>');
      process.exit(1);
    }

    const lead = tumLeadler(db).find((l) => l.domain === domain);
    if (lead === undefined) {
      log(`[taslak] listede yok: ${domain}`);
      process.exit(1);
    }

    const katalog = await hedefKatalogu(lead);
    if (katalog === null) {
      log(`[taslak] katalog okunamadi: ${domain}`);
      process.exit(1);
    }

    const bizimkiler = osmosParfumleri(varsayilanKatalogDizini());
    const adaylar = adresAdaylari(katalog.urunler, bizimkiler);
    if (adaylar.length === 0) {
      log(`[taslak] ortusen parfum yok — demo kurulamaz: ${domain}`);
      process.exit(1);
    }

    const kimlik = kiraciKimligi(domain);
    const magaza = temizAd(lead.shop_name) ?? kimlik;
    const dizin = join(VERI, `taslak-${kimlik}`);
    mkdirSync(dizin, { recursive: true });
    /*
      ⚠️ Adresler `domain`den DEĞİL, katalogu gerçekten veren host'tan
      kuruluyor — `www.` yalnızca orada var olabiliyor ve olmadığında
      taslağın her adresi 404 dönüyordu.
    */
    writeFileSync(join(dizin, 'catalog.ts'), katalogTaslagi(kimlik, magaza, katalog.host, adaylar));
    writeFileSync(join(dizin, 'kayit.txt'), kayitTaslagi(kimlik, magaza));

    const bakilacak = adaylar.filter((a) => a.adaylar.length > 1 || a.bicimSupheli);
    log(`[taslak] ${adaylar.length} parfum · ${dizin}`);
    log(`[taslak] ${bakilacak.length} adreste birden cok aday var — once onlara bak:`);
    for (const a of bakilacak) {
      log(`  ${a.id} → ${a.secim.handle}`
        + (a.adaylar.length > 1 ? `  (otekiler: ${a.adaylar.filter((x) => x !== a.secim).map((x) => x.handle).join(", ")})` : '')
        + (a.bicimSupheli ? `  ⚠️ BICIM SUPHELI: "${a.secim.baslik}"` : ''));
    }
    log(`[taslak] ⚠️ her adres DOGRULANMADI isaretiyle cikti; tarayicida acmadan silme.`);
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
