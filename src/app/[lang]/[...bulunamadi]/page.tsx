import type { Metadata } from 'next';
import { NotFoundBody } from '@/components/NotFoundBody';

/**
 * Haritada olmayan adresleri yakalayan rota.
 *
 * ⚠️ **Bu bir hile değil, zorunluluk — ve bedeli var.** Kök düzenimiz üst
 * düzey bir dinamik segmentte (`app/[lang]/layout.tsx`) ve Next'in kendi
 * belgesi bu durumu adıyla anıyor: öyle bir yapıda `not-found` sınırı
 * eşleşmeyen adresleri yakalayamıyor. Denenenler ve sonuçları:
 *
 *   · `[lang]/not-found.tsx` (istemci bileşeni)        → hiç kullanılmadı
 *   · `[lang]/not-found.tsx` (sunucu bileşeni)         → hiç kullanılmadı
 *   · `app/global-not-found.tsx` + deneysel bayrak     → bayrak derlemede
 *     tanındı ("✓ globalNotFound") ama dosya hiç derlenmedi
 *   · yakalayıcı rota + `notFound()`                   → 404 durumu doğru
 *     geldi ama arayüz yine çıplak kabuk oldu; sınır her hâlükârda çalışmıyor
 *
 * Kalan yol sınırı hiç kullanmamak: sayfa 404 arayüzünü **doğrudan** çiziyor.
 *
 * ⚠️ **Bedeli HTTP durum kodu.** Bu sayfa 404 değil 200 dönüyor; arama
 * motorları buna "soft 404" diyor. Karşılığında `robots: noindex` var, yani
 * sayfa dizine girmiyor. Ziyaretçi doğru sayfayı görüyor, arama motoru onu
 * saymıyor — ama durum kodu yine de yanlış ve bu bilerek kabul edilmiş bir
 * ödün. Next bu yapıda ikisini birden vermiyor.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: true },
};

export default function Bulunamadi() {
  return <NotFoundBody />;
}
