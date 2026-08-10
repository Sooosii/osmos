import { ImageResponse } from 'next/og';
import { logoSquare } from '@/lib/logo-image';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

/**
 * Telefon ana ekranı simgesi.
 *
 * Ayrı bir dosya olmak zorunda çünkü **iOS SVG simge kabul etmiyor** ve 180
 * piksellik bir PNG bekliyor. Köşe yuvarlaması çizimde duruyor ama iOS kendi
 * maskesini uyguluyor; zararı yok, altta kalıyor.
 */
export default function AppleIcon() {
  return new ImageResponse(logoSquare(size.width), size);
}
