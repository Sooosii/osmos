/**
 * Etsy kanalı — yalnız SONDA.
 *
 * Actor: `yumitori/etsy-listings-scraper` ($0.008/ilan) — ölçülen en pahalı
 * kanal, kayıt başına Google'dan 16 kat pahalı.
 *
 * ⚠️ Sahibin kararı: küçük tut. Sebebi ücret değil ÜRÜN: Etsy satıcısının
 * widget gömeceği kendi sitesi yok, ürün sayfası Etsy'nin. Bu yüzden burada
 * hedef toplanmıyor — yalnız **dükkân adları** çıkarılıyor ve o adların
 * kendi alan adları bedava Google adımında aranıyor.
 */

export interface EtsyKaydi {
  readonly shopName?: string;
  readonly shop_name?: string;
  readonly seller?: string;
  readonly title?: string;
  readonly url?: string;
}

/** Sondadan tekil dükkân adları — Google'a verilecek arama tohumları. */
export function dukkanAdlari(kayitlar: readonly EtsyKaydi[]): readonly string[] {
  const kume = new Set<string>();
  for (const k of kayitlar) {
    const ad = (k.shopName ?? k.shop_name ?? k.seller ?? '').trim();
    if (ad !== '') kume.add(ad);
  }
  return [...kume].sort();
}

/**
 * Dükkân adını kendi sitesini arayan Google sorgusuna çevirir.
 *
 * "resmi site" değil de alan adı ipucu aranıyor: Etsy satıcısının kendi
 * sitesi çoğu zaman aynı adı taşıyor ve `-etsy.com` ile Etsy'nin kendi
 * sayfaları sonuçtan düşüyor.
 */
export function adtanSorgu(dukkanAdi: string): string {
  return `"${dukkanAdi}" perfume -site:etsy.com`;
}
