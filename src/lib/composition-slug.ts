/**
 * Kompozisyon adından adres parçası.
 *
 * Kullanıcı adından ayrı bir modül ve kuralları da ayrı: kullanıcı adı
 * `a-z0-9_` ve harfle başlıyor çünkü kimlik; kompozisyon adı ise serbest
 * yazılan bir başlık ("Gece İnciri") ve adrese çevrilmesi gerekiyor.
 *
 * ⚠️ **Türkçe harfler eşleniyor, atılmıyor.** `toLowerCase` Türkçe harfleri
 * olduğu gibi bırakır ve `İ`/`ı` gibi karakterler adreste yüzde-kaçışa
 * dönüşür — okunmaz ve paylaşılamaz bir bağlantı çıkar. Eşleme tablosu bu
 * yüzden var: "Gece İnciri" → `gece-inciri`.
 */
const TR_MAP: Readonly<Record<string, string>> = {
  ç: 'c',
  Ç: 'c',
  ğ: 'g',
  Ğ: 'g',
  ı: 'i',
  İ: 'i',
  ö: 'o',
  Ö: 'o',
  ş: 's',
  Ş: 's',
  ü: 'u',
  Ü: 'u',
};

export const SLUG_MAX = 48;

export function slugify(name: string): string {
  const mapped = [...name.trim()].map((ch) => TR_MAP[ch] ?? ch).join('');

  return mapped
    .toLowerCase()
    /* Aksanlı latin harfleri de sadeleşiyor (é → e). */
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, SLUG_MAX)
    .replace(/-+$/g, '');
}

/**
 * Aynı ad iki kez kullanılırsa sona sayı ekleniyor.
 *
 * ⚠️ Boş çıkan slug'a da bir karşılık gerekiyor: adı yalnızca emoji ya da
 * noktalama olan bir kompozisyon `''` üretir ve adres `/k/` olurdu.
 */
export function uniqueSlug(name: string, taken: readonly string[]): string {
  /*
    ⚠️ Yedek İngilizce, Türkçe değil: bu değer ADRESTE görünüyor
    (`/u/ad/k/composition`) ve sitenin birincil dili İngilizce. Türkçe bir
    yedek, İngilizce gezen birinin bağlantısında sebepsiz Türkçe bir kelime
    bırakırdı.
  */
  const base = slugify(name) || 'composition';
  if (!taken.includes(base)) return base;

  for (let n = 2; n < 1000; n += 1) {
    const candidate = `${base}-${n}`.slice(0, SLUG_MAX);
    if (!taken.includes(candidate)) return candidate;
  }

  return `${base}-${Date.now()}`.slice(0, SLUG_MAX);
}
