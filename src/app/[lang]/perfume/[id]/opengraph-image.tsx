import { ImageResponse } from 'next/og';
import { PERFUMES } from '@/data/perfumes';
import { dominantFamily, getFamily } from '@/data/families';
import { familyVector } from '@/lib/similarity';
import { perfumeDots } from '@/lib/share-marks';
import { getDict } from '@/i18n/dict';
import { DEFAULT_LOCALE } from '@/i18n/locale';

/*
  ⚠️ Kart üstündeki marka işareti dile bağlı değil: `site.name` iki sözlükte de
  aynı ve kiracıda da tek. Alt metin modül düzeyinde okunmak zorunda (Next
  `alt`i sabit bekliyor), o yüzden varsayılan dilden geçiyor.
*/
const BRAND = getDict(DEFAULT_LOCALE).site.name;

export const alt = BRAND;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/**
 * Parfümün paylaşım kartı — aile ışığı ve imza satırı.
 *
 * ⚠️ **Satori tuval bilmiyor.** Sitenin tram dokusu, dönen yörüngesi ve evrim
 * imzası buraya taşınamıyor; taşınan şey renk, tipografi ve daire. Kart bu
 * sınırın içinde tasarlandı, eksik bir taklit değil.
 *
 * Hangi noktaların çizileceğine dair karar burada **değil** —
 * `lib/share-marks.ts`te ve orada sınanıyor. Bu dosya yalnızca çiziyor.
 *
 * ⚠️ Yazı tipi `ImageResponse`un varsayılanı. Sitenin Geist'i
 * `next/font/google`dan geliyor ve dosya baytları çalışma anında elde değil;
 * ikinci bir yazı tipi indirmek yeni bir bağımlılık olurdu.
 */
export default async function Image({
  params,
}: {
  params: Promise<{ lang: string; id: string }>;
}) {
  const { id } = await params;
  const perfume = PERFUMES.find((entry) => entry.id === id);
  if (!perfume) return new ImageResponse(<div style={{ background: '#050507' }} />, size);

  /*
    Kartta dile bağlı hiçbir metin yok: marka, isim, parfümör ve yıl özel ad ve
    sayı. `lang` bu yüzden okunmuyor — çevrilecek bir şey yokken ikinci bir dil
    dalı açmak bakım borcu olurdu.
  */
  const color = getFamily(dominantFamily(familyVector(perfume))).color;
  const dots = perfumeDots(perfume);
  const kunye = [perfume.perfumer, String(perfume.year)].filter(Boolean).join(', ');

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
            /*
              Konum ve güç ekranda ayarlandı: ilk deneme (-55%, 110%, 0.5)
              ışığı üst kenara sıkıştırıyordu ve kart neredeyse düz siyah
              çıkıyordu. Aile rengi kartın tanınmasını sağlayan tek şey; sönük
              olması onu işlevsiz bırakıyor.
            */
            opacity: 0.7,
            display: 'flex',
          }}
        />

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 22, letterSpacing: 6, color: 'rgba(255,255,255,0.45)' }}>
            {perfume.brand.toUpperCase()}
          </div>
          <div style={{ fontSize: 88, color: '#fff', marginTop: 18, lineHeight: 1 }}>
            {perfume.name}
          </div>
          {kunye ? (
            <div style={{ fontSize: 26, color: 'rgba(255,255,255,0.4)', marginTop: 26 }}>
              {kunye}
            </div>
          ) : null}

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 34 }}>
            {dots.map((dot, index) => {
              // Aralık ekranda genişletildi: 16+20 fazla düz çıkıyordu, ağırlık
              // farkı görünmüyordu. 14+28 → 24–42 px.
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
          {BRAND}
        </div>
      </div>
    ),
    size,
  );
}
