import { useCallback, useRef, type RefObject } from 'react';
import { type FeelTarget } from '@/lib/space-feel';

/**
 * Sinestezi kaydıraçları — uzaya nota adıyla değil hisle sorma yolu.
 *
 * Veri şemasının açıkta kalan sözü buydu (`data/types.ts:62`): "nota bilmeyen
 * biri 'soğuk ve temiz bir şey istiyorum' diyerek arama yapabilsin". Dört
 * karakter ekseninden ikisi kaydıraç oldu; şemanın örnek cümlesinde geçen ikisi.
 *
 * Bileşenin işi yalnızca tarifi toplamak. Tarifin uzayda ne yaptığı çizimde
 * (`space-draw.ts`in `markAlpha`ı), yakınlığın nasıl ölçüldüğü `space-feel.ts`te.
 *
 * ⚠️ Kaydıraçlar **kontrolsüz** (`defaultValue`) ve değer React durumuna hiç
 * girmiyor. Gerekçe `EvolutionChart.tsx:31`'de zaten yazılı: tarayıcı topuzu
 * React'ı beklemeden kendi hızında sürüyor, biz yalnızca türetilen görüntüyü
 * güncelliyoruz. Kare başına bir `setState` demek kare başına bir React ağacı
 * demek olurdu — üstelik ekranda değişen şey tuval, DOM değil.
 *
 * ⚠️ `'use client'` bilerek yok: modül yalnızca istemci bileşeninden import
 * ediliyor, sınırı `ScentSpaceCanvas.tsx` çiziyor — `use-canvas-size.ts` ve
 * `SpaceOverlays.tsx` ile aynı sözleşme.
 */

/** Kaydıraç çözünürlüğü. Tamsayı adım, 0…1'e bölünüyor — kayan nokta yok. */
const STEPS = 100;

/** Topuz ortada doğuyor. Ama orta bir tarif DEĞİL; aşağıdaki `touched`a bak. */
const MIDDLE = STEPS / 2;

/**
 * Ray saç teli inceliğinde, topuz tutulabilir.
 *
 * Elemanın kendisi 16 px yüksek çünkü vuruş alanı o — `h-px` verseydik görünüm
 * doğru olur ama fareyle yakalanamayan bir kontrol çıkardı. İnceliği raya
 * veriyoruz, yüksekliği elemana.
 *
 * Uzayın kendi dili bu: giriş şeridi de, yaklaşma ipucu da saç teli.
 */
const SLIDER_CLASS = [
  'h-4 flex-1 cursor-pointer appearance-none bg-transparent outline-none',
  '[&::-webkit-slider-runnable-track]:h-px [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-white/15',
  '[&::-webkit-slider-thumb]:mt-[-5px] [&::-webkit-slider-thumb]:h-[11px] [&::-webkit-slider-thumb]:w-[11px] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white/70',
  '[&::-moz-range-track]:h-px [&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-white/15',
  '[&::-moz-range-thumb]:h-[11px] [&::-moz-range-thumb]:w-[11px] [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-white/70',
  // Klavyeyle gelen için ray parlıyor: odak görünmezse kaydıraç klavyede kayboluyor.
  'focus-visible:[&::-webkit-slider-runnable-track]:bg-white/45 focus-visible:[&::-moz-range-track]:bg-white/45',
].join(' ');

/** Uç etiketi — giriş ipucuyla aynı tipografi. */
const EDGE_CLASS = 'w-[3.4rem] shrink-0 text-[10px] tracking-[0.2em] text-white/30';

interface AxisProps {
  /** Ekran okuyucuya giden ad; uçlar görsel, bu sözlü. */
  readonly label: string;
  readonly low: string;
  readonly high: string;
  readonly onPick: (value: number) => void;
}

function Axis({ label, low, high, onPick }: AxisProps) {
  return (
    <div className="flex items-center gap-2">
      <span className={`${EDGE_CLASS} text-right`}>{low}</span>
      <input
        type="range"
        min={0}
        max={STEPS}
        step={1}
        defaultValue={MIDDLE}
        autoComplete="off"
        aria-label={label}
        onChange={(event) => onPick(Number(event.target.value) / STEPS)}
        className={SLIDER_CLASS}
      />
      <span className={EDGE_CLASS}>{high}</span>
    </div>
  );
}

interface SpaceFeelSlidersProps {
  /**
   * Tarifin yazıldığı yer — çizim döngüsü buradan okuyor.
   *
   * Ref'i **kurmuyoruz, alıyoruz**: `use-approach-scene` ve `use-canvas-size` ile
   * aynı sözleşme. Yazan burası, okuyan çizim; sahibi ikisini de tanıyan tuval.
   */
  readonly targetRef: RefObject<FeelTarget>;
  readonly requestDraw: () => void;
}

export function SpaceFeelSliders({ targetRef, requestDraw }: SpaceFeelSlidersProps) {
  /*
   * İki eksenin ham değeri. Durumda değil ref'te, çünkü ekranda değişen şey
   * tuval; React'in yeniden çizeceği bir metin yok.
   */
  const valuesRef = useRef<[number, number]>([MIDDLE / STEPS, MIDDLE / STEPS]);

  /**
   * Tarifi tazeler — ve ilk çağrısıyla "sormuyorum"u "şunu soruyorum"a çevirir.
   *
   * ⚠️ Dokunulmamışlığı ayrı bir bayrak taşımıyor, `targetRef`in `NO_FEEL`
   * doğması taşıyor. Ayrım önemli: topuzlar ortada duruyor ama ortası bir tarif
   * DEĞİL. Ortayı tarif saysaydık uzay daha varış anında, kimse bir şey
   * sormadan sönerdi — "0.5, 0.5"e uzak kalan her parfüm karartılırdı.
   *
   * İlk dokunuştan sonra geri dönüş yok; topuz ortaya geri getirildiğinde de
   * soru sorulmuş sayılıyor. "Tam ortası nasıl?" geçerli bir soru.
   *
   * `useCallback` süs değil: gövde ref'lere dokunuyor ve render sırasında
   * çağrılan bir fabrikadan üretilseydi React 19 bunu haklı olarak "render
   * sırasında ref erişimi" sayardı.
   */
  const update = useCallback(
    (axis: 0 | 1, value: number) => {
      valuesRef.current[axis] = value;
      targetRef.current = [valuesRef.current[0], valuesRef.current[1]];
      requestDraw();
    },
    [targetRef, requestDraw],
  );

  return (
    <div className="flex flex-col gap-2.5">
      <Axis
        label="Sıcaklık — soğuktan sıcağa"
        low="SOĞUK"
        high="SICAK"
        onPick={(value) => update(0, value)}
      />
      <Axis
        label="Temizlik — kirliden temize"
        low="KİRLİ"
        high="TEMİZ"
        onPick={(value) => update(1, value)}
      />
    </div>
  );
}
