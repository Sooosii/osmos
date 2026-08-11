import Link from 'next/link';
import { getFamily } from '@/data/families';
import type { Dict } from '@/i18n/en';
import { say } from '@/i18n/dict';
import { withLocale, type Locale } from '@/i18n/locale';
import { cardsFor } from '@/lib/perfume-cards';
import type { NoseReport } from '@/lib/nose';

/**
 * Burun raporunun gövdesi.
 *
 * Sunucu bileşeni ve tuval yok: buradaki her şey metin, çizgi ve kutu.
 * Sitenin çizim iddiası ("elle yazılmış, kütüphane yok") burada bedavaya
 * geliyor — çubuk bir `div`, eksen bir çizgi üstündeki nokta.
 *
 * ⚠️ **Eksen adları buradan uydurulmuyor**, `space.sliders`tan geliyor.
 * Kaydıraçlarla aynı sözcükler olmak zorunda: rapor "sıcak" derken uzayın
 * kaydıracı başka bir şey anlatıyorsa iki ekran birbirini yalanlar.
 */

/**
 * `feel` dizisinin sırası `Character` ile aynı — sıcaklık, doku, temizlik,
 * yakınlık (`similarity.ts:99`). Kaydıraç sözlüğüne bağlanan yer burası;
 * dizilim değişirse **iki dosya birden** değişmek zorunda.
 */
const AXIS_KEYS = ['temperature', 'texture', 'cleanliness', 'proximity'] as const;

interface NoseReadoutProps {
  readonly report: NoseReport;
  readonly t: Dict;
  readonly locale: Locale;
}

/** Genişliğin cümleye çevrildiği iki eşik. */
const NARROW = 0.35;
const WIDE = 0.55;

function rangeLine(breadth: number, t: Dict): string {
  if (breadth < NARROW) return t.nose.range.narrow;
  if (breadth > WIDE) return t.nose.range.wide;
  return t.nose.range.balanced;
}

export function NoseReadout({ report, t, locale }: NoseReadoutProps) {
  const outlier = report.outlierId ? cardsFor([report.outlierId])[0] : undefined;
  const next = cardsFor(report.nextIds);

  /*
    Çubuklar en güçlü aileye göre ölçekleniyor, mutlak paya göre değil:
    en baskın aile bile genellikle %35 civarında kalıyor ve mutlak genişlikte
    beş çubuk da solda küçük bir kümede sıkışıp okunmaz oluyordu. Gerçek sayı
    çubuğun yanında yazıyor — ölçek göreli, rakam mutlak.
  */
  const peak = Math.max(...report.families.map((entry) => entry.share), 1e-9);

  return (
    <>
      <section className="mt-14">
        <h2 className="mb-5 text-xs tracking-[0.3em] text-white/50">{t.nose.sections.families}</h2>
        <ul className="space-y-3">
          {report.families.map((entry) => {
            const family = getFamily(entry.family);
            return (
              <li key={entry.family} className="flex items-center gap-3 text-sm font-light">
                <span className="w-24 shrink-0 truncate text-white/70">
                  {say(family.name, locale)}
                </span>
                <span className="h-px flex-1 bg-white/10">
                  <span
                    aria-hidden="true"
                    className="block h-px"
                    style={{
                      width: `${(entry.share / peak) * 100}%`,
                      backgroundColor: family.color,
                    }}
                  />
                </span>
                <span className="w-10 shrink-0 text-right tabular-nums text-white/40">
                  {Math.round(entry.share * 100)}%
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-14">
        <h2 className="mb-5 text-xs tracking-[0.3em] text-white/50">{t.nose.sections.character}</h2>
        <ul className="space-y-4">
          {AXIS_KEYS.map((key, index) => {
            const slider = t.space.sliders[key];
            const value = report.feel[index];

            return (
              <li key={key} className="flex items-center gap-3">
                <span className="w-14 shrink-0 text-[9px] tracking-[0.18em] text-white/35">
                  {slider.low}
                </span>
                <span className="relative h-px flex-1 bg-white/10">
                  <span
                    aria-hidden="true"
                    className="absolute top-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/80"
                    style={{ left: `${value * 100}%` }}
                  />
                </span>
                <span className="w-14 shrink-0 text-right text-[9px] tracking-[0.18em] text-white/35">
                  {slider.high}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-14">
        <h2 className="mb-4 text-xs tracking-[0.3em] text-white/50">{t.nose.sections.range}</h2>
        <p className="text-sm font-light leading-relaxed text-white/70">
          {rangeLine(report.breadth, t)}
        </p>
      </section>

      {outlier ? (
        <section className="mt-14">
          <h2 className="mb-4 text-xs tracking-[0.3em] text-white/50">{t.nose.sections.outlier}</h2>
          <p className="flex items-center gap-3 text-sm font-light">
            <span
              aria-hidden="true"
              className="size-2 shrink-0 rounded-full"
              style={{ backgroundColor: outlier.color }}
            />
            <Link
              href={withLocale(locale, `/perfume/${outlier.id}`)}
              className="text-white/75 transition-colors hover:text-white"
            >
              {outlier.name}
            </Link>
            <span className="truncate text-white/30">{outlier.brand}</span>
          </p>
          <p className="mt-3 text-xs font-light text-white/35">{t.nose.outlierNote}</p>
        </section>
      ) : null}

      {next.length > 0 ? (
        <section className="mt-14">
          <h2 className="mb-4 text-xs tracking-[0.3em] text-white/50">{t.nose.sections.next}</h2>
          <ul className="space-y-2">
            {next.map((card) => (
              <li key={card.id} className="flex items-center gap-3 text-sm font-light">
                <span
                  aria-hidden="true"
                  className="size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: card.color }}
                />
                <Link
                  href={withLocale(locale, `/perfume/${card.id}`)}
                  className="text-white/75 transition-colors hover:text-white"
                >
                  {card.name}
                </Link>
                <span className="truncate text-white/30">{card.brand}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs font-light text-white/35">{t.nose.nextNote}</p>
        </section>
      ) : null}
    </>
  );
}
