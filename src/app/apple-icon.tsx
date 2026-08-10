import { ImageResponse } from 'next/og';
import { LOGO_BACKGROUND, LOGO_DOTS, LOGO_RADIUS, LOGO_VIEW, logoDotColor } from '@/lib/logo';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

/**
 * Telefon ana ekranı simgesi.
 *
 * Ayrı bir dosya olmak zorunda çünkü **iOS SVG simge kabul etmiyor** ve 180
 * piksellik bir PNG bekliyor. Biçim yine `lib/logo.ts`te — iki dosya, tek
 * kaynak.
 *
 * Köşe yuvarlaması burada da duruyor ama iOS kendi maskesini uyguluyor;
 * zararı yok, altta kalıyor.
 */
export default function AppleIcon() {
  const scale = size.width / LOGO_VIEW;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          position: 'relative',
          background: LOGO_BACKGROUND,
          borderRadius: LOGO_RADIUS * scale,
        }}
      >
        {LOGO_DOTS.map((dot, index) => (
          <div
            key={index}
            style={{
              position: 'absolute',
              left: (dot.cx - dot.r) * scale,
              top: (dot.cy - dot.r) * scale,
              width: dot.r * 2 * scale,
              height: dot.r * 2 * scale,
              borderRadius: dot.r * 2 * scale,
              background: logoDotColor(dot),
              display: 'flex',
            }}
          />
        ))}
      </div>
    ),
    size,
  );
}
