'use client';

import { useEffect, useState } from 'react';
import type { IntroPoint } from '@/lib/intro-points';
import { acilisiIsaretle, acilistanGecildi, oturumDeposu } from '@/lib/acilis-oturum';
import { AstronotIntro } from './AstronotIntro';
import { IntroOverlay } from './IntroOverlay';

/**
 * Açılışın sırası: astronot → perde → uzay. Dönenler için: doğrudan uzay.
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
 * **Dönenlere kapı yok.** Aynı oturumda kapıdan bir kez geçildiyse burası hiç
 * çizilmiyor; nota ya da parfüm sayfasından dönen göz doğrudan uzaya açılıyor
 * (`acilis-oturum.ts`, gerekçesi orada). Yaklaşma sahnesi de aynı bayrağı
 * okuyor, yani dönüşte üç adımın üçü birden atlanıyor.
 *
 * ⚠️ Bayrak **render sırasında okunamaz.** Sunucu ile istemci aynı ilk hâli
 * çizmek zorunda; oturum deposu sunucuda yok. Bu yüzden karar bir etkide
 * veriliyor ve dönüş ziyaretinde kapı bir kare boyunca duruyor — görünmüyor,
 * çünkü kapının zemini de altındaki uzayın zemini de siyah.
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
  const [atla, setAtla] = useState(false);

  /*
   * ⚠️ `react-hooks/set-state-in-effect` burada bilerek kapalı — `SpaceFeelSliders`
   * ile aynı gerekçe. Kuralın kaçındığı şey türetilebilir durumu etkiyle
   * senkronlamak; buradaki durum türetilemiyor, çünkü kaynağı DIŞARIDA (oturum
   * deposu) ve render sırasında okumak sunucu ile istemciyi ayırıp hidrasyonu
   * kırıyor. Etki bir kez çalışıyor; bayrak sayfa açıkken kendiliğinden
   * değişmiyor, yazan da biziz.
   */
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (acilistanGecildi(oturumDeposu())) setAtla(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  if (atla) return null;

  return (
    <>
      <AstronotIntro
        onLeaving={() => {
          setPerdeSirasi(true);
          // Kapı bu anda "geçilmiş" sayılıyor: sahip hamlesini yaptı, perdenin
          // bitmesini beklemeye gerek yok — ortasında ayrılan da geri dönünce
          // baştan izlemesin.
          acilisiIsaretle(oturumDeposu());
        }}
      />
      {perdeSirasi && <IntroOverlay points={points} />}
    </>
  );
}
