import Link from 'next/link';
import type { PerfumeCard } from '@/lib/perfume-cards';
import { withLocale, type Locale } from '@/i18n/locale';

/**
 * Top 4'ün tek karesi — fotoğrafsız bir parfüm kartı.
 *
 * Kimliği üç şeyden geliyor: **aile rengi** (sitenin her yerinde aynı kod),
 * **nota noktaları** (kompozisyonun ağırlık dağılımı) ve ad. Şişe fotoğrafı
 * olsaydı kart markanın olurdu; böyle kokunun oluyor.
 *
 * Sunucu bileşeni: durum yok, istemciye hiçbir şey inmiyor.
 */
interface PerfumeMiniCardProps {
  readonly card: PerfumeCard;
  readonly locale: Locale;
  /** Sağ üstte küçük bir eylem — profilde yok, ayarlarda "çıkar". */
  readonly action?: React.ReactNode;
}

export function PerfumeMiniCard({ card, locale, action }: PerfumeMiniCardProps) {
  return (
    <div className="group relative border border-white/10 transition-colors hover:border-white/25">
      {/*
        Renk üstte ince bir şerit: kartın tamamını boyamak, doygun rengi geniş
        alana yaymak olurdu — arka plan kararında (dither-field) ölçülmüş ve
        göz yorduğu görülmüş bir şey.
      */}
      <div aria-hidden="true" className="h-[3px] w-full" style={{ backgroundColor: card.color }} />

      <div className="p-4">
        <p className="text-[9px] tracking-[0.22em] text-white/40">{card.brand.toUpperCase()}</p>
        <p className="mt-1.5 text-sm font-light leading-tight text-white/90">
          <Link
            href={withLocale(locale, `/perfume/${card.id}`)}
            className="transition-colors hover:text-white"
          >
            {card.name}
          </Link>
        </p>

        {/* Nota ağırlıkları — büyük nokta baskın nota. */}
        <div aria-hidden="true" className="mt-4 flex items-center gap-1.5">
          {card.dots.map((weight, index) => (
            <span
              key={index}
              className="rounded-full"
              style={{
                width: `${3 + weight * 5}px`,
                height: `${3 + weight * 5}px`,
                backgroundColor: card.color,
                opacity: 0.35 + weight * 0.55,
              }}
            />
          ))}
        </div>
      </div>

      {action ? <div className="absolute right-2 top-3">{action}</div> : null}
    </div>
  );
}

/** Boş yuva — dört kutunun görsel ritmi bozulmasın diye. */
export function EmptySlot({ label }: { readonly label?: string }) {
  return (
    <div className="flex min-h-[7.5rem] items-center justify-center border border-dashed border-white/10">
      {label ? <span className="text-[10px] tracking-[0.2em] text-white/25">{label}</span> : null}
    </div>
  );
}
