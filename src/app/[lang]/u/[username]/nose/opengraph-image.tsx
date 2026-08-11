import { ImageResponse } from 'next/og';
import { getFamily } from '@/data/families';
import { publicNose } from '@/lib/dal';
import { normalizeUsername } from '@/lib/username';

export const alt = 'OSMOS';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/** Kartta kaç aile çubuğu — üçten fazlası 630 pikselde sıkışıyor. */
const LINES = 3;

/**
 * Burun raporunun paylaşım kartı.
 *
 * Raporun paylaşılabilir olması sahibin kararıydı (herkese açık) ve büyüme
 * tarafı da burada: kart bir kişinin **kendi** portresi, tıklayan siteye
 * giriyor ve kendi raporunu kurabiliyor.
 *
 * ⚠️ **Satori tuval bilmiyor**: eksenler ve nokta çizimi taşınamıyor, karta
 * yalnızca aileler (renkli çubuk) ve genişlik cümlesi giriyor. Kompozisyon
 * kartında verilmiş kararın aynısı.
 *
 * ⚠️ **Çok çocuklu `<div>` açık `display` istiyor.** `{ad} · {marka}` gibi
 * bir ifade Satori'ye üç çocuk veriyor ve kart hiç üretilmiyor ("failed to
 * pipe response"); tek belirtisi paylaşım görselinin çıkmaması olur. Bu
 * dosyadaki bütün böyle ifadeler **tek dize**.
 *
 * ⚠️ Rapor yoksa (üç parfümden az) ya da profil gizliyse kart da yok — düz
 * siyah kare. "Yetersiz" yazan bir kart paylaşılacak bir şey değil.
 */
export default async function Image({
  params,
}: {
  params: Promise<{ lang: string; username: string }>;
}) {
  const { username } = await params;
  const nose = await publicNose(normalizeUsername(username));

  if (!nose?.report) {
    return new ImageResponse(<div style={{ background: '#050507' }} />, size);
  }

  /* Kart tek dil (İngilizce): paylaşım robotları dil öneki taşımıyor. */
  const families = nose.report.families.slice(0, LINES).map((entry) => ({
    name: getFamily(entry.family).name.en,
    share: entry.share,
    color: getFamily(entry.family).color,
  }));

  const peak = Math.max(...families.map((entry) => entry.share), 1e-9);

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
            {nose.username.toUpperCase()}
          </div>
          <div style={{ fontSize: 72, color: '#fff', marginTop: 14, lineHeight: 1 }}>
            NOSE REPORT
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18, marginTop: 30 }}>
          {families.map((family) => (
            <div key={family.name} style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <div
                style={{
                  width: 230,
                  fontSize: 26,
                  color: 'rgba(255,255,255,0.75)',
                  display: 'flex',
                }}
              >
                {family.name}
              </div>
              <div
                style={{
                  width: Math.round((family.share / peak) * 480),
                  height: 8,
                  borderRadius: 8,
                  background: family.color,
                  opacity: 0.9,
                  display: 'flex',
                }}
              />
              <div
                style={{
                  fontSize: 24,
                  color: 'rgba(255,255,255,0.4)',
                  display: 'flex',
                }}
              >
                {`${Math.round(family.share * 100)}%`}
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div
            style={{ fontSize: 24, color: 'rgba(255,255,255,0.45)', display: 'flex' }}
          >
            {`Read from ${nose.report.count} perfumes`}
          </div>
          <div
            style={{
              fontSize: 18,
              letterSpacing: 7,
              color: 'rgba(255,255,255,0.3)',
              display: 'flex',
            }}
          >
            OSMOS
          </div>
        </div>
      </div>
    ),
    size,
  );
}
