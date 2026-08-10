import { ImageResponse } from 'next/og';
import { logoSquare } from '@/lib/logo-image';

const SIZE = 512;

/**
 * Manifest'in büyük simgesi.
 *
 * ⚠️ **Neden `icon.tsx`in bir boyutu değil de ayrı bir rota?** Next'in simge
 * sözleşmesi çok boyutu `generateImageMetadata` ile veriyor ama o zaman
 * adresler `/icon/0`, `/icon/1` oluyor — ve `proxy.ts`teki `ROOT_ASSETS` tam
 * adres eşleştiriyor, yani hepsi dil önekiyle yeniden yazılıp 404 dönerdi.
 * Sabit adresli ayrı bir rota hem listeye yazılabiliyor hem de manifest'te
 * okunur duruyor.
 *
 * 512 Android'in beklediği boyut: ana ekrana eklenen site bu simgeyi kullanıyor.
 * `maskable` DİYE İŞARETLENMİYOR — maskeli simgeler kenarda güvenli boşluk
 * istiyor, bizim üç noktamız kareyi dolduruyor ve maske onları keserdi.
 */
export function GET() {
  return new ImageResponse(logoSquare(SIZE), { width: SIZE, height: SIZE });
}
