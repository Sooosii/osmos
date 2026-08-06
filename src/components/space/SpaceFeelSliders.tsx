import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { type FeelTarget, NO_FEEL, hasFeel } from '@/lib/space-feel';
import { formatFeel, parseFeel } from '@/lib/space-feel-url';

/**
 * Sinestezi kaydıraçları — uzaya nota adıyla değil hisle sorma yolu.
 *
 * Veri şemasının açıkta kalan sözü buydu (`data/types.ts:62`): "nota bilmeyen
 * biri 'soğuk ve temiz bir şey istiyorum' diyerek arama yapabilsin".
 *
 * Dört eksenin ikisi hep açık, ikisi "…" ile geliyor. Sıcaklık ve temizlik
 * önde çünkü şemanın kendi örnek cümlesi onları sayıyor; doku ve yakınlık daha
 * ince ayrımlar ve boşluk üzerine kurulmuş bir ekranda dört satır kontrol fazla
 * geliyordu.
 *
 * Bileşenin işi yalnızca tarifi toplamak. Tarifin uzayda ne yaptığı çizimde
 * (`space-draw.ts`in `markAlpha`ı), yakınlığın nasıl ölçüldüğü `space-feel.ts`te.
 *
 * ⚠️ Kaydıraçlar **kontrolsüz** (`defaultValue`) ve değer React durumuna hiç
 * girmiyor. Gerekçe `EvolutionChart.tsx:31`'de zaten yazılı: tarayıcı topuzu
 * React'ı beklemeden kendi hızında sürüyor, biz yalnızca türetilen görüntüyü
 * güncelliyoruz. Açılıp kapanma ise durumda — o seyrek değişiyor ve gerçekten
 * React'in yeniden çizeceği bir şey.
 *
 * ⚠️ `'use client'` bilerek yok: modül yalnızca istemci bileşeninden import
 * ediliyor, sınırı `ScentSpaceCanvas.tsx` çiziyor — `use-canvas-size.ts` ve
 * `SpaceOverlays.tsx` ile aynı sözleşme.
 */

/** Kaydıraç çözünürlüğü. Tamsayı adım, 0…1'e bölünüyor — kayan nokta yok. */
const STEPS = 100;

/** Topuz ortada doğuyor. Ama orta bir tarif DEĞİL; `update`in yorumuna bak. */
const MIDDLE = STEPS / 2;

/**
 * "…" ile gelen eksenler — `Character` sırasındaki yerleri: doku ve yakınlık.
 *
 * Kapanışta bu ikisi tariften düşürülüyor, o yüzden tek yerde duruyorlar.
 */
const DETAIL_AXES = [1, 3] as const;

/**
 * Kaydıracın kendisi: görünmez ray, görünür topuz.
 *
 * ⚠️ Ray burada boyanmıyor, arkadaki kardeş çizgi boyuyor. Sebebi ölçülerek
 * bulundu ve gerçek bir hataydı: `appearance:none` bir range input'ta 1 px'lik
 * `::-webkit-slider-runnable-track` kutunun dikey ORTASINA değil ÜSTÜNE
 * oturuyor. Topuzu o rayın üstünde ortalamak için verilen negatif üst boşluk da
 * topuzun yarısını kutunun dışına taşırıyordu — yani gördüğün topuzun üst
 * yarısı tıklanamıyordu. İki kaydıraç alt alta olduğunda ıska aradaki boşluğa
 * düşüyor ve "kaydıraç çalışmıyor" hissi veriyordu.
 *
 * Ray tam yükseklikte ve saydam: topuz kutunun içinde, tam ortada duruyor ve
 * görünen yer ile tutulabilen yer birebir örtüşüyor.
 */
const SLIDER_CLASS = [
  // Satır 16 px, topuz 11 px; üst boşluk (16−11)/2 = 2.5 px ile tam ortalanıyor.
  // ⚠️ Değerler literal yazılmak zorunda: Tailwind kaynağı statik tarıyor,
  // şablon dizesinden üretilen sınıf adını göremez ve stil sessizce düşer.
  'peer relative z-10 h-4 w-full cursor-pointer appearance-none bg-transparent outline-none',
  '[&::-webkit-slider-runnable-track]:h-4 [&::-webkit-slider-runnable-track]:bg-transparent',
  '[&::-webkit-slider-thumb]:mt-[2.5px] [&::-webkit-slider-thumb]:h-[11px] [&::-webkit-slider-thumb]:w-[11px]',
  '[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white/70',
  '[&::-moz-range-track]:h-4 [&::-moz-range-track]:bg-transparent',
  '[&::-moz-range-thumb]:h-[11px] [&::-moz-range-thumb]:w-[11px]',
  '[&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-white/70',
].join(' ');

