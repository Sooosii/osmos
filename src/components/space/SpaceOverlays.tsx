import type { ReactNode, RefObject } from 'react';
import type { SpaceMark } from '@/data/types';
import { APPROACH_CUE } from '@/lib/space-approach';
import type { FeelTarget } from '@/lib/space-feel';
import { useDict } from '@/i18n/LocaleProvider';
import { LangSwitch } from '@/components/LangSwitch';
import { NotifyControl } from '@/components/NotifyControl';
import { SignInLink } from '@/components/SignInLink';
import { SpaceFeelSliders } from './SpaceFeelSliders';

/**
 * Uzayın üstüne binen katmanlar — giriş metni, yaklaşma ipucu, nokta etiketi,
 * küratör cümlesi ve giriş şeridi.
 *
 * Uzay tuvalinden çıkarıldı çünkü hepsi aynı işi yapıyor: tuvalin çizemediği
 * şeyleri gerçek metin olarak, tuvalin üstünde göstermek. Hiçbiri karar
 * vermiyor — ne çizileceğini, neyin görüneceğini yukarısı söylüyor; buranın işi
 * yalnızca yerleşim ve tipografi.
 *
 * Üç ref'i **kurmuyor, alıyor.** `introRef` ile `cueRef`'e yaklaşma sahnesi,
 * `labelRef`'e çizim döngüsü yazıyor — ikisi de kare başına ve React'i
 * beklemeden. Gerekçeleri `use-approach-scene.ts` ve `ScentSpaceCanvas`'ın
 * `draw`'ında.
 */

interface SpaceOverlaysProps {
  readonly introRef: RefObject<HTMLDivElement | null>;
  readonly cueRef: RefObject<HTMLDivElement | null>;
  readonly labelRef: RefObject<HTMLDivElement | null>;
  /** Kaydıraç katmanı — görünürlüğünü yaklaşma sahnesi yazıyor. */
  readonly feelRef: RefObject<HTMLDivElement | null>;
  /**
   * Dil değiştiricinin katmanı — görünürlüğünü yaklaşma sahnesi yazıyor.
   *
   * Kaydıraçlarla aynı muameleyi görüyor, giriş metniyle değil: içinde
   * odaklanılabilir bir bağlantı var, yani opaklık tek başına yetmiyor.
   */
  readonly switchRef: RefObject<HTMLDivElement | null>;
  /** Kaydıraçların yazdığı tarif; çizim döngüsü okuyor. */
  readonly feelTargetRef: RefObject<FeelTarget>;
  /** Raydan gelen tarif — topukları oraya taşıyor. */
  readonly appliedFeel: FeelTarget | null;
  /**
   * Rayın uç sözcükleri (COOL / WARM).
   *
   * ⚠️ Tuvale değil HTML'e yazılıyor — punto haritanın ölçeğinden bağımsız
   * kalsın diye; etiket katmanıyla aynı karar. Sözlük de böylece çizim
   * modülüne girmiyor.
   */
  readonly railWordsRef: RefObject<HTMLDivElement | null>;
  /** Topuğa dokunuldu: ray tarifi düşüyor. */
  readonly onSlide: () => void;
  readonly requestDraw: () => void;
  /** Etikette yazan parfüm: üstüne gelinen, yoksa seçili. */
  readonly labelled: SpaceMark | null;
  /** Küratör cümlesi — yalnızca seçimde dolu, üstüne gelmede değil. */
  readonly selectedLine: string | null;
  readonly entryHint: boolean;
  readonly entryProgress: number;
  /** Varışta yerine yerleşen giriş metni; sunucuda üretiliyor. */
  readonly children?: ReactNode;
}

