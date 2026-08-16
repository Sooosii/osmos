/**
 * Seçilen Apify actor'ları ve ÖLÇÜLEN ücretleri.
 *
 * Fiyatlar ve güvenilirlik Apify Store API'sinden okundu (2026-08-15/16);
 * kâğıt üstünden seçilmedi. Apify fiyatı değiştirirse buradaki sayı yanlış
 * olur ve tahmin sapar — bu yüzden sonda çalıştırması ZORUNLU: gerçek
 * maliyet her zaman sondadan öğreniliyor, buradaki sayı yalnız ilk tahmin.
 *
 * ⚠️ Dördü de **olay başı (pay-per-event)** ve ücretsiz krediden düşüyor.
 * Kiralık (rental) model ücretsiz planda çalışmıyor — zaten 1 Ekim 2026'da
 * tamamen kalkıyor.
 *
 * ⚠️ Resmî `apify/*` actor'ları bilerek seçilmedi: aynı iş onlarla ~$12
 * tutuyordu, ücretsiz $5 sınırını aşardı. Seçilenler hem ucuz hem ölçülmüş
 * başarı oranı yüksek.
 */

export interface ActorTanimi {
  readonly id: string;
  readonly amac: string;
  readonly ucretModeli: 'olay-basi';
  readonly birim: string;
  readonly birimUsd: number;
  readonly sabitUsd: number;
  /** Store API'sinden okunan 30 günlük başarı oranı, yüzde. */
  readonly basariYuzde: number;
  readonly not: string;
}

export const ACTORLAR = {
  /*
    ⚠️ RESMI actor'a gecildi. Ucuz olan (`scraperlink`) 2.800 sayfalik tam
    kosunun ORTASINDA kendi aylik ucretsiz sinirina carpti ve her kayit
    yerine su nesneyi dondurmeye basladi:
      {"error":"Free monthly limit reached. Please upgrade to continue."}
    333 kayit geldi, sifir aday cikti. Apify hata VERMEDI; kosu "basarili"
    gorundu. Ders iki katli:
      ① actor'un kendi ucretsiz siniri Apify'in $5'inden AYRI ve habersiz
        doluyor — ucuzu secmek riski de seciyor
      ② veri icindeki hata kayitlari SAYILMAZSA bos sonuc basariya benziyor
    Ikincisi icin `hataliKayitlar` kontrolu eklendi.
  */
  googleArama: {
    id: 'apify/google-search-scraper',
    amac: 'Google arama sonuclari — gomulebilir site bulmanin ana kaynagi',
    ucretModeli: 'olay-basi',
    birim: 'SERP sayfasi (10 sonuc)',
    birimUsd: 0.0018,
    sabitUsd: 0,
    basariYuzde: 99.0,
    not: '$1.80/1000 sayfa · ucretsiz planda CALISIYOR (olculdu) · en az $0.50 kosu tavani istiyor',
  },
  /*
    ⚠️ RESMI actor'lar, ucuzlari DEGIL — ve bu bir tercih degil zorunluluk.
    Ucuz almasiklar denendi ve ucretsiz planda CALISMIYOR:
      scrapesmith → kosu kaydinda "FREE USER detected: hard capped at 0",
                    sifir kayit donduruyor
      apidojo     → {demo: ...} donduruyor, gercek veri yok
      figue       → sifir kayit
    Resmileri denendi ve GERCEKTEN calisti (@scentsplit profilinden
    externalUrl: scentsplit.com cikti). Pahali olan yol tek calisan yol.

    Ders: "ucretsiz planda Store actor'lari kosuyor" genel olarak dogru ama
    her actor kendi sinirini koyabiliyor. Fiyat listesine bakip secmek
    yetmiyor, calistirip gormek gerekiyor.
  */
  instagramHashtag: {
    id: 'apify/instagram-hashtag-scraper',
    amac: 'Hashtag gonderileri — kucuk saticilarin kullanici adlarini toplar',
    ucretModeli: 'olay-basi',
    birim: 'gonderi',
    birimUsd: 0.0019,
    sabitUsd: 0,
    basariYuzde: 99.6,
    not: '$1.90/1000 (Free plan) · ucuz almasiklarin hepsi ucretsiz planda bos donuyor',
  },
  instagramProfil: {
    id: 'apify/instagram-profile-scraper',
    amac: 'Profil — dukkanin kendi adresi biyodaki dis baglantida duruyor',
    ucretModeli: 'olay-basi',
    birim: 'hesap',
    birimUsd: 0.0026,
    sabitUsd: 0,
    basariYuzde: 99.3,
    not: '$2.60/1000 (Free plan) · externalUrl ve biography donduruyor, olculdu',
  },
  etsy: {
    id: 'yumitori/etsy-listings-scraper',
    amac: 'Etsy dukkan ADLARI — kendi alan adlari bedava Google adiminda araniyor',
    ucretModeli: 'olay-basi',
    birim: 'ilan',
    birimUsd: 0.008,
    sabitUsd: 0.00005,
    basariYuzde: 0,
    not: '$8/1000 — en pahali kanal, bu yuzden yalniz 50 kayitlik sonda',
  },
} as const satisfies Record<string, ActorTanimi>;

export type ActorAdi = keyof typeof ACTORLAR;
/**
 * Planlanan tam kadro miktarları — bütçe tahmininin girdisi.
 *
 * ⚠️ Sayılar keyfi değil, tek çalıştırma tavanına ($1.50) göre kırpıldı.
 * Instagram hashtag'i önce 3.500 yazılmıştı: $1.5751 ediyordu ve bütçe
 * kapısı işi REDDEDIYORDU. Sınama bunu ben koşturmadan yakaladı.
 */
export const TAM_KADRO: Readonly<Record<ActorAdi, number>> = {
  googleArama: 800,      // $1.44 — resmi actor pahali, kalan krediye gore kirpildi
  instagramHashtag: 700, // $1.33 — resmi actor pahali, hacim buna gore kirpildi
  instagramProfil: 400,  // $1.04
  etsy: 50,              // $0.40
};                       // tahmin toplami ~$4.17, ucretsiz $5'in altinda

/*
  ⚠️ Google icin tahmin BILEREK yuksek tutuldu. Olculen sayfa basi maliyet
  ilan edilenin onda biri cikti ($0.00005 vs $0.0005) ama tahmini asagi
  cekmek butce kapisini gevsetirdi. Yuksek tahmin guvenli yon: gercek
  harcama her zaman daha az olur, tersi olmaz.
*/

/**
 * Sonda miktarları — gerçek dönüşüm oranını ölçmeye yetecek kadar.
 *
 * ⚠️ Hepsi sonda tavanının ($0.05) altında kalmalı, yoksa sondanın kendisi
 * onay bekler ve akış tıkanır. Etsy 10 kayıtta $0.08 ediyordu; 5'e indi.
 */
export const SONDA: Readonly<Record<ActorAdi, number>> = {
  googleArama: 20,
  instagramHashtag: 20,
  instagramProfil: 10,
  etsy: 5,
};