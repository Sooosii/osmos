'use client';

import { useEffect, useState } from 'react';
import { acilisiIsaretle, acilistanGecildi, oturumDeposu } from '@/lib/acilis-oturum';
import { prefersReducedMotion } from '@/lib/motion';
import { AcilisTakimyildizi } from './AcilisTakimyildizi';

function setSpaceLocked(locked: boolean) {
  const shell = document.getElementById('osmos-space-shell');
  if (!shell) return;
  if (locked) {
    shell.setAttribute('inert', '');
    shell.setAttribute('aria-hidden', 'true');
    return;
  }
  shell.removeAttribute('inert');
  shell.removeAttribute('aria-hidden');
}

/**
 * Ana sayfanın kapı bekçisi.
 *
 * Sunucu oturum deposunu göremediği için ilk karede sessiz siyah bir karar yüzeyi
 * basılır. İstemci depoyu okuduktan sonra ilk ziyaretçiye takımyıldızı, dönene ise
 * doğrudan uzay gösterilir; böylece dönüşte `0%` durumu bir kareliğine parlamaz.
 */
export function Acilis() {
  const [showOpening, setShowOpening] = useState<boolean | null>(null);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const storage = oturumDeposu();
    const reduceMotion = prefersReducedMotion();
    if (reduceMotion) acilisiIsaretle(storage);
    const shouldShow = !reduceMotion && !acilistanGecildi(storage);
    setSpaceLocked(shouldShow);
    setShowOpening(shouldShow);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  if (showOpening === null) {
    return (
      <div
        data-opening-decision="pending"
        aria-hidden="true"
        className="fixed inset-0 z-70 bg-[#050507]"
      />
    );
  }

  if (!showOpening) return null;

  return (
    <AcilisTakimyildizi
      onEngage={() => acilisiIsaretle(oturumDeposu())}
      onComplete={() => {
        setSpaceLocked(false);
        setShowOpening(false);
      }}
    />
  );
}
