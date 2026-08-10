import { ImageResponse } from 'next/og';
import { PERFUMES } from '@/data/perfumes';
import { dictFor } from '@/i18n/dict';

export const alt = 'OSMOS';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/**
 * Sitenin sabit kartı — ana sayfa, dizin ve doğrulama ekranları için.
 *
 * Aile ışığı yok: burada bir parfüm ya da nota yok, uydurma bir renk seçmek
 * kartı yalancı yapardı. Geriye sitenin kendi adı ve kendi cümlesi kalıyor.
 */
export default async function Image({ params }: { params: Promise<{ lang: string }> }) {
  const t = dictFor((await params).lang);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          background: '#050507',
          padding: '72px 96px',
        }}
      >
        <div style={{ fontSize: 96, letterSpacing: 26, color: '#fff', display: 'flex' }}>
          OSMOS
        </div>
        <div
          style={{
            fontSize: 30,
            color: 'rgba(255,255,255,0.4)',
            marginTop: 34,
            maxWidth: 760,
            display: 'flex',
          }}
        >
          {t.space.intro(PERFUMES.length)}
        </div>
      </div>
    ),
    size,
  );
}
