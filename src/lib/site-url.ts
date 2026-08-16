/**
 * Sitenin taban adresi — saf, tek kaynak.
 *
 * Sitemap ve paylaşım görselleri mutlak adres istiyor; sayfalar istemiyor. Tek
 * yerden okunması, yayına çıkıldığı gün değişecek tek satırın burada olması
 * demek.
 *
 * ⚠️ Varsayılan **bilerek** `localhost`. Uydurma bir alan adı yazmak, yayına
 * çıkıldığı gün kimsenin fark etmeyeceği yanlış bir sitemap üretirdi: yanlış
 * adres sessizce çalışır, eksik adres çalışmaz ve fark edilir.
 */
import { withLocale, type Locale } from '@/i18n/locale';
import { aktifDiller } from '@/lib/tenant';

const FALLBACK = 'http://localhost:3000';

/**
 * Adres üç kaynaktan, bu sırayla:
 *
 *   1. `NEXT_PUBLIC_SITE_URL` — açıkça yazılan. Kendi alan adı alındığı gün
 *      tek yapılacak şey bu.
 *   2. `VERCEL_PROJECT_PRODUCTION_URL` — barındırıcının derleme anında kendi
 *      doldurduğu adres, protokolsüz (`osmos.vercel.app`). Bunu okumak ilk
 *      yayında sitemap'in doğru çıkmasını sağlıyor; yoksa site canlıya
 *      `localhost` yazan bir sitemap'le çıkardı ve bunu kimse fark etmezdi.
 *   3. `localhost` — geliştirme.
 *
 * ⚠️ İkinci kaynak barındırıcıya özel ve bu bilinçli bir bağ: **yedek**, kural
 * değil. Başka bir yere taşınırsa birincisi yazılır ve hiçbir şey değişmez.
 * Bu modül yalnızca sunucuda çalışıyor (sitemap, robots, metadata), o yüzden
 * `NEXT_PUBLIC_` öneki olmayan bir değişkeni okumak güvenli.
 */
export function siteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/+$/, '');

  const hosted = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (hosted) return `https://${hosted.replace(/\/+$/, '')}`;

  return FALLBACK;
}

/** Öneksiz bir yolu mutlak adrese çevirir. */
export function absolute(path: string): string {
  return `${siteUrl()}${path}`;
}

/**
 * Bir sayfanın iki dildeki mutlak adresleri — `alternates.languages` için.
 *
 * Sitemap aynı bilgiyi ayrıca veriyor ve bu bir tekrar değil: arama motoru
 * ikisini birden okuyor ve sitemap tek başına yeterli sayılmıyor. Kaynak yine
 * tek — ikisi de `withLocale` ile bu modülden geçiyor.
 */
export function languageAlternates(path: string): Record<Locale, string> {
  return Object.fromEntries(
    aktifDiller().map((locale) => [locale, absolute(withLocale(locale, path))]),
  ) as Record<Locale, string>;
}

/**
 * Sayfaların ortak `alternates` bloğu: hreflang + RSS otokeşfi.
 *
 * ⚠️ Otokeşif bağlantısı düzene (`[lang]/layout.tsx`) KONULAMAZ: Next
 * metadata'yı anahtar düzeyinde birleştiriyor ve altı sayfanın altısı da
 * kendi `alternates`ını tanımlıyor — çocuğun bloğu ebeveyninkini komple
 * eziyor, düzendeki `types` hiçbir sayfada görünmüyordu. Tek kaynak bu
 * yardımcı; sayfalar `languages`ı tek başına kurmaya dönerse besleme
 * bağlantısı o sayfadan sessizce düşer.
 */
export function pageAlternates(
  path: string,
  locale: Locale,
): {
  readonly canonical: string;
  readonly languages: Record<Locale, string>;
  readonly types: Readonly<Record<string, string>>;
} {
  return {
    /*
      ⚠️ **Kendine işaret eden canonical — sorgu parametreleri yüzünden şart.**

      Uzay sayfası adreste iki parametre taşıyor: `?mark=<id>` (parfüm
      sayfasından dönüş, 52 değer) ve `?feel=0.9,,0.2` (kaydıraç tarifi,
      sonsuz değer). Bunların her biri arama motoru için AYRI bir adres;
      canonical olmadan sitenin en önemli sayfası onlarca kopya hâlinde
      indekslenebilir ve hiçbiri diğerinin gücünü almaz.

      Canonical parametresiz yolu gösteriyor, hepsi tek sayfada birleşiyor.

      Dil parametre olarak alınıyor çünkü **her dilin kendi canonical'ı var**:
      `/tr/notes`ın kanoniği kendisi, `/notes` değil. İkisini birbirine
      işaret ettirmek, Türkçe sayfayı indeksten silmek olurdu — hreflang
      zaten ikisini eşleştiriyor.
    */
    canonical: absolute(withLocale(locale, path)),
    languages: languageAlternates(path),
    types: { 'application/rss+xml': '/feed.xml' },
  };
}
