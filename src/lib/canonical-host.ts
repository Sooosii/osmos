/**
 * Kanonik ana bilgisayar — sitenin tek adresi.
 *
 * Kendi alan adı alındığında (`osmos.me`, 2026-08-11) eski `.vercel.app`
 * adresi **silinemiyor**: Vercel her projeye kalıcı bir tane veriyor ve
 * kaldırma seçeneği yok. Yapılabilecek şey onu kanonik adrese yönlendirmek;
 * pratikte ortadan kalkıyor.
 *
 * Kanonik etiketler zaten arama motoruna doğru adresi söylüyor, ama bu ondan
 * fazlası: eski adresi paylaşmış, yer imine eklemiş ya da duyuru metninden
 * kopyalamış olan **insan** da doğru yere düşüyor.
 *
 * Modül saf: `NextRequest` tanımıyor, yalnız dize alıp karar veriyor.
 */

/**
 * Yönlendirme kuralı yalnızca `.vercel.app` adreslerine uygulanıyor —
 * "kanonik olmayan her ana bilgisayar" DEĞİL.
 *
 * ⚠️ Bu daraltma bir **sonsuz döngüyü** engelliyor. Genel kural yazılsaydı ve
 * Vercel panelinde asıl adres `www.osmos.me` bırakılsaydı şu olurdu:
 * Vercel `osmos.me` → `www.osmos.me` yönlendirir, bu kod `www.osmos.me` →
 * `osmos.me` yönlendirir, tarayıcı iki adres arasında sonsuza kadar gider ve
 * **site tamamen erişilemez** hâle gelir. Panel ayarıyla kodun birbirine ters
 * düşmesi kolay ve sessiz bir hata; kural bu yüzden dar.
 *
 * `www` ↔ apex tercihi Vercel'in kendi işi olarak kalıyor, tek yerde.
 */
function isVercelHost(host: string): boolean {
  return host === 'vercel.app' || host.endsWith('.vercel.app');
}

/**
 * Bu istek kanonik adrese taşınmalı mı?
 *
 * @param host       İsteğin `Host` başlığı.
 * @param canonical  `NEXT_PUBLIC_SITE_URL`in ana bilgisayarı; kurulu değilse `null`.
 * @param vercelEnv  `VERCEL_ENV` — yalnızca `production` yönlendiriliyor.
 *
 * ⚠️ **Önizlemeler dokunulmaz.** Onların adresi de `*.vercel.app` ve
 * yönlendirilseydi her önizleme dağıtımı canlı siteye atlar, yani bir daha
 * hiçbir değişiklik yayına çıkmadan görülemezdi.
 *
 * ⚠️ Kanonik adres kurulu değilken **hiçbir şey yapmıyor.** Bu, kodun
 * ayardan önce yayına çıkabilmesi demek: değişken kurulduğu an kural
 * kendiliğinden devreye giriyor, arada kırık bir durum oluşmuyor.
 */
export function shouldMoveToCanonical(
  host: string | null | undefined,
  canonical: string | null | undefined,
  vercelEnv: string | null | undefined,
): boolean {
  if (!host || !canonical) return false;
  if (vercelEnv !== 'production') return false;
  if (host === canonical) return false;

  return isVercelHost(host) && !isVercelHost(canonical);
}

/** `NEXT_PUBLIC_SITE_URL`den ana bilgisayarı çıkarır; bozuksa `null`. */
export function hostOf(siteUrl: string | null | undefined): string | null {
  const raw = siteUrl?.trim();
  if (!raw) return null;

  try {
    return new URL(raw).host || null;
  } catch {
    return null;
  }
}
