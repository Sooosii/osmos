import { ImageResponse } from 'next/og';
import { logoSquare } from '@/lib/logo-image';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

/**
 * Sekme simgesi.
 *
 * 32 piksel, çünkü sekmede 16'ya inecek ve geometri o boyuta göre kuruldu.
 * Çizim `lib/logo-image.tsx`te; bu dosya yalnızca boyutu söylüyor.
 */
export default function Icon() {
  return new ImageResponse(logoSquare(size.width), size);
}
