import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PERFUMES } from '@/data/perfumes';
import { dominantFamily, getFamily } from '@/data/families';
import { familyVector } from '@/lib/similarity';
import { EvolutionSignature } from '@/components/EvolutionSignature';
import { Neighbors } from '@/components/Neighbors';

/**
 * Parfüm sayfası — yol haritasının ①, ②, ③ ve ④'ün komşular yarısı.
 *
 *   ①  isim + marka + küratör cümlesi        ← yalnızca duygu
 *          ↓
 *   ②③ evrim imzası                          ← altındaki veri, kendi kendine dönen
 *          ↓
 *   ④  uzaydaki komşular                     ← "peki buna benzeyen ne var?"
 *
 * ② ile ③ tek bir şeyde birleşti: imza, çizelgenin başka bir hâli. Kaydıraç yok —
 * biçim ve zaman 12 saniyelik bir turda hiç durmadan dönüyor (`EvolutionSignature`).
 * Kaydıraçlı çizelge `/evrim` doğrulama ekranında duruyor; orası iki parfümü aynı
 * dakikada karşılaştırmak için var.
 *
 * ④ ikiye ayrıldı. Komşular geldi: hiç durmadan dönen üç boyutlu bir takımyıldız.
 * Yarıçap benzerlik, yükseklik `depth` — uzayın iki boyuta sığdıramadığı üçüncü
 * bileşen. Konumlar uzaydaki gerçek yerler DEĞİL; "en benzeyen en yakında dursun"
 * garantisiyle gerçek konumlar aynı anda mümkün olmuyordu (ölçüldü: örtüşme
 * 3.16/5) ve kullanıcı garantiyi seçti. Karar geçmişi `lib/neighbor-orbit.ts`te.
 *
 * **Künye** hâlâ bekliyor: 44 parfümün 23'ünde parfümör, 18'inde yıl bilgisi yok;
 * veri elle tamamlandıktan sonra tasarlanacak.
 *
 * Renk uzaydaki noktanın renginden **türetilmiyor, aynı zincirden geliyor**:
 * `familyVector → dominantFamily → getFamily().color`. İkinci bir kaynak
 * açsaydık harita bir renk, sayfa başka bir renk gösterebilirdi — oysa sayfanın
 * uzaydaki noktayla aynı renkte olması haritanın kendini doğrulaması demek.
 */

export function generateStaticParams() {
  return PERFUMES.map((perfume) => ({ id: perfume.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const perfume = PERFUMES.find((entry) => entry.id === id);
  if (!perfume) return {};

  return {
    title: `${perfume.name} — ${perfume.brand} · OSMOS`,
    description: perfume.line?.tr ?? `${perfume.name}, ${perfume.brand}.`,
  };
}

export default async function PerfumePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const perfume = PERFUMES.find((entry) => entry.id === id);
  if (!perfume) notFound();

  const color = getFamily(dominantFamily(familyVector(perfume))).color;

  return (
    <main className="min-h-dvh bg-[#050507] text-white">
      {/*
        Aile rengi sayfanın tepesinde ince bir ışık olarak duruyor: uzaydan
        gelen göz aynı rengi görüp "doğru yerdeyim" diyor. Fotoğraf yok —
        temel kural; rengin kendisi görsel imzanın ilk katmanı.
      */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 top-0 h-[45vh] opacity-25"
        style={{ background: `radial-gradient(60% 100% at 50% 0%, ${color}, transparent 70%)` }}
      />

      {/*
        Açılış perdesi — uzaydan gelen geçişin ikinci yarısı.
        Uzay tuvali aile rengiyle tamamen kapanıyor, bu sayfa aynı renkten
        açılıp sönüyor. Arada beklenen bir kare yok: sayfa statik üretiliyor ve
        seçim anında önceden çekiliyor, dolayısıyla perde kalktığında içerik
        zaten yerinde duruyor.

        Doğrudan bu adrese gelen biri için de tutarlı bir giriş oluyor.
      */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-50"
        style={{
          backgroundColor: color,
          animation: 'osmos-reveal 320ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
        }}
      />

      <div className="relative mx-auto max-w-3xl px-6 pb-32 sm:px-10">
        <nav className="pt-10">
          {/*
            `?mark=` uzayın o parfümü seçili açması için. Tarayıcının geri tuşu
            da aynı yere düşüyor; iki yol tek davranışta buluşuyor.
          */}
          <Link
            href={`/?mark=${perfume.id}`}
            className="text-xs tracking-[0.3em] text-white/30 transition-colors hover:text-white/60"
          >
            OSMOS
          </Link>
        </nav>

        {/*
          ① — sadece duygu.

          Eskiden `min-h-[60vh]` ile ekranın tamamını yiyordu ve notaları
          görmek için kaydırmak gerekiyordu: basılı tutup geçen biri boş bir
          ekrana düşüyordu. Artık isim, cümle ve çizelge aynı ekranda —
          geçişin bittiği yerde aradığın şey duruyor.
        */}
        <header className="pt-14 sm:pt-20">
          <p className="text-sm tracking-[0.2em] text-white/40">
            {perfume.brand.toUpperCase()}
          </p>
          <h1 className="mt-3 text-4xl font-light leading-[1.05] tracking-tight sm:text-6xl">
            {perfume.name}
          </h1>
          {perfume.line ? (
            <p className="mt-5 max-w-xl text-base font-light leading-relaxed text-white/70 sm:text-lg">
              {perfume.line.tr}
            </p>
          ) : null}
        </header>

        {/* ③ — "aa, o aslında veriymiş" */}
        <section className="pt-14">
          <h2 className="mb-8 text-xs tracking-[0.3em] text-white/30">EVRİM</h2>
          <EvolutionSignature perfume={perfume} />
        </section>

        {/* ④ — "peki buna benzeyen ne var?" */}
        <section className="pt-20">
          <h2 className="mb-8 text-xs tracking-[0.3em] text-white/30">KOMŞULAR</h2>
          <Neighbors perfume={perfume} />
        </section>

        <div className="mt-24">
          <Link
            href={`/?mark=${perfume.id}`}
            className="text-sm font-light text-white/40 transition-colors hover:text-white/80"
          >
            ← uzaya dön
          </Link>
        </div>
      </div>
    </main>
  );
}
