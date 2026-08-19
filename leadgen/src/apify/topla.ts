/**
 * Toplama yöneticisi — Apify kanallarını bütçe kapısının arkasından koşturur.
 *
 * Akış her kanal için aynı ve sırası sahibin kuralı:
 *   sonda → gerçek dönüşümü ölç → tahmini düzelt → SOR → ancak onayla koş.
 *
 * ⚠️ Bu modül hiçbir koşuyu kendiliğinden başlatmıyor. `onaylandi` bayrağı
 * gelmeden `mod: 'tam'` çağrısı bile yalnız tahmin üretip duruyor.
 */
import type { DatabaseSync } from 'node:sqlite';
import { ekleHarcama, upsertLead } from '../db.ts';
import type { Durum } from '../types.ts';
import { ACTORLAR, SONDA, TAM_KADRO, type ActorAdi } from './actors.ts';
import { AYLIK_TAVAN_USD, butceKapisi, tahminKur, type Karar } from './butce.ts';

/** Ay sonuna kadar dokunulmadan bırakılacak kredi payı. */
const KREDI_TABANI = 0.4;
import type { ApifyIstemcisi } from './istemci.ts';
import {
  actorGirdisi, hataliKayitlar, serptenAdaylar, sorgulariUret, ulkeyeGoreGrupla,
  type Aday, type SerpKaydi,
} from './kanallar/google.ts';
import {
  gonderilerdenKullanicilar, HASHTAGLER, profillerdenAdaylar,
  type GonderiKaydi, type ProfilKaydi,
} from './kanallar/instagram.ts';
import { adtanSorgu, dukkanAdlari, type EtsyKaydi } from './kanallar/etsy.ts';

export type Mod = 'sonda' | 'tam';

export interface KanalSonucu {
  readonly kanal: ActorAdi;
  readonly karar: Karar;
  readonly istenenAdet: number;
  readonly gelenKayit: number;
  readonly yeniAday: number;
  readonly elenen: number;
  readonly tekrar: number;
  /** Apify'a sorulan gerçek harcama; ölçülemezse `null`. */
  readonly gercekUsd: number | null;
  readonly tahminUsd: number;
}

export interface ToplamaRaporu {
  readonly mod: Mod;
  readonly kanallar: readonly KanalSonucu[];
  readonly toplamYeniAday: number;
  readonly toplamGercekUsd: number;
  readonly bekleyenOnaylar: readonly string[];
  /**
   * Apify'ın KENDI aylık kullanım rakamı — ölçülemezse `null`.
   *
   * ⚠️ **Yerel `spend` defteri gerçeği söylemiyor ve bu ölçüldü (2026-08-20):
   * defter $2.03 derken Apify $4.72 diyordu.** Aradaki $2.69 muhtemelen
   * actor ücreti dışındaki platform kullanımı; ne olursa olsun defter EKSIK.
   *
   * Bütçe kapısı zaten Apify'ın rakamını okuyor, yani harcama güvende. Asıl
   * risk İNSANDA: komutun bastığı "toplam $2.03" satırına bakan kişi $3
   * kaldığını sanır, oysa kalan $0.28'di. Bu yüzden gerçek rakam rapora
   * konuluyor ve ekrana basılıyor.
   */
  readonly apifyAylikUsd: number | null;
}

type Log = (s: string) => void;

/**
 * Adayları veritabanına yazar; kaç tanesinin YENİ olduğunu döndürür.
 *
 * ⚠️ **Var olan adayın `durum`u KORUNUYOR — ölçülmüş bir hasardan sonra
 * (2026-08-20).** Burada her adaya `durum: 'yeni'` yazılıyordu ve
 * `upsertLead` o alanı COALESCE'siz basıyor. Sonuç: bir kanal daha önce
 * zenginleştirilmiş bir alan adını yeniden görünce **zenginleştirme durumu
 * siliniyordu.**
 *
 * Bedeli sessiz ve gerçek: `durum` `zenginlestirildi` olmayan aday
 * `demo-adaylari`nın süzgecinden ve gönderim listelerinden düşüyor. Yani
 * "yeni aday topla" komutu, eldeki adayları listeden DÜŞÜRÜYORDU. Tek bir
 * sondada 36 aday böyle geri gitti.
 *
 * ⚠️ Aynı gerekçe `source` için de geçerli olurdu ama orada `upsertLead`
 * zaten dokunmuyor; kural yalnız `durum`da kırıktı.
 */
