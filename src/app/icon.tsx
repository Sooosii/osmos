import { ImageResponse } from 'next/og';
import { LOGO_BACKGROUND, LOGO_DOTS, LOGO_RADIUS, LOGO_VIEW, logoDotColor } from '@/lib/logo';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

/**
 * Sekme simgesi.
 *
 * Biçim `lib/logo.ts`te; bu dosya yalnızca çiziyor. 32 piksel, çünkü sekmede
 * 16'ya inecek ve geometri o boyuta göre kuruldu.
 */
export default function Icon() {
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
