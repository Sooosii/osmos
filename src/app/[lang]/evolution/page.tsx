import { EvolutionTimeline } from '@/components/EvolutionTimeline';
import { dictFor, localeFor } from '@/i18n/dict';
import { pageAlternates } from '@/lib/site-url';

/**
 * Evrim çizelgesi — zaman kaydıracıyla notaların yükselip düşüşü.
 *
 * Kök adres Koku Uzayı'na devredildiği için çizelge buraya taşındı. O günkü not
 * "burada kalması geçici" diyordu; **iş bitti ve karar tersine döndü**: çizelge
 * parfüm sayfasının ③ bölümü olarak zaten duruyor (`EvolutionSignature`), bu
 * ekran da **kalıcı olarak** doğrulama ekranı — sahip karar verdi, bir daha
 * sorulmayacak. Buranın parfüm sayfasından farkı kaydıraç: iki parfümü **aynı
 * dakikada** karşılaştırmak yalnızca burada mümkün.
 *
 * Çizelgenin kendisi ortak (`EvolutionChart`); iki kopya olsaydı biri düzeltilip
 * öbürü unutulduğunda sayfa ile doğrulama ekranı farklı şeyler gösterirdi.
 */
export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const t = dictFor(lang);
  return {
    title: t.draft.evolutionTitle,
    alternates: pageAlternates('/evolution', localeFor(lang)),
    /* Gerekçe `space/page.tsx`te: iç araç, vitrin değil. */
    robots: { index: false, follow: true },
  };
}

export default async function EvolutionPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const t = dictFor(lang);

  return (
    <div className="min-h-screen bg-[#0A0A0C] px-6 py-24 sm:px-12">
      <div className="mx-auto flex max-w-3xl flex-col">
        <p className="mb-16 text-xs tracking-[0.3em] text-white/50">{t.site.name}</p>
        <EvolutionTimeline />
      </div>
    </div>
  );
}