function adaylariYaz(
  db: DatabaseSync,
  adaylar: readonly Aday[],
  instagramlar?: ReadonlyMap<string, string>,
): number {
  const mevcutDurum = new Map<string, Durum>(
    (db.prepare('SELECT domain, durum FROM leads').all() as unknown as {
      domain: string; durum: Durum;
    }[]).map((r) => [r.domain, r.durum]),
  );
  let yeni = 0;
  for (const a of adaylar) {
    const onceki = mevcutDurum.get(a.domain);
    if (onceki === undefined) yeni += 1;
    upsertLead(db, {
      domain: a.domain,
      shop_name: a.shopName === '' ? null : a.shopName,
      seed_url: a.seedUrl,
      source: a.kaynak,
      /* Yeni alan adı 'yeni' başlar; var olanın durumu OLDUĞU GIBI kalır. */
      durum: onceki ?? 'yeni',
      instagram: instagramlar?.get(a.domain) ?? null,
    });
  }
  return yeni;
}

/** Bir kanalın bütçe kararını üretir — koşuyu BAŞLATMAZ. */
function kanalKarari(kanal: ActorAdi, mod: Mod, aylikHarcanan: number, onaylandi: boolean) {
  const a = ACTORLAR[kanal];
  const adet = mod === 'sonda' ? SONDA[kanal] : TAM_KADRO[kanal];
  const tahmin = tahminKur(a.id, a.birim, adet, a.birimUsd, a.sabitUsd);
  return { a, adet, tahmin, karar: butceKapisi(tahmin, aylikHarcanan, onaylandi) };
}

interface KosuCiktisi {
  readonly gelenKayit: number;
  readonly yeniAday: number;
  readonly elenen: number;
  readonly tekrar: number;
}

/** Tek sorgu için istenecek en fazla sonuç — actor sayfa başına 10 veriyor. */
const SORGU_BASI_SONUC = 100;

/**
 * Google: sorgular → SERP → aday alan adları.
 *
 * ⚠️ Bir koşu = bir pazar. Actor tek bir `gl`/`hl` alıyor, o yüzden sorgular
 * ülkeye göre gruplanıp her grup ayrı koşuyor. Tek koşuda gönderilseydi
 * Türkçe sorgu Amerika sonuçlarıyla dönerdi.
 */
