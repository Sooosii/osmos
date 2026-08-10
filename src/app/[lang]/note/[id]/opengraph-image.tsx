import { ImageResponse } from 'next/og';
import { getNote, hasNote, noteBand } from '@/data/notes';
import { PERFUMES } from '@/data/perfumes';
import { noteColor } from '@/lib/note-marks';
import { noteDots } from '@/lib/share-marks';
import { dictFor, localeFor, say } from '@/i18n/dict';

export const alt = 'OSMOS';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/**
 * Notanın paylaşım kartı — parfümünkiyle aynı iskelet, üç farkla.
 *
 * Işık notanın kendi baskın aile rengi; künye satırı yerine bandı ve tepe
 * dakikası; noktalar ise o notayı taşıyan parfümlerin renkleri — yörüngenin
 * durağan hâli.
 *
 * Parfüm kartından farklı olarak **dile bağlı**: notanın adı ve bant adı iki
 * dilde ayrı.
 *
 * ⚠️ `generateStaticParams` bilerek yok: sayfanın kendisi zaten `{ lang, id }`
 * üretiyor ve görsel aynı segmentte duruyor. Buraya eksik bir liste koymak
 * ikinci bir kaynak açardı.
 */
export default async function Image({
  params,
}: {
  params: Promise<{ lang: string; id: string }>;
}) {
  const { lang, id } = await params;
  if (!hasNote(id)) return new ImageResponse(<div style={{ background: '#050507' }} />, size);

  const locale = localeFor(lang);
  const t = dictFor(lang);
  const note = getNote(id);
  const color = noteColor(note);
  const dots = noteDots(note, PERFUMES);
  const kunye = `${t.bands[noteBand(id)]} · ${note.volatility.peakMinutes}′`;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          background: '#050507',
          padding: '72px 96px',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: '-10%',
            top: '-32%',
            width: '120%',
            height: '125%',
            background: `radial-gradient(50% 50% at 50% 50%, ${color} 0%, rgba(5,5,7,0) 70%)`,
            /* Konum ve güç ekranda ayarlandı — gerekçe parfüm kartında. */
            opacity: 0.7,
            display: 'flex',
          }}
        />

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 22, letterSpacing: 6, color: 'rgba(255,255,255,0.45)' }}>
            {kunye}
          </div>
          <div style={{ fontSize: 88, color: '#fff', marginTop: 18, lineHeight: 1 }}>
            {say(note.name, locale)}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 34 }}>
            {dots.map((dot, index) => {
              const boy = 14 + Math.round(dot.weight * 28);
              return (
                <div
                  key={index}
                  style={{
                    width: boy,
                    height: boy,
                    borderRadius: boy,
                    background: dot.color,
                    opacity: 0.85,
                    display: 'flex',
                  }}
                />
              );
            })}
          </div>
        </div>

        <div
          style={{
            position: 'absolute',
            right: 96,
            bottom: 72,
            fontSize: 18,
            letterSpacing: 7,
            color: 'rgba(255,255,255,0.3)',
            display: 'flex',
          }}
        >
          OSMOS
        </div>
      </div>
    ),
    size,
  );
}
