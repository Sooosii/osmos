import { PERFUMES } from '@/data/perfumes';
import { FAMILIES, dominantFamily } from '@/data/families';
import { familyVector, nearestNeighbors } from '@/lib/similarity';
import { buildMarks } from '@/lib/space-marks';
import { ScentSpace } from '@/components/ScentSpace';
import type { ScentFamily } from '@/data/types';
import type { Dict } from '@/i18n/en';
import { getDict, localeFor, say } from '@/i18n/dict';
import { pageAlternates } from '@/lib/site-url';

/**
 * Uzay taslağı — benzerlik motorunu doğrulamak için.
 *
 * Bu gösteri sayfası DEĞİL; Koku Uzayı'nın kendisi `/` adresinde, Canvas 2D ile.
 * Burada tek soru şu: motor doğru komşulukları buluyor mu? Bu yüzden noktaların
 * yanında ham sayılar da var. Harita değişirse önce burası bakılır — o yüzden
 * uzay yayına girdikten sonra da duruyor.
 *
 * Sunucuda çizilir — hesap istemciye hiç gitmiyor.
 */

/**
 * Kontrol noktaları — bu çiftlerin/uçların uzayda ne yapması gerektiği.
 *
 * Zoologist ve Orto Parisi çiftleri bilerek listede DEĞİL. Kurulurken "aynı ev
 * → yakın konum" varsayılmıştı; küratör kararı bunu çürüttü: Viride ile Megamare
 * aynı aileden olabilir ama benzemiyor, Hummingbird ile Rabbit de. Marka
 * akrabalığı koku akrabalığı demek değil. Nasomatto çifti gerçekten benziyor,
 * ev DNA'sı testi olarak o yeterli.
 */
function expectationsFor(
  t: Dict,
): readonly { readonly label: string; readonly ids: readonly string[] }[] {
  return [
    {
      label: t.draft.expectations.nasomatto,
      ids: ['nasomatto-baraonda', 'nasomatto-blamage'],
    },
    {
      label: t.draft.expectations.mossy,
      ids: ['parfum-dempire-azemour-les-orangers', 'papillon-dryad'],
    },
    {
      label: t.draft.expectations.dirty,
      ids: ['bogue-maai', 'serge-lutens-muscs-koublai-khan'],
    },
    { label: t.draft.expectations.alone, ids: ['juliette-has-a-gun-not-a-perfume'] },
  ];
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const locale = localeFor((await params).lang);
  const t = getDict(locale);
  return {
    title: t.draft.spaceTitle,
    alternates: pageAlternates('/space', locale),
    /*
      ⚠️ İç araç, vitrin değil. Sitemap'ten de çıkarıldı (`site-map.ts`) ama
      sitemap bir davet, yasak değil: bağlantıyı bulan robot yine indeksler.
      Aramadan gelen ziyaretçinin kendini "draft" diye tanıtan bir sayfaya
      düşmesi, bitmemiş bir site izlenimi veriyordu.
    */
    robots: { index: false, follow: true },
  };
}

export default async function SpaceDraft({ params }: { params: Promise<{ lang: string }> }) {
  const locale = localeFor((await params).lang);
  const t = getDict(locale);
  const expectations = expectationsFor(t);

  // Bütün hesap burada, sunucuda. İstemciye giden yalnızca çizilmiş sonuç:
  // koordinatlar, renkler ve komşuluk kimlikleri.
  const marks = buildMarks(PERFUMES, locale);
  const pointById = new Map(marks.map((mark) => [mark.id, mark]));

  const usedFamilies = new Set(
    PERFUMES.map((perfume) => dominantFamily(familyVector(perfume))),
  );

  return (
    <div className="min-h-screen bg-[#0A0A0C] px-6 py-16 text-white sm:px-12">
      <div className="mx-auto max-w-4xl">
        <p className="mb-2 text-xs tracking-[0.3em] text-white/50">{t.site.name}</p>
        <h1 className="text-3xl font-light tracking-tight">{t.draft.spaceHeading}</h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/50">
          {t.draft.spaceLede(PERFUMES.length)}
        </p>

        {/* Dağılım */}
        <ScentSpace marks={marks} />
        <p className="mt-3 text-xs text-white/50">{t.draft.spaceHint}</p>

        {/* Aile göstergesi — yalnızca haritada geçenler */}
        <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2">
          {FAMILIES.filter((family) => usedFamilies.has(family.id as ScentFamily)).map((family) => (
            <span key={family.id} className="flex items-center gap-2 text-xs text-white/50">
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: family.color }}
              />
              {say(family.name, locale)}
            </span>
          ))}
        </div>

        {/* Kontrol noktaları */}
        <h2 className="mt-16 text-lg font-light">{t.draft.checkpoints}</h2>
        <ul className="mt-4 space-y-2 text-sm">
          {expectations.map((check) => (
            <li key={check.label} className="text-white/50">
              <span className="text-white/70">{check.label}</span>
              {' — '}
              <span className="tabular-nums">
                {check.ids
                  .map((id) => {
                    const point = pointById.get(id);
                    return point
                      ? `(${point.x.toFixed(2)}, ${point.y.toFixed(2)})`
                      : t.draft.missing;
                  })
                  .join(' · ')}
              </span>
            </li>
          ))}
        </ul>

        {/* Komşuluklar — doğrulamanın asıl aracı */}
        <h2 className="mt-16 text-lg font-light">{t.draft.neighbours}</h2>
        <p className="mt-2 text-xs text-white/50">{t.draft.neighboursNote}</p>
        <ul className="mt-5 space-y-4">
          {PERFUMES.map((perfume) => (
            <li key={perfume.id} className="text-sm">
              <span className="text-white/80">{perfume.name}</span>
              <span className="text-white/50"> · {perfume.brand}</span>
              <ol className="mt-1 space-y-0.5 text-white/50">
                {nearestNeighbors(perfume, PERFUMES, 3).map((neighbor) => (
                  <li key={neighbor.perfume.id} className="tabular-nums">
                    {neighbor.score.toFixed(2)}{' '}
                    <span className="text-white/60">{neighbor.perfume.name}</span>
                    <span className="text-white/50"> · {neighbor.perfume.brand}</span>
                  </li>
                ))}
              </ol>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
