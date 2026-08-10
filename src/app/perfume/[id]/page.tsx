import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PERFUMES } from '@/data/perfumes';
import { dominantFamily, getFamily } from '@/data/families';
import { familyVector } from '@/lib/similarity';
import { EvolutionSignature } from '@/components/EvolutionSignature';
import { Neighbors } from '@/components/Neighbors';
import { PerfumeNotes } from '@/components/PerfumeNotes';
import { ScreenFrame, type FrameReadout } from '@/components/ScreenFrame';

/**
 * Parfüm sayfası — yol haritasının ①, ②, ③ ve ④'ü. Tamamı.
 *
 *   ①  isim + marka + künye + küratör cümlesi ← yalnızca duygu (bir de kimlik)
 *          ↓
 *   ②③ evrim imzası                          ← altındaki veri, kendi kendine dönen
 *          ↓
 *   ④  uzaydaki komşular                     ← "peki buna benzeyen ne var?"
 *
 * ② ile ③ tek bir şeyde birleşti: imza, çizelgenin başka bir hâli. Kaydıraç yok —
 * biçim ve zaman 12 saniyelik bir turda hiç durmadan dönüyor (`EvolutionSignature`).
 * Kaydıraçlı çizelge `/evolution` doğrulama ekranında duruyor; orası iki parfümü aynı
 * dakikada karşılaştırmak için var.
 *
 * ④ ikiye ayrıldı. Komşular geldi: hiç durmadan dönen üç boyutlu bir takımyıldız.
 * Yarıçap benzerlik, yükseklik `depth` — uzayın iki boyuta sığdıramadığı üçüncü
 * bileşen. Konumlar uzaydaki gerçek yerler DEĞİL; "en benzeyen en yakında dursun"
 * garantisiyle gerçek konumlar aynı anda mümkün olmuyordu (ölçüldü: örtüşme
 * 3.16/5) ve kullanıcı garantiyi seçti. Karar geçmişi `lib/neighbor-orbit.ts`te.
 *
 * ④'ün öbür yarısı **künye** de geldi. Bir kez ertelenmişti: o günkü 44 parfümün
 * 23'ünde parfümör, 18'inde yıl yoktu. Veri elle tamamlandı; yıl artık 52/52 dolu
 * ve `types.ts` bunu zorunlu kılarak koruyor. Parfümör 49/52 — kalan üçünde satır
 * tek başına yıla düşüyor, gerekçeleri `types.ts`in `perfumer` alanında.
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
    description: perfume.line?.en ?? `${perfume.name}, ${perfume.brand}.`,
  };
}

export default async function PerfumePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const perfume = PERFUMES.find((entry) => entry.id === id);
  if (!perfume) notFound();

  const family = getFamily(dominantFamily(familyVector(perfume)));
  const color = family.color;

  /*
    Çerçevedeki üçü de parfümün künyesi (`ScreenFrame.tsx`: uydurma sayı yok).
    Aile aynı zamanda sayfanın rengini açıklıyor — tepedeki ışığın neden o renk
    olduğu başka hiçbir yerde yazmıyor.

    ⚠️ `toUpperCase()`, `toLocaleUpperCase('tr')` DEĞİL — ve bu bir devrilme.
    İlk karar 'tr' idi ("ÇIÇEKSI bozuk görünüyor" diye); sahip 2026-08-10'da
    tersini koydu: noktalı büyük İ sitede HİÇ görünmeyecek ("İ bunu görmiyim,
    her yerden düzelt"). İngiliz kuralı i'yi I yapar — istenen tam bu.
    Aynı kural bütün `uppercase` sınıflarında kendiliğinden işliyor, çünkü
    belge `lang="en"`.
  */
  const readouts: readonly FrameReadout[] = [
    { label: 'AILE', value: family.name.en.toUpperCase() },
    { label: 'YIL', value: String(perfume.year) },
    { label: 'NOTA', value: String(perfume.notes.length) },
  ];

  const index = PERFUMES.findIndex((entry) => entry.id === id) + 1;
  const position = `PARFÜM ${String(index).padStart(3, '0')}/${PERFUMES.length}`;

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

      <ScreenFrame
        nav={
          <nav className="flex items-center gap-3 text-[10px] tracking-[0.3em] text-white/40">
            {/*
              `?mark=` uzayın o parfümü seçili açması için. Tarayıcının geri tuşu
              da aynı yere düşüyor; iki yol tek davranışta buluşuyor.
            */}
            <Link href={`/?mark=${perfume.id}`} className="transition-colors hover:text-white">
              OSMOS
            </Link>
            <span aria-hidden="true" className="text-white/20">
              ·
            </span>
            <Link href="/notes" className="transition-colors hover:text-white">
              NOTALAR
            </Link>
          </nav>
        }
        readouts={readouts}
        status={position}
        tail={perfume.brand.toUpperCase()}
      >
        <div className="relative mx-auto max-w-3xl px-6 sm:px-10">
          {/*
            ① — sadece duygu.

            Eskiden `min-h-[60vh]` ile ekranın tamamını yiyordu ve notaları
            görmek için kaydırmak gerekiyordu: basılı tutup geçen biri boş bir
            ekrana düşüyordu. Artık isim, cümle ve çizelge aynı ekranda —
            geçişin bittiği yerde aradığın şey duruyor.
          */}
          <header className="pt-8 sm:pt-14">
            <p className="text-sm tracking-[0.2em] text-white/40">
              {perfume.brand.toUpperCase()}
            </p>
            <h1 className="mt-3 text-4xl font-light leading-[1.05] tracking-tight sm:text-6xl">
              {perfume.name}
            </h1>
            {/*
              Künye — kim, ne zaman. Yeri ve biçimi ekranda üç seçenek yan yana
              çizilip seçildi; gerekçeler `specs/2026-08-05-kunye-design.md`te.

              İsmin hemen altında duruyor çünkü künye kimliğin parçası: adı okuyan
              göz burnu ve yılı da alıp sonra cümleye geçiyor.

              `perfumer` yoksa satır tek başına yıla düşüyor ve bu bilinçli. 52'nin
              üçünde parfümör yok; hangileri ve neden, `types.ts`in `perfumer`
              alanında yazıyor — "bilinmiyor" yazmak da uydurmak da reddedildi.
            */}
            <p className="mt-4 text-sm font-light text-white/35">
              {perfume.perfumer ? `${perfume.perfumer}, ` : ''}
              {perfume.year}
            </p>
            {perfume.line ? (
              <p className="mt-5 max-w-xl text-base font-light leading-relaxed text-white/70 sm:text-lg">
                {perfume.line.en}
              </p>
            ) : null}
          </header>

          {/* ③ — "aa, o aslında veriymiş" */}
          <section className="pt-14">
            <h2 className="mb-8 text-xs tracking-[0.3em] text-white/30">EVRIM</h2>
            <EvolutionSignature perfume={perfume} />
          </section>

          {/*
            ⑤ — "peki bunun içinde ne var?"

            Aşama 3'te geldi. Eskiden bu sayfa notalarını hiç listelemiyordu:
            notalar siteye yalnızca imzadaki etiketler olarak giriyordu ve
            tıklanmıyorlardı. Ansiklopedinin birinci kapısı burası.

            Neden imzadaki etiketler değil de duran bir liste — gerekçe
            `PerfumeNotes.tsx`te; kısası, imzanın etiketleri turun bir bölümünde
            tamamen görünmez oluyor ve görünmez bir link yarı zamanlı bir tuzak.
          */}
          <section className="pt-20">
            <h2 className="mb-8 text-xs tracking-[0.3em] text-white/30">NOTALAR</h2>
            <PerfumeNotes perfume={perfume} />
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
      </ScreenFrame>
    </main>
  );
}
