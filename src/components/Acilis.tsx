'use client';

import { useState } from 'react';
import type { IntroPoint } from '@/lib/intro-points';
import { AstronotIntro } from './AstronotIntro';
import { IntroOverlay } from './IntroOverlay';

/**
 * Açılışın sırası: astronot → perde → uzay.
 *
 * Sahibin 2026-08-10 kararı: astronot tek başına yetmiyor, eski perde
 * ("süperdi") arkasından gelsin ve **eskisi gibi aynen** oynasın — noktalar
 * uçuşsun, 2.6 saniyede kendiliğinden çekilip uzayın yaklaşma sahnesine
 * bıraksın. Perdenin kendisine dokunulmadı; tek değişen ne zaman kurulduğu.
 *
 * Zamanlamanın iki ucu da yanlıştı, doğrusu ortası:
 *
 * · Baştan kurulamaz — `intro.js` "atla" dinleyicilerini (`wheel`/`scroll`/
 *   `click`, hepsi `once`) kurulduğu anda takıyor; astronotu uğurlayan ilk
 *   kaydırma perdeyi de atlatırdı, sahip perdeyi hiç göremezdi.
 * · Astronot GİTTİKTEN sonra da kurulamaz — 700 ms'lik solma boyunca altta
 *   uzay görünüyordu. Sahip ekranda yakaladı: "önce uzay açılıyor, sonra
 *   perde geliyor."
 *
 * Doğru an uğurlamanın BAŞI (`onLeaving`): perde alta kurulur, astronot
 * (z-70) onun üstünde erir. Uğurlayan kaydırma perde kurulmadan önce
 * yaşandığı için perdenin atla dinleyicilerine hiç değmiyor.
 *
 * Bileşen istemcide, çünkü sıra bir duruma bağlı; ama noktalar yine sunucudan
 * geliyor (`intro-points.ts`, `page.tsx`) — perdenin "gerçek konumları ver"
 * sözleşmesi bozulmuyor.
 */
interface AcilisProps {
  readonly points: readonly IntroPoint[];
}

export function Acilis({ points }: AcilisProps) {
  const [perdeSirasi, setPerdeSirasi] = useState(false);

  return (
    <>
      <AstronotIntro onLeaving={() => setPerdeSirasi(true)} />
      {perdeSirasi && <IntroOverlay points={points} />}
    </>
  );
}
