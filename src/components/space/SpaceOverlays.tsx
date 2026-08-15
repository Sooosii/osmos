import { useEffect, useRef, type ReactNode, type RefObject } from 'react';
import type { SpaceMark } from '@/data/types';
import type { FeelTarget } from '@/lib/space-feel';
import { useDict } from '@/i18n/LocaleProvider';
import { LangSwitch } from '@/components/LangSwitch';
import { NotifyControl } from '@/components/NotifyControl';
import { SignInLink } from '@/components/SignInLink';
import { PerfumeSearch } from '@/components/PerfumeSearch';
import { SpaceFeelSliders } from './SpaceFeelSliders';

/** Uzayın tuval üstü metin, etiket ve erişilebilir kontrolleri. */

interface SpaceOverlaysProps {
  readonly labelRef: RefObject<HTMLDivElement | null>;
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
  readonly spaceId: number;
  readonly spaceCount: number;
  /** Uzayın kimlik rengi — sayacın yanındaki nokta. Kaynak `space-identity.ts`. */
  readonly identityColor: string;
  readonly spacePerfumeCount: number;
  readonly previousSpaceId: number | null;
  readonly nextSpaceId: number | null;
  readonly isWarping: boolean;
  readonly onNavigateSpace: (spaceId: number) => void;
  /** Varışta yerine yerleşen giriş metni; sunucuda üretiliyor. */
  readonly children?: ReactNode;
}