async function googleKos(
  db: DatabaseSync, istemci: ApifyIstemcisi, adet: number, ekSorgular: readonly string[], tavanUsd: number,
): Promise<KosuCiktisi> {
  const tumSorgular = sorgulariUret();
  const gruplar = [...ulkeyeGoreGrupla(tumSorgular)];
  /*
    ⚠️ Boyutlandırma tek koşunun TAVANINA göre yapılıyor, sorgu sayısına
    göre değil. İlk sürüm her sorguya 10 sayfa isteyip tek koşuya 460 sayfa
    bindirdi; maliyet tavanı aştı ve Apify koşuyu ABORTED etti — ne veri
    geldi ne de hata anlaşıldı. Sayfa bütçesi önce gruplara, sonra grup
    içinde sorgulara bölünüyor.
  */
  const sayfaPayi = Math.max(1, Math.floor(adet / Math.max(1, gruplar.length)));
  const cikti = { gelenKayit: 0, yeniAday: 0, elenen: 0, tekrar: 0 };

  for (const [ulke, tumGrup] of gruplar) {
    /*
      ⚠️ Sorgu sayısı da kırpılıyor. Her sorgu en az bir sayfa istiyor, yani
      46 sorgulu bir grup küçük bir bütçeyle bile 46 sayfa harcıyor. Sonda
      bütçesi bu yüzden 20 sayfa yerine 322 sayfaya çıkmıştı — sınama yakaladı.
    */
    const grup = tumGrup.slice(0, Math.max(1, Math.min(tumGrup.length, sayfaPayi)));
    const sayfaBasinaSorgu = Math.max(1, Math.floor(sayfaPayi / grup.length));
    const girdi = actorGirdisi(grup, sayfaBasinaSorgu * 10);
    if (ekSorgular.length > 0 && ulke === gruplar[0]?.[0]) {
      const mevcut = String(girdi["queries"]);
      girdi["queries"] = [mevcut, ...ekSorgular].join(String.fromCharCode(10));
    }
    /*
      ⚠️ Her grup arasında kalan kredi YENİDEN okunuyor.
      Sebep ölçüldü ve pahalıya patladı: Apify tavan için $0.50 alt sınırı
      dayatıyor, yani 16 küçük koşuya tavan koymak aslında 16 × $0.50 = $8
      izin vermek demek. Koşu başına tavan, ÇOK SAYIDA KÜÇÜK koşuda bütçe
      aracı değil. Gerçek koruma, koşular arasında krediyi ölçüp durmak.
    */
    const kalanKredi = await istemci.aylikKullanimUsd();
    if (kalanKredi !== null && kalanKredi >= AYLIK_TAVAN_USD - KREDI_TABANI) {
      throw new Error(
        `kredi tabanina inildi ($${kalanKredi.toFixed(2)}/$${AYLIK_TAVAN_USD}), kalan gruplar atlandi`,
      );
    }
    const beklenenSayfa = grup.length * sayfaBasinaSorgu;
    const grupTavani = Math.max(tavanUsd / gruplar.length, beklenenSayfa * ACTORLAR.googleArama.birimUsd * 1.5);
    const { kayitlar } = await istemci.calistir<SerpKaydi>(
      ACTORLAR.googleArama.id, girdi, beklenenSayfa, grupTavani,
    );
    const hatalar = hataliKayitlar(kayitlar);
    if (hatalar.length > 0 && hatalar.length >= kayitlar.length / 2) {
      throw new Error(`actor veri yerine hata dondurdu (${hatalar.length}/${kayitlar.length}): ${hatalar[0]}`);
    }
    const hasat = serptenAdaylar(kayitlar);
    cikti.gelenKayit += kayitlar.length;
    cikti.yeniAday += adaylariYaz(db, hasat.adaylar);
    cikti.elenen += hasat.elenen;
    cikti.tekrar += hasat.tekrar;
  }
  return cikti;
}

/** Instagram hashtag: gönderiler → tekil kullanıcı adları (profil adımının girdisi). */
async function instagramHashtagKos(
  istemci: ApifyIstemcisi, adet: number, tavanUsd: number,
): Promise<KosuCiktisi & { readonly kullanicilar: readonly string[] }> {
  const { kayitlar } = await istemci.calistir<GonderiKaydi>(
    ACTORLAR.instagramHashtag.id,
    {
      hashtags: [...HASHTAGLER],
      resultsLimit: Math.max(1, Math.ceil(adet / HASHTAGLER.length)),
      resultsType: 'posts',
    },
    adet,
    tavanUsd,
  );
  const kullanicilar = gonderilerdenKullanicilar(kayitlar);
  return { gelenKayit: kayitlar.length, yeniAday: 0, elenen: 0, tekrar: 0, kullanicilar };
}

