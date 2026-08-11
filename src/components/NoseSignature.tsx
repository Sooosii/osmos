import { SIGNATURE_SIZE, signatureOf } from '@/lib/nose-signature';

/**
 * Burun imzasının çizimi — profilde fotoğrafın durduğu yer.
 *
 * Sunucu bileşeni: durum yok, etki yok, istemci paketine hiçbir şey inmiyor.
 * Deseni `nose-signature.ts` hesaplıyor; buranın işi yalnızca SVG basmak.
 *
 * ⚠️ **Canvas DEĞİL, SVG — ve bu pazarlık dışı.** Aynı imza paylaşım kartında
 * da görünecek (`/u/[username]/opengraph-image`) ve orada çizen şey `next/og`,
 * yani Satori: **tuval tanımıyor**, yalnızca flexbox ve CSS'in bir alt kümesi.
 * Tram dokusu ve yörünge paylaşım kartına bu yüzden taşınamamıştı; imza aynı
 * duvara ikinci kez çarpmasın diye baştan SVG.
 *
 * ⚠️ Satori uyumu için çizim **ilkel** tutuldu: yalnızca `<circle>`, hiçbir
 * filtre, gradyan, `mask` ya da CSS animasyonu yok. Halkalar bilerek
 * çizilmiyor — nokta dizilimi zaten halkayı gösteriyor ve boş bir yörünge
 * çizgisi, seçilmemiş yuva izlenimi veriyordu.
 */
interface NoseSignatureProps {
  /** Top 4 — sıralı. Sıra deseni değiştiriyor. */
  readonly perfumeIds: readonly string[];
  /** Kenar uzunluğu (CSS pikseli). */
  readonly size?: number;
  /** Ekran okuyucunun duyduğu metin; yoksa süs sayılıp gizleniyor. */
  readonly label?: string;
}

export function NoseSignature({ perfumeIds, size = 120, label }: NoseSignatureProps) {
  const signature = signatureOf(perfumeIds);

  /*
    Seçim yoksa imza da yok. Boş dört halka çizmek "burası eksik" derdi;
    hiçbir şey çizmemek profili sade bırakıyor.
  */
  if (!signature) return null;

  return (
    <svg
      viewBox={`0 0 ${SIGNATURE_SIZE} ${SIGNATURE_SIZE}`}
      width={size}
      height={size}
      role={label ? 'img' : 'presentation'}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {signature.arcs.map((arc) =>
        arc.dots.map((dot, index) => (
          <circle
            key={`${arc.perfumeId}-${index}`}
            cx={dot.x}
            cy={dot.y}
            r={dot.r}
            fill={arc.color}
            /*
              Dıştaki yay en parlak, içeridekiler sönüyor: sıra göz tarafından
              da okunuyor, yalnızca yarıçapla değil.
            */
            opacity={0.45 + (arc.radius / SIGNATURE_SIZE) * 0.9}
          />
        )),
      )}
    </svg>
  );
}
