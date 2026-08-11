import { ImageResponse } from 'next/og';
import { publicProfile } from '@/lib/dal';
import { cardsFor } from '@/lib/perfume-cards';
import { SIGNATURE_SIZE, signatureOf } from '@/lib/nose-signature';
import { normalizeUsername } from '@/lib/username';

export const alt = 'OSMOS';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/**
 * Profilin paylaşım kartı — büyüme motorunun kendisi.
 *
 * Yol haritasının cümlesi buydu: *"paylaşılan her profil siteye ziyaretçi
 * çeker."* Kart üç şeyi taşıyor: imza, kullanıcı adı, dört parfümün adı.
 *
 * ⚠️ **İmza burada `<svg>` değil, tek tek `<div>` daireler.** Satori SVG'yi
 * yalnızca `<img>` içinde kabul ediyor; JSX olarak gömülen bir `<svg>`
 * ağacını çizmiyor. `NoseSignature.tsx`in çizimi bu yüzden kopyalanmadı —
 * **tarif** (`signatureOf`) paylaşılıyor, çizim iki yerde ayrı. Saf modülün
 * baştan bu iş için ayrılmasının sebebi tam olarak buydu.
 *
 * ⚠️ Gizli profilin kartı da yok: `publicProfile` null döndüğünde düz siyah
 * bir kare basılıyor. Kart üretilseydi, gizlenmiş bir profilin varlığı
 * paylaşım önizlemesinden sızardı.
 */
export default async function Image({
  params,
}: {
  params: Promise<{ lang: string; username: string }>;
}) {
  const { username } = await params;
  const profile = await publicProfile(normalizeUsername(username));
  if (!profile) return new ImageResponse(<div style={{ background: '#050507' }} />, size);

  const signature = signatureOf(profile.topFour);
  const cards = cardsFor(profile.topFour);

  /* İmza kartta 340 px; tarif 100 birimlik kutuda geliyor. */
  const scale = 340 / SIGNATURE_SIZE;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 72,
          background: '#050507',
          padding: '72px 96px',
          position: 'relative',
        }}
      >
        {/* İmza — dairelerin mutlak konumu tariften geliyor. */}
        <div style={{ position: 'relative', width: 340, height: 340, display: 'flex' }}>
          {signature?.arcs.flatMap((arc) =>
            arc.dots.map((dot, index) => {
              /*
                ⚠️ `dot.r` YARIÇAP; buradaki `width`/`height` ise ÇAP.
                İlk yazışta çarpan unutulmuştu ve imza kartta olması
                gerekenin yarısı kadar çıkıyordu — SVG'deki hâline göre
                gözle karşılaştırılmasa fark edilmezdi, çünkü kart tek
                başına bakıldığında "böyleymiş" gibi duruyor.
              */
              const boy = Math.max(6, dot.r * 2 * scale);
              return (
                <div
                  key={`${arc.perfumeId}-${index}`}
                  style={{
                    position: 'absolute',
                    left: dot.x * scale - boy / 2,
                    top: dot.y * scale - boy / 2,
                    width: boy,
                    height: boy,
                    borderRadius: boy,
                    background: arc.color,
                    opacity: 0.45 + (arc.radius / SIGNATURE_SIZE) * 0.9,
                    display: 'flex',
                  }}
                />
              );
            }),
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <div style={{ fontSize: 72, color: '#fff', lineHeight: 1 }}>{profile.username}</div>

          {profile.bio ? (
            <div style={{ fontSize: 26, color: 'rgba(255,255,255,0.45)', marginTop: 22 }}>
              {profile.bio}
            </div>
          ) : null}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 44 }}>
            {cards.map((card) => (
              <div key={card.id} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: 12,
                    background: card.color,
                    display: 'flex',
                  }}
                />
                <div style={{ fontSize: 26, color: 'rgba(255,255,255,0.8)' }}>{card.name}</div>
                <div style={{ fontSize: 22, color: 'rgba(255,255,255,0.35)' }}>{card.brand}</div>
              </div>
            ))}
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