/** Instagram profil: kullanıcı adları → biyodaki site adresi → aday. */
async function instagramProfilKos(
  db: DatabaseSync, istemci: ApifyIstemcisi, kullanicilar: readonly string[], adet: number, tavanUsd: number,
): Promise<KosuCiktisi> {
  const secilen = kullanicilar.slice(0, adet);
  if (secilen.length === 0) return { gelenKayit: 0, yeniAday: 0, elenen: 0, tekrar: 0 };
  const { kayitlar } = await istemci.calistir<ProfilKaydi>(
    ACTORLAR.instagramProfil.id, { usernames: secilen }, adet, tavanUsd,
  );
  const hasat = profillerdenAdaylar(kayitlar);
  return {
    gelenKayit: kayitlar.length,
    yeniAday: adaylariYaz(db, hasat.adaylar, hasat.instagramlar),
    elenen: hasat.elenen,
    tekrar: hasat.tekrar,
  };
}

/** Etsy: sonda → dükkân adları → Google'a verilecek ek sorgular. */
async function etsyKos(
  istemci: ApifyIstemcisi, adet: number, tavanUsd: number,
): Promise<KosuCiktisi & { readonly ekSorgular: readonly string[] }> {
  const { kayitlar } = await istemci.calistir<EtsyKaydi>(
    ACTORLAR.etsy.id,
    { queries: ['perfume decant', 'perfume samples'], maxResults: adet, maxPages: 1 },
    adet,
    tavanUsd,
  );
  const adlar = dukkanAdlari(kayitlar);
  return {
    gelenKayit: kayitlar.length, yeniAday: 0, elenen: 0, tekrar: 0,
    ekSorgular: adlar.map(adtanSorgu),
  };
}

/**
 * Bütün kanalları sırayla koşturur.
 *
 * ⚠️ Sıra rastgele değil: Etsy önce koşuyor çünkü çıkardığı dükkân adları
 * Google'ın ek sorguları oluyor; Instagram hashtag'i profilden önce koşuyor
 * çünkü kullanıcı adlarını o üretiyor.
 */
