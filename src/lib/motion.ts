/**
 * Hareket tercihi.
 *
 * Tek satırlık bir sorgu için ayrı dosya açılmasının sebebi iki tüketicisi
 * olması: uzay tuvalindeki kamera yolculuğu (`moveTo`) ve takımyıldızı kapısı.
 * İkisine de kopyalansaydı biri değişip diğeri unutulduğunda farklı tercihler
 * uygulanabilirdi.
 *
 * `lib/` altında duruyor ve bu kuralın istisnası değil: React bilmiyor, saf bir
 * tarayıcı sorgusu. Yalnızca tarayıcıda çağrılabilir — `window` sunucuda yok.
 */
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