/**
 * Uç etiketi — giriş ipucuyla aynı tipografi.
 *
 * Genişlik en uzun etikete göre: altı harfli KADİFE/KESKİN/HAVADA. Sabit olması
 * şart, yoksa dört kaydıracın rayları farklı yerlerden başlar, sütun eğrilirdi.
 */
const EDGE_CLASS = 'w-[4.2rem] shrink-0 text-[10px] tracking-[0.15em] text-white/30';

interface AxisProps {
  /** `Character` sırasındaki yeri: 0 sıcaklık, 1 doku, 2 temizlik, 3 yakınlık. */
  readonly axis: number;
  /** Ekran okuyucuya giden ad; uçlar görsel, bu sözlü. */
  readonly label: string;
  readonly low: string;
  readonly high: string;
  readonly onPick: (axis: number, value: number) => void;
  /** Topuğun doğduğu yer, 0…STEPS. Adresten gelen tarif buradan giriyor. */
  readonly start: number;
  /** Topuk bırakıldı — adres çubuğu burada tazeleniyor. */
  readonly onCommit: () => void;
}

function Axis({ axis, label, low, high, onPick, start, onCommit }: AxisProps) {
  return (
    <div className="flex items-center gap-2">
      <span className={`${EDGE_CLASS} text-right`}>{low}</span>

      <span className="relative flex h-4 flex-1 items-center">
        <input
          type="range"
          min={0}
          max={STEPS}
          step={1}
          defaultValue={start}
          autoComplete="off"
          aria-label={label}
          onChange={(event) => onPick(axis, Number(event.target.value) / STEPS)}
          /*
            Adres çubuğu sürüklerken değil BIRAKINCA yazılıyor. Her karede
            yazsaydık tek bir sürükleme yüzlerce adrese bölünürdü; geri tuşu da
            onların arasında dolaşırdı. Klavyeyle gelen için `onKeyUp` şart:
            ok tuşuyla sürülen topuk hiç `pointerup` üretmiyor.
          */
          onPointerUp={onCommit}
          onKeyUp={onCommit}
          className={SLIDER_CLASS}
        />
        {/* Saç teli ray — sitenin kendi dili. Odakta parlıyor ki klavyeyle
            gelen kaydıracın nerede olduğunu görsün. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-1/2 h-px -translate-y-1/2 rounded-full bg-white/15 transition-colors peer-focus-visible:bg-white/45"
        />
      </span>

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
   * Eksenlerin ham değeri. Durumda değil ref'te, çünkü ekranda değişen şey
   * tuval; React'in yeniden çizeceği bir metin yok.
   */
  /**
   * Adresten gelen tarif — ilk çizimde DEĞİL, bağlandıktan sonra.
   *
   * ⚠️ Bir kere render sırasında okundu ve hata verdi: `typeof window`e bakan bir
   * dal sunucu ile istemcinin farklı çizmesine yol açıyor ve React "Hydration
   * failed" diyor. Sunucuda çizilmediğini varsaymıştım; çizilmiyor sanılan ağaç
   * geliştirmede çiziliyor. Doğrusu ikisinin de boş tarifle doğması, adresin
   * sonradan uygulanması.
   */
  const [initial, setInitial] = useState<FeelTarget>(NO_FEEL);

  const valuesRef = useRef<(number | null)[]>([...NO_FEEL]);

  /**
   * "…" açık mı?
   *
   * Adreste doku veya yakınlık sorulmuşsa aşağıdaki etki bunu **açıyor**. Kapalı
   * kalsaydı paylaşılan link, kullanıcının göremediği iki koşulla daralmış bir
   * uzay gösterirdi — `toggleDetail`in kaçındığı şeyin ta kendisi.
   */
  const [detailed, setDetailed] = useState(false);

  /**
   * Bir ekseni tazeler — ve o ekseni "sormuyorum"dan "şunu soruyorum"a geçirir.
   *
   * ⚠️ Dokunulmamışlığı ayrı bir bayrak taşımıyor, değerin `null` doğması
   * taşıyor. Ayrım eksen BAŞINA ve bu gizli eksenler yüzünden şart oldu: "…"
   * ile açılan doku kaydıracı ortada duruyor, ama kullanıcı ona hiç dokunmadan
   * ortayı bir tarif saysaydık iki eksen daha açmak, sorulmamış iki koşulla
   * cevabı sessizce daraltırdı.
   *
   * `useCallback` süs değil: gövde ref'lere dokunuyor ve render sırasında
   * çağrılan bir fabrikadan üretilseydi React 19 bunu haklı olarak "render
   * sırasında ref erişimi" sayardı.
   */
  const update = useCallback(
    (axis: number, value: number) => {
      valuesRef.current[axis] = value;
      targetRef.current = [...valuesRef.current];
      requestDraw();
    },
    [targetRef, requestDraw],
  );

  /*
   * Adres bağlandıktan sonra okunuyor ve tarif yürürlüğe giriyor.
   *
   * `useSearchParams` DEĞİL, doğrudan `window.location`: adres çubuğunu aşağıda
   * kendimiz yazıyoruz ve Next'in kancasıyla okusaydık her yazma bu ağacı
   * yeniden çizerdi — tuval kendini kurar, sahne başa dönerdi.
   *
   * Bir karelik gecikme görünmüyor: kaydıraçlar yaklaşma sahnesi boyunca zaten
   * ekranda değil.
   *
   * ⚠️ `react-hooks/set-state-in-effect` burada bilerek kapalı. Kuralın kaçındığı
   * şey türetilebilir durumu etkiyle senkronlamak; buradaki durum türetilemiyor,
   * çünkü kaynağı DIŞARIDA (adres çubuğu) ve render sırasında okumak sunucu ile
   * istemciyi ayırıp hidrasyonu kırıyor — bir kez öyle yazıldı ve React
   * "Hydration failed" verdi. Etki bir kez çalışıyor, adres sonradan kendiliğinden
   * değişmiyor: yazan da biziz (`commit`) ve o `replaceState` kimseyi uyandırmıyor.
   */
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const fromUrl = parseFeel(new URLSearchParams(window.location.search).get('feel'));
    if (!hasFeel(fromUrl)) return;

    valuesRef.current = [...fromUrl];
    targetRef.current = fromUrl;
    setInitial(fromUrl);
    setDetailed(DETAIL_AXES.some((axis) => fromUrl[axis] !== null));
    requestDraw();
  }, [targetRef, requestDraw]);
  /* eslint-enable react-hooks/set-state-in-effect */

  /**
   * Tarifi adres çubuğuna yazar.
   *
   * `replaceState`, `push` değil ve Next'in yönlendiricisi hiç karışmıyor:
   *
   *   · `push` olsaydı her topuk bırakışı geçmişe bir adım eklerdi ve geri tuşu
   *     uzaydan çıkmak yerine kaydıraç geçmişinde gezerdi.
   *   · `router.replace` bu ağacı yeniden çizer, tuval kendini yeniden kurardı.
   *
   * `?mark=` korunuyor: adresteki öbür parametreler olduğu gibi kalıyor, yalnızca
   * `feel` tazeleniyor. Sorulmuş eksen kalmadıysa parametre tamamen siliniyor.
   */
  const commit = useCallback(() => {
    const url = new URL(window.location.href);
    const param = formatFeel(valuesRef.current);
    if (param === null) url.searchParams.delete('feel');
    else url.searchParams.set('feel', param);

    /*
      Virgüller okunur kalıyor. `searchParams` onları `%2C` diye kodluyor ve
      `?feel=0.75%2C0.3%2C%2C0.8` gidip dönerken çalışıyor ama paylaşılan bir
      linkte okunmuyor — oysa adreste taşımanın bütün sebebi o link. Virgül
      sorgu dizesinde zaten yasal (RFC 3986 sub-delims), kodlanması şart değil.
    */
    window.history.replaceState(null, '', url.href.replace(/%2C/g, ','));
  }, []);

  /**
   * "…" düğmesi — açar, kapatır.
   *
   * ⚠️ Kapanırken doku ve yakınlık tariften **düşürülüyor.** Görünmeyen bir
   * koşulun cevabı sürüklemesi, kaydıraçların en baştan kaçındığı şeyin ta
   * kendisi olurdu: kullanıcı ekranda göremediği bir sebeple daralmış bir cevaba
   * bakardı. Kapatmanın tek dürüst anlamı "artık bunları sormuyorum".
   *
   * Kaydıraçların kendisini sıfırlamaya gerek yok: eksenler DOM'dan kalkıyor,
   * tekrar açıldıklarında `defaultValue` ile ortada doğuyorlar. Yani gördüğün
   * topuz ile tarifteki değer hep aynı şeyi söylüyor.
   */
  const toggleDetail = useCallback(() => {
    if (detailed) {
      for (const axis of DETAIL_AXES) valuesRef.current[axis] = null;
      targetRef.current = [...valuesRef.current];
      requestDraw();
      // Kapanış da bir karar: adres, ekranda görünmeyen iki koşulu taşımasın.
      commit();
    }
    setDetailed(!detailed);
  }, [detailed, targetRef, requestDraw, commit]);

  /**
   * Topuğun doğacağı yer.
   *
   * Sorulmamış eksen ortada doğuyor — `MIDDLE` bir tarif değil, yalnızca
   * topuğun durduğu yer (`update`in yorumu). Adresten değer geldiyse topuk
   * oraya oturuyor ve gördüğün yer ile tarif aynı şeyi söylüyor.
   */
  const startOf = (axis: number) => {
    const value = initial[axis];
    return value === null || value === undefined ? MIDDLE : Math.round(value * STEPS);
  };

  return (
    /*
      `key` süs değil: kaydıraçlar kontrolsüz, yani `defaultValue` yalnızca
      doğdukları anda okunuyor. Adres sonradan geldiği için topuklar bir kez
      yeniden doğmak zorunda, yoksa tarif yürürlükte olur ama topuklar ortada
      durur — gördüğün yer ile tarif farklı şeyler söylerdi.
    */
    <div key={hasFeel(initial) ? 'adresten' : 'bos'} className="flex flex-col gap-2.5">
      <Axis
        axis={0}
        label="Sıcaklık — soğuktan sıcağa"
        low="SOĞUK"
        high="SICAK"
        onPick={update}
        start={startOf(0)}
        onCommit={commit}
      />
      <Axis
        axis={2}
        label="Temizlik — kirliden temize"
        low="KİRLİ"
        high="TEMİZ"
        onPick={update}
        start={startOf(2)}
        onCommit={commit}
      />

      {detailed ? (
        <>
          {/*
            Etiketler ekranda seçildi.

            "Doku" için önce PÜRÜZSÜZ↔TIRTIKLI vardı ve anlaşılmadı. Sonra
            YUMUŞAK↔SERT denendi; SERT'in bilinen riski göze alınmıştı — Türkçede
            parfüm için genelde "ağır, keskin" demek, yani doku değil şiddet
            sanılabilir. Ekranda o risk gerçekleşti ve YUMUŞAK da tutmadı.

            KADİFE↔KESKİN sahibin nota sayfasına bakarken seçtiği çift. Sözcükler
            burada da aynı olmak zorunda: kaydıraç ile nota ölçümü **aynı veriyi**
            gösteriyor (`Character.texture`) ve tek bir eksene iki ad takmak
            kullanıcıya iki ayrı şey varmış gibi geliyor.

            "Yakınlık" için UZAK↔YAKIN büsbütün yanlış okunuyordu: mesafeden
            bahsettiği sanılıyordu, oysa eksen kokunun NEREDE durduğunu söylüyor.
            HAVADA↔TENDE doğrudan yeri adlandırıyor ve `types.ts:71`'in kendi
            sözleriyle aynı: "havada dağılan" ↔ "tene yapışan".
          */}
          <Axis
            axis={DETAIL_AXES[0]}
            label="Doku — kadifemsiden keskine"
            low="KADİFE"
            high="KESKİN"
            onPick={update}
            start={startOf(DETAIL_AXES[0])}
            onCommit={commit}
          />
          <Axis
            axis={DETAIL_AXES[1]}
            label="Yakınlık — havada dağılandan tene yapışana"
            low="HAVADA"
            high="TENDE"
            onPick={update}
            start={startOf(DETAIL_AXES[1])}
            onCommit={commit}
          />
        </>
      ) : null}

      {/*
        Üç nokta hep duruyor: aynı düğme hem açıyor hem kapatıyor.

        Kapanışta eksenler tariften DÜŞÜYOR (`toggleDetail`). Kapanıp da tarifte
        kalsalardı ekranda görünmeyen iki koşul cevabı sürüklerdi ve kullanıcı
        neden o sonucu aldığını göremezdi — kapatmanın tek dürüst anlamı "artık
        bunları sormuyorum".
      */}
      {/*
        Hiza sihirli sayıdan değil, kaydıraçlarla AYNI iskeletten geliyor: boş
        bir etiket sütunu, sonra düğme. Böylece üç nokta rayların tam başladığı
        yerde duruyor ve `EDGE_CLASS` değişince kendiliğinden takip ediyor.

        Önce `ml-[…rem]` ile hizalanmıştı ve iki kez ısırdı: hem etiket
        genişliğiyle elle eşlenmesi gereken ikinci bir sayıydı, hem de Tailwind
        yeni bir keyfi değer için sınıfı üretmeyince hiza sessizce kayıyordu.
      */}
      <div className="flex items-center gap-2">
        <span className={EDGE_CLASS} aria-hidden="true" />
        <button
          type="button"
          onClick={toggleDetail}
          aria-expanded={detailed}
          aria-label={
            detailed ? 'Doku ve yakınlık eksenlerini kapat' : 'İki eksen daha: doku ve yakınlık'
          }
          className={`w-fit rounded-full px-2 py-1 text-[13px] leading-none tracking-[0.3em] transition-colors hover:text-white/60 focus-visible:text-white/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/30 ${
            detailed ? 'text-white/45' : 'text-white/25'
          }`}
        >
          …
        </button>
      </div>
    </div>
  );
}