export async function topla(
  db: DatabaseSync,
  istemci: ApifyIstemcisi,
  mod: Mod,
  onaylandi: boolean,
  log: Log,
  yalnizKanal?: ActorAdi,
): Promise<ToplamaRaporu> {
  const kanallar: KanalSonucu[] = [];
  const bekleyenOnaylar: string[] = [];
  const runId = `${mod}-${Date.now()}`;
  let ekSorgular: readonly string[] = [];
  let kullanicilar: readonly string[] = [];
  let toplamGercek = 0;

  const baslangic = await istemci.aylikKullanimUsd();
  let aylikHarcanan = baslangic ?? 0;
  if (baslangic === null) {
    log('[topla] ⚠️ aylık kullanım Apify\'dan okunamadı; harcama hesaplanan tahminle yazılacak');
  }

  const tumSira: readonly ActorAdi[] = ['etsy', 'googleArama', 'instagramHashtag', 'instagramProfil'];
  /*
    ⚠️ Tek kanal koşturabilmek gerekiyor: bir kanal düşüp ötekiler başarıyla
    bittiğinde hepsini baştan koşturmak, çalışanlar için İKİNCİ kez para
    ödemek demek.
  */
  /*
    ⚠️ **Boş liste bir kez SESSIZCE oluştu ve komutu işlevsiz yaptı.** Kural
    `yalnizKanal === undefined` idi; çağıran taraf `null` geçince eşitlik
    tutmadı, filtre hiçbir kanalla eşleşmedi ve `topla` *"0 yeni aday ·
    $0.0000"* yazıp başarıyla döndü. Yani "yeni aday bul" komutu hiçbir şey
    yapmıyordu ve bunu söylemiyordu.

    Artık YOKLUK (undefined/null/boş) "hepsini koş" demek; kanal verilmişse
    ve hiçbiriyle eşleşmiyorsa aşağıda patlıyor — sessizce boş dönmüyor.
  */
  const sira = yalnizKanal ? tumSira.filter((k) => k === yalnizKanal) : tumSira;
  if (sira.length === 0) {
    throw new Error(`topla: bilinmeyen kanal "${String(yalnizKanal)}" — hicbir kanal kosmayacakti`);
  }

  for (const kanal of sira) {
    const { a, adet, tahmin, karar } = kanalKarari(kanal, mod, aylikHarcanan, onaylandi);

    if (karar.izin !== 'evet') {
      log(`[topla] ${a.id} → ${karar.izin.toUpperCase()}: ${karar.sebep}`);
      if (karar.izin === 'onay-gerek') bekleyenOnaylar.push(karar.sebep);
      kanallar.push({
        kanal, karar, istenenAdet: adet, gelenKayit: 0, yeniAday: 0,
        elenen: 0, tekrar: 0, gercekUsd: null, tahminUsd: tahmin.toplamUsd,
      });
      continue;
    }

    log(`[topla] ${a.id} koşuyor — ${adet} ${a.birim} (tahmin $${tahmin.toplamUsd.toFixed(4)})`);
    const oncesi = await istemci.aylikKullanimUsd();
    let cikti: KosuCiktisi;

    /*
      ⚠️ Kanal hatası bütün koşuyu ÖLDÜRMÜYOR. Bir actor'ın girdi biçimi
      değişirse ya da geçici olarak düşerse, diğer üç kanaldan gelen adaylar
      da çöpe gitmemeli — hepsi ayrı ayrı para harcanmış işler. Hata yutulmuyor,
      loga ve kanal raporuna yazılıyor.
    */
    try {
      /* Sert tavan: tahmin + %25 pay. Tahmin sasarsa Apify durduruyor. */
      const tavanUsd = tahmin.toplamUsd * 1.25;
      if (kanal === 'etsy') {
        const r = await etsyKos(istemci, adet, tavanUsd);
        ekSorgular = r.ekSorgular;
        cikti = r;
      } else if (kanal === 'googleArama') {
        cikti = await googleKos(db, istemci, adet, ekSorgular, tavanUsd);
      } else if (kanal === 'instagramHashtag') {
        const r = await instagramHashtagKos(istemci, adet, tavanUsd);
        kullanicilar = r.kullanicilar;
        cikti = r;
      } else {
        cikti = await instagramProfilKos(db, istemci, kullanicilar, adet, tavanUsd);
      }
    } catch (e) {
      const sebep = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
      log(`[topla] ${a.id} → HATA, atlanıyor: ${sebep}`);
      kanallar.push({
        kanal, karar: { izin: 'hayir', sebep }, istenenAdet: adet, gelenKayit: 0,
        yeniAday: 0, elenen: 0, tekrar: 0, gercekUsd: null, tahminUsd: tahmin.toplamUsd,
      });
      continue;
    }

    const sonrasi = await istemci.aylikKullanimUsd();
    const gercek = oncesi !== null && sonrasi !== null ? Math.max(0, sonrasi - oncesi) : null;
    const yazilan = gercek ?? tahmin.toplamUsd;
    toplamGercek += yazilan;
    if (sonrasi !== null) aylikHarcanan = sonrasi;

    ekleHarcama(db, { run_id: runId, actor: a.id, unit: a.birim, units: adet, usd: yazilan });
    log(`[topla] ${a.id} bitti — ${cikti.gelenKayit} kayıt, ${cikti.yeniAday} yeni aday,`
      + ` ${cikti.elenen} elendi, ${cikti.tekrar} tekrar · harcama`
      + ` $${yazilan.toFixed(4)}${gercek === null ? ' (hesaplanan)' : ' (ölçülen)'}`);

    kanallar.push({
      kanal, karar, istenenAdet: adet, gelenKayit: cikti.gelenKayit,
      yeniAday: cikti.yeniAday, elenen: cikti.elenen, tekrar: cikti.tekrar,
      gercekUsd: gercek, tahminUsd: tahmin.toplamUsd,
    });
  }

  return {
    mod,
    kanallar,
    toplamYeniAday: kanallar.reduce((s, k) => s + k.yeniAday, 0),
    toplamGercekUsd: toplamGercek,
    bekleyenOnaylar,
    apifyAylikUsd: await istemci.aylikKullanimUsd(),
  };
}
