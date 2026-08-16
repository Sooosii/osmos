import { insetsFromBoxes, type Box, type Insets, type Viewport } from '@/lib/space-camera';

/**
 * Haritanın üstünde duran katmanların ekranda kapladığı yer.
 *
 * ⚠️ **Kadraj bunu bilmek zorunda ve bir zamanlar bilmiyordu.** `fitTo` seçilen
 * parfümü komşularıyla birlikte kareye sığdırıyor, ama payı sabitti (48/72) ve
 * ekranın üstündeki hiçbir katmanı tanımıyordu. Oysa 390×844 telefonda sol
 * kontrol sütunu tek başına **304 × 191 piksel** kaplıyor: payın içine düşen
 * komşu "kadrajda" sayılıyor, ziyaretçi ise onu göremiyordu — sahibin "en
 * köşede kalan parfüm görünmüyor" dediği şey.
 *
 * ⚠️ **Sabit sayı bırakılmadı, ölçü alınıyor** ve gerekçesi `ScreenFrame`in iki
 * kez kırılıp vardığı karar: eşik yazmak, her yeni kontrolde tekrar ayar isteyen
 * bir borç. Panelin boyu üç durumlu düğmeyle değişiyor (iki kaydıraç, dört,
 * hiç), yani bir kez ölçüp saklamak da yetmez — ölçü tam sığdırma anında
 * alınıyor.
 *
 * Katmanlar kendilerini `data-space-*` ile işaretliyor. Seçici kullanmanın
 * sebebi ref zincirinden kaçınmak değil, ÖLÇÜM ANI: sığdırma bir olay
 * işleyicisinin içinde oluyor ve o an DOM zaten yerinde.
 */

/** Ölçülen katmanlar — hepsi `SpaceOverlays`te işaretli. */
const SECICILER = [
  /* Sol sütun: marka, uzay sayacı, giriş metni ve kaydıraçlar. */
  '[data-space-controls]',
  /* Sağ üst: arama, giriş, bildirim, dil. */
  '[data-space-meta]',
  /* Alt orta: küratör cümlesi ve giriş ipucu. */
  '[data-space-caption]',
] as const;

export function olculenPaylar(viewport: Viewport): Insets {
  /* Sunucuda ya da tuval henüz ölçülmemişken varsayılan pay dönüyor. */
  if (typeof document === 'undefined' || viewport.width <= 0 || viewport.height <= 0) {
    return insetsFromBoxes([], viewport);
  }

  const kutular: Box[] = [];
  for (const secici of SECICILER) {
    const element = document.querySelector(secici);
    if (!element) continue;

    const rect = element.getBoundingClientRect();
    kutular.push({ x: rect.x, y: rect.y, width: rect.width, height: rect.height });
  }

  return insetsFromBoxes(kutular, viewport);
}