export function SpaceOverlays({
  labelRef,
  feelTargetRef,
  appliedFeel,
  railWordsRef,
  onSlide,
  requestDraw,
  labelled,
  selectedLine,
  entryHint,
  entryProgress,
  spaceId,
  spaceCount,
  identityColor,
  spacePerfumeCount,
  previousSpaceId,
  nextSpaceId,
  isWarping,
  onNavigateSpace,
  children,
}: SpaceOverlaysProps) {
  const t = useDict();
  const positionRef = useRef<HTMLParagraphElement>(null);
  const restorePositionFocusRef = useRef(false);

  useEffect(() => {
    if (!isWarping && restorePositionFocusRef.current) {
      restorePositionFocusRef.current = false;
      positionRef.current?.focus();
    }
  }, [isWarping, spaceId]);

  const navigateFromArrow = (targetId: number | null) => {
    if (targetId === null || isWarping) return;
    restorePositionFocusRef.current = true;
    onNavigateSpace(targetId);
  };

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
      <div
        data-space-controls="ready"
        className="pointer-events-none absolute left-6 top-6 flex flex-col gap-7 sm:left-10 sm:top-10"
      >
        <div>
          {children}

          {/*
            ⚠️ **Uzay sayacı ekranın ortasında DURAMIYOR ve bu ölçüldü.**
            Eskiden `absolute left-1/2 top-7` ile tepede ortadaydı; 390 px'te
            76 pikselinin **70'i** sağ üstteki kontrollerin altında kalıyordu
            (sahip gördü: "arkada kalıyor"). Sebep kaymanın azlığı değil, yer
            yokluğu: 390'da marka 66 + kontroller 203 + boşluklar + kenar payı
            zaten 293 piksel tutuyor ve ekranın MERKEZİ kontrol bölgesinin
            içine düşüyor. Kaydırmakla çözülmezdi.

            ⚠️ **Eşik eklenmedi, yapı değiştirildi** — `ScreenFrame`in aynı
            hatayı iki kez yaşayıp vardığı karar (`min-[…]` eşikleri her yeni
            kontrolde tekrar ayar istiyordu). Sayaç artık mutlak konumlu değil,
            sol sütunun **akışında**: üstüne binebileceği bir şey yok ve sağ
            üste yarın yeni bir kontrol eklenirse de olmayacak.

            Alt orta denenmedi çünkü zaten dolu: küratör cümlesi ve giriş
            ipucu orada (aşağıdaki sütun yorumunda yazılı).
          */}
          <p
            ref={positionRef}
            tabIndex={-1}
            aria-live="polite"
            aria-atomic="true"
            /*
              `w-fit`: blok olarak bırakılırsa kutusu sütun genişliğini kaplar
              ve görünmez hâlde sağ üstteki kontrollerin ALTINA uzanır. Metin
              çarpışmaz ama ölçüm çakışma gösterir ve odak halkası da satırın
              tamamı kadar uzar.

              ⚠️ **İki konum, tek eleman** (sahip istedi: masaüstünde ortada).
              Telefonda sol sütunun akışında kalıyor — orada ortaya dönmesi
              ölçüldü ve imkansız: 390 px'te marka 66 + kontroller 203 +
              boşluklar zaten 342 pikselin 293'ünü yiyor, ekranın merkezi
              kontrol bölgesinin içine düşüyor.

              ⚠️ `sm:` üstünde `fixed`, `absolute` DEĞİL: bu eleman mutlak
              konumlu bir sütunun içinde duruyor ve `absolute` onu ekrana
              değil o sütuna göre ortalardı. `fixed` görünür alana göre
              konumlanıyor — dönüşümü olan bir ata olmadığı sürece; ölçüldü,
              1440'ta metnin ortası ekranın ortasında.
            */
            className="mt-2 w-fit text-[9px] tracking-[0.28em] text-white/35 outline-none sm:fixed sm:left-1/2 sm:top-9 sm:mt-0 sm:-translate-x-1/2"
          >
            {/*
              Kimlik noktası — geçiş bitince ekranda kalan tek renk işareti.
              `aria-hidden`: sayacın kendisi bir `aria-live` alanı ve okuyucuya
              "renk" diye bir şey söylemenin karşılığı yok; ayrımı görsel
              olmayan ziyaretçi zaten SPACE numarasından okuyor.
            */}
            <span
              aria-hidden="true"
              className="mr-2 inline-block size-1.5 rounded-full align-middle"
              style={{ backgroundColor: identityColor }}
            />
            {t.space.position(spaceId, spaceCount)}
          </p>

          <p className="mt-3 max-w-[15rem] text-xs leading-relaxed text-white/50">
            {t.space.intro(spacePerfumeCount)}
          </p>
        </div>

        <div className="pointer-events-auto w-[19rem] max-w-[calc(100vw-3rem)]">
          <SpaceFeelSliders
            key={spaceId}
            targetRef={feelTargetRef}
            requestDraw={requestDraw}
            applied={appliedFeel}
            onSlide={onSlide}
          />
        </div>
      </div>

      <nav aria-label={t.space.navigation} className="pointer-events-none absolute inset-0 z-20">
        <span className="absolute left-3 top-1/2 h-11 w-11 -translate-y-1/2 sm:left-5">
          <button
            type="button"
            aria-label={t.space.previous}
            disabled={previousSpaceId === null || isWarping}
            onClick={() => navigateFromArrow(previousSpaceId)}
            className="pointer-events-auto flex h-11 w-11 items-center justify-center text-xl text-white/40 transition-[color,transform] hover:-translate-x-0.5 hover:text-white/80 focus-visible:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/35 disabled:pointer-events-none disabled:opacity-0"
          >
            <span aria-hidden="true">←</span>
          </button>
        </span>

        <span className="absolute right-3 top-1/2 h-11 w-11 -translate-y-1/2 sm:right-5">
          <button
            type="button"
            aria-label={t.space.next}
            disabled={nextSpaceId === null || isWarping}
            onClick={() => navigateFromArrow(nextSpaceId)}
            className="pointer-events-auto flex h-11 w-11 items-center justify-center text-xl text-white/40 transition-[color,transform] hover:translate-x-0.5 hover:text-white/80 focus-visible:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/35 disabled:pointer-events-none disabled:opacity-0"
          >
            <span aria-hidden="true">→</span>
          </button>
        </span>
      </nav>

      {/* Meta kontroller — sağ üst: oturum, bildirim ve dil. */}
      <div className="pointer-events-auto absolute right-6 top-6 flex items-center gap-3 sm:right-10 sm:top-10">
        <PerfumeSearch />
        <SignInLink />
        <NotifyControl />
        <LangSwitch />
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
            {/* İnce işaretçi ve dokunma için ayrı eylem sözcükleri. */}
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
