import { ImageResponse } from 'next/og';
import { PERFUMES } from '@/data/perfumes';
import { dictFor } from '@/i18n/dict';
import { mapDots } from '@/lib/share-marks';

export const alt = 'OSMOS';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/**
 * Sitenin sabit kartı — ana sayfa, dizin ve doğrulama ekranları için.
 *
 * ⚠️ **Kart artık haritanın kendisini gösteriyor.** Eskiden düz siyah bir
 * yazıydı: "OSMOS" ve tek satır. Duyuru dalgasından önce bakıldı ve sorun
 * görüldü — Reddit'te, HN'de ve X'te tıklamayı belirleyen şey önizleme
 * görseli, ve o kart sitenin bütün cazibesi olan haritayı hiç göstermiyordu.
 * Siyah bir yazı kartı, görsel olan her şeye tıklama kaybeder.
 *
 * Tuval yok — Satori onu bilmiyor. 52 nokta, yuvarlatılmış birer `div`
 * olarak mutlak konumda; kompozisyon kartındaki çubuk kararının aynısı.
 * Yerleri gerçek: `projectToSpace`, sitedeki haritayla **aynı** hesap.
 *
 * ⚠️ Harita kutusu **kare**, kart dikdörtgen olsa da. İki ekseni ayrı
 * ölçeklemek haritayı gerer ve uzaklıkları yalan yapardı; gerekçe
 * `similarity.ts`te ve sınama `share-marks.test.ts`te.
 */

/** Harita kutusunun kenarı — kartın yüksekliğine sığan kare. */
const BOX = 500;

/**
 * ⚠️ Nokta yerleşimi **modül düzeyinde bir kez** hesaplanıyor.
 *
 * `projectToSpace` 52×52 kosinüs matrisi kurup MDS ve 300 SMACOF yinelemesi
 * çalıştırıyor. Bu rota dinamik: her paylaşım robotu isteğinde yeniden
 * hesaplansaydı kart, sitenin en pahalı ucu olurdu. Veri derleme anında
 * sabit olduğu için sonuç da sabit — bir kez hesaplanıp örnek boyunca
 * saklanıyor.
 */
const DOTS = mapDots(PERFUMES, BOX);

export default async function Image({ params }: { params: Promise<{ lang: string }> }) {
  const t = dictFor((await params).lang);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          background: '#050507',
          padding: '0 72px',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', width: 520 }}>
          <div style={{ fontSize: 84, letterSpacing: 22, color: '#fff', display: 'flex' }}>
            OSMOS
          </div>
          <div
            style={{
              fontSize: 27,
              lineHeight: 1.4,
              color: 'rgba(255,255,255,0.45)',
              marginTop: 28,
              display: 'flex',
            }}
          >
            {t.space.intro(PERFUMES.length)}
          </div>
        </div>

        {/* Harita — kare kutu, noktalar mutlak konumda. */}
        <div
          style={{
            display: 'flex',
            position: 'relative',
            width: BOX,
            height: BOX,
            marginLeft: 'auto',
          }}
        >
          {DOTS.map((dot, index) => (
            <div
              key={index}
              style={{
                position: 'absolute',
                left: dot.x,
                top: dot.y,
                width: dot.size,
                height: dot.size,
                borderRadius: dot.size,
                background: dot.color,
                opacity: dot.opacity,
              }}
            />
          ))}
        </div>
      </div>
    ),
    size,
  );
}
