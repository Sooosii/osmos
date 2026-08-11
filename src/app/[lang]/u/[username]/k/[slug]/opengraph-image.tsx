import { ImageResponse } from 'next/og';
import { getNote } from '@/data/notes';
import { publicComposition } from '@/lib/dal';
import { nearestToComposition } from '@/lib/composition';
import { cardsFor } from '@/lib/perfume-cards';
import { noteColor } from '@/lib/note-marks';
import { normalizeUsername } from '@/lib/username';

export const alt = 'OSMOS';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/**
 * Bir kompozisyonun paylaşım kartı — büyüme motorunun asıl parçası.
 *
 * Kişi kendi kurduğu şeyi paylaşıyor; bağlantıya tıklayan siteye giriyor ve
 * aynı aracı deneyebiliyor. Kart bu yüzden "bir şey yapılmış" hissi vermeli:
 * notalar katmanıyla, en yakın parfüm, ve kompozisyonun adı.
 *
 * ⚠️ **Satori tuval bilmiyor** ve buradaki çizim ona göre: yalnızca kutular,
 * daireler ve yazı. Evrim eğrisi taşınamıyor — sitedeki karşılığı canvas
 * ve bu sınır paylaşım katı turunda ölçülmüştü. Eğrinin yerine notaların
 * **ağırlık çubukları** kondu: aynı bilgiyi taşıyan, çizilebilir biçim.
 *
 * ⚠️ Gizli profilin kompozisyonunun kartı da yok — `publicComposition`
 * null döndüğünde düz siyah kare basılıyor.
 */
export default async function Image({
  params,
}: {
  params: Promise<{ lang: string; username: string; slug: string }>;
}) {
  const { username, slug } = await params;
  const found = await publicComposition(normalizeUsername(username), slug);
  if (!found) return new ImageResponse(<div style={{ background: '#050507' }} />, size);

  /*
    Nota adları burada İngilizce: kart tek dil ve paylaşım robotları dil
    öneki taşımıyor. Aynı karar parfüm kartında da verilmişti.
  */
  const notes = found.notes.map((entry) => ({
    name: getNote(entry.noteId).name.en,
    weight: entry.weight,
    color: noteColor(getNote(entry.noteId)),
  }));

  const nearest = cardsFor(nearestToComposition(found.notes, 1).map((m) => m.perfumeId))[0];

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#050507',
          padding: '68px 88px',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 20, letterSpacing: 6, color: 'rgba(255,255,255,0.4)' }}>
            {found.username.toUpperCase()}
          </div>
          <div style={{ fontSize: 76, color: '#fff', marginTop: 14, lineHeight: 1 }}>
            {found.name}
          </div>
        </div>

        {/* Notalar — ağırlık çubuğuyla; eğrinin Satori'deki karşılığı. */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 30 }}>
          {notes.slice(0, 6).map((note, index) => (
            <div key={index} style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
              <div
                style={{
                  width: 200,
                  fontSize: 24,
                  color: 'rgba(255,255,255,0.75)',
                  display: 'flex',
                }}
              >
                {note.name}
              </div>
              <div
                style={{
                  width: Math.round(note.weight * 520),
                  height: 8,
                  borderRadius: 8,
                  background: note.color,
                  opacity: 0.9,
                  display: 'flex',
                }}
              />
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          {nearest ? (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 16, letterSpacing: 5, color: 'rgba(255,255,255,0.3)' }}>
                CLOSEST ON THE MAP
              </div>
              {/*
                ⚠️ Tek dize olmak zorunda. `{ad} · {marka}` yazmak Satori'ye
                ÜÇ çocuk veriyor ve o zaman `<div>` açık `display` istiyor —
                yoksa kart hiç üretilmiyor ("failed to pipe response") ve
                bunun tek belirtisi paylaşım görselinin çıkmaması olur.
              */}
              <div style={{ fontSize: 26, color: 'rgba(255,255,255,0.65)', marginTop: 8 }}>
                {`${nearest.name} · ${nearest.brand}`}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex' }} />
          )}

          <div style={{ fontSize: 18, letterSpacing: 7, color: 'rgba(255,255,255,0.3)', display: 'flex' }}>
            OSMOS
          </div>
        </div>
      </div>
    ),
    size,
  );
}
