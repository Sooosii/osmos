import { EvolutionTimeline } from '@/components/EvolutionTimeline';

/**
 * Evrim çizelgesi — zaman kaydıracıyla notaların yükselip düşüşü.
 *
 * Kök adres Koku Uzayı'na devredildiği için çizelge buraya taşındı. Kendi
 * başına bir sayfa olarak kalması geçici: Blok D/9'da parfüm sayfasının ③
 * bölümü olacak, burası da doğrulama ekranı olarak kalacak.
 */
export default function EvolutionPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0C] px-6 py-24 sm:px-12">
      <div className="mx-auto flex max-w-3xl flex-col">
        <p className="mb-16 text-xs tracking-[0.3em] text-white/30">OSMOS</p>
        <EvolutionTimeline />
      </div>
    </div>
  );
}
