import type { ReactElement } from 'react';
import { LOGO_BACKGROUND, LOGO_DOTS, LOGO_RADIUS, LOGO_VIEW, logoDotColor } from './logo';

/**
 * Simgenin çizimi — bir kez.
 *
 * Üç rota aynı kareyi basıyor: sekme simgesi (32), telefon ana ekranı (180) ve
 * manifest'in büyük simgesi (512). Çizim üçünde de aynı olmak zorunda; ayrı
 * ayrı yazılsaydı biri düzeltilip öbürleri unutulduğunda site sekmede başka,
 * ana ekranda başka görünürdü.
 *
 * ⚠️ Buradaki stil sözlüğü **Satori'nin** anladığı alt küme (`next/og`): tuval
 * yok, `position/left/top/width/height` ve `borderRadius` var. Biçimin kendisi
 * (`lib/logo.ts`) 32 birimlik bir karede tanımlı; ölçek burada uygulanıyor.
 */
export function logoSquare(pixels: number): ReactElement {
  const scale = pixels / LOGO_VIEW;

  return (
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
  );
}