export function SpaceOverlays({
  introRef,
  cueRef,
  labelRef,
  feelRef,
  switchRef,
  feelTargetRef,
  appliedFeel,
  railWordsRef,
  onSlide,
  requestDraw,
  labelled,
  selectedLine,
  entryHint,
  entryProgress,
  children,
}: SpaceOverlaysProps) {
  const t = useDict();

  return (
    <>
      {/*
        Sol üst — sitenin tek "meta" köşesi.

        Giriş metni ve kaydıraçlar aynı sütunda duruyor çünkü aynı cümlenin iki
        yarısı: metin "ne yapabilirsin" diyor, kaydıraçlar onu uzatıyor. Alt
        ortaya konsalardı küratör cümlesi ve giriş şeridiyle aynı dar banda
        yığılırlardı.

        Konumlandırma burada, içerikte değil: kaydıraçların metnin altında
        durması bir piksel ofsetiyle değil, akışla sağlanıyor. Giriş metni bu
        yüzden `page.tsx`te konumlandırmasını bırakıp sade içerik oldu.
      */}
      <div className="pointer-events-none absolute left-6 top-6 flex flex-col gap-7 sm:left-10 sm:top-10">
        {/*
          Giriş metni — sunucuda üretiliyor, görünürlüğü burada.

          Sahne boyunca yok: uzaktayken ekranda "52 parfüm" yazması, henüz 52 nokta
          görünmezken verilmiş bir söz olurdu. Varışta yerine yerleşiyor.
        */}
        <div ref={introRef} className="opacity-0 transition-opacity duration-700">
          {children}
        </div>

        {/*
          Kaydıraçlar da sahne boyunca yok — uzaktayken sorulacak bir şey henüz
          ortada değil.

          ⚠️ Görünürlüğü opaklık tek başına halledemiyor: opaklığı 0 olan bir
          `<input>` hâlâ sekmeyle odaklanılabilir ve sahnenin ortasında klavye
          kullanıcısını görünmez bir kontrole düşürürdü. `inert`i de yaklaşma
          sahnesi yazıyor; ikisi tek yerden, `use-approach-scene`in `paintScene`i.
        */}
        <div
          ref={feelRef}
          className="pointer-events-auto w-[19rem] max-w-[calc(100vw-3rem)] opacity-0 transition-opacity duration-700"
        >
          <SpaceFeelSliders
            targetRef={feelTargetRef}
            requestDraw={requestDraw}
            applied={appliedFeel}
            onSlide={onSlide}
          />
        </div>
      </div>

      {/*
        Meta kontroller — sağ üst: bildirim + dil.

        Yaklaşma sahnesi boyunca yok, varışta beliriyorlar: "sahne boyunca
        ekranda kontrol olmaz" kuralı kaydıraçlarda yazılı ve burada da
        geçerli. Görünürlüğü ve `inert`i yaklaşma sahnesi yazıyor — `inert`
        ikisini birden kapsıyor, opaklığı 0 olan düğme de sekmeyle
        odaklanılamıyor.
      */}
      <div
        ref={switchRef}
        className="pointer-events-auto absolute right-6 top-6 flex items-center gap-3 opacity-0 transition-opacity duration-700 sm:right-10 sm:top-10"
      >
        <SignInLink />
        <NotifyControl />
        <LangSwitch />
      </div>

      {/*
        Yaklaşma ipucu.

        Söylediği tek şey "kaydırılabilir" — kimlik değil, hareket. Boşluk
        korkusunun asıl kaynağı "neredeyim" değil "ne yapacağım" sorusuydu; bir
        isim ona zaten cevap vermiyor.

        Fare ikonu bilerek yok: sitenin kendi dili saç teli inceliğinde çizgiler
        (giriş ipucundaki ilerleme şeridi de öyle). Nefes alması, hareketsiz bir
        çizginin süs sanılmasını engelliyor.

        İlerlemenin ilk üçte ikisinde sönüp bitiyor: kullanıcı kaydırmaya
        başladığı an ipucunun işi bitmiştir, geri kalan yolda ekranda durması
        yalnızca gürültü olurdu.
      */}
      <div
        ref={cueRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-[18%] flex justify-center opacity-0 transition-opacity duration-300"
      >
        {APPROACH_CUE === 'mark' ? (
          <span className="block h-10 w-px animate-[osmos-breathe_2.8s_ease-in-out_infinite] bg-white/60" />
        ) : (
          <span className="text-[11px] tracking-[0.45em] text-white/50">{t.site.name}</span>
        )}
      </div>

      {/* Etiket katmanı — konumu her karede çizimle birlikte güncelleniyor. */}
      <div
        ref={labelRef}
        className="pointer-events-none absolute left-0 top-0 opacity-0 transition-opacity duration-150"
      >
        {/* pb, noktanın yarıçapı + halosu kadar boşluk bırakıyor: etiket seçili
            noktanın üstüne binmesin. */}
        <div className="-translate-x-1/2 -translate-y-full pb-5 text-center">
          <p className="whitespace-nowrap text-[13px] leading-tight text-white/90">
            {labelled?.name ?? ''}
          </p>
          <p className="whitespace-nowrap text-[11px] leading-tight text-white/50">
            {labelled?.brand ?? ''}
          </p>
        </div>
      </div>

      {/*
        Rayın uçları. Konumu her karede çizimle birlikte yazılıyor; sözcükler
        kaydıraçlarınkiyle AYNI sözlük anahtarından geliyor — tek eksene iki ad
        takılmıyor.
      */}
      <div
        ref={railWordsRef}
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-0 flex justify-between opacity-0 transition-opacity duration-150"
      >
        <span className="text-[10px] tracking-[0.15em] text-white/45">
          {t.space.sliders.temperature.low}
        </span>
        <span className="text-[10px] tracking-[0.15em] text-white/45">
          {t.space.sliders.temperature.high}
        </span>
      </div>

      {/* Küratör cümlesi yalnızca seçimde — fare gezdirirken alt metin sürekli
          değişip huzursuz etmesin. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 p-6 sm:p-8">
        <p
          className={`mx-auto max-w-xl text-center text-sm italic leading-relaxed text-white/50 transition-opacity duration-300 ${
            selectedLine ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {selectedLine ?? ' '}
        </p>

        {/*
          Keşfedilebilirlik. Kaydırarak giriş, denenmediği sürece görünmez bir
          hareket; şartlar sağlandığı an kullanıcıya "buradan devam edilebilir"
          demek zorundayız. İnce çizgi aynı zamanda ilerleme göstergesi: ne
          kadar kaldığı görülüyor, geri çevirince geri gidiyor.
        */}
        <div
          className={`mx-auto mt-5 flex max-w-xs flex-col items-center gap-2 transition-opacity duration-300 ${
            entryHint ? 'opacity-100' : 'opacity-0'
          }`}
          aria-hidden="true"
        >
          <span className="text-[11px] tracking-[0.25em] text-white/50">
            {/* Cihaza göre iki kelime; gerekçe `AstronotIntro`da. */}
            <span className="pointer-coarse:hidden">{t.space.entryHint}</span>
            <span className="hidden pointer-coarse:inline">{t.space.entryHintTouch}</span>
          </span>
          <span className="h-px w-full overflow-hidden bg-white/10">
            <span
              className="block h-full w-full origin-left bg-white/60 will-change-transform"
              style={{ transform: `scaleX(${entryProgress})` }}
            />
          </span>
        </div>
      </div>
    </>
  );
}
