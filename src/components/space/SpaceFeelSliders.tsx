import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { type FeelTarget, NO_FEEL, hasFeel } from '@/lib/space-feel';
import { formatFeel, parseFeel } from '@/lib/space-feel-url';
import { useDict } from '@/i18n/LocaleProvider';

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

/**
 * Kaç kaydıracın açık olduğu — üç durum.
 *
 * `'ikisi'` sıcaklık ve temizlik (açılış), `'dordu'` doku ve yakınlık da,
 * `'hicbiri'` hiç kaydıraç yok ve harita tamamen açıkta.
 */
type Acilim = 'ikisi' | 'dordu' | 'hicbiri';

/** Üç noktalı düğmenin dönen sırası; sahibin seçtiği dizi. */
const ACILIM_SIRASI: readonly Acilim[] = ['ikisi', 'dordu', 'hicbiri'];

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
 * Genişlik en uzun etikete göre: altı harfli VELVET. Sabit olması şart, yoksa
 * dört kaydıracın rayları farklı yerlerden başlar, sütun eğrilirdi. Aynı sınır
 * `i18n/en.ts`teki uç damgalarına da geçerli — 'ON SKIN' bu yüzden elendi.
 */
/*
  ⚠️ Telefonda bir kademe küçük. Panelin kendisi 19 rem'den 14 rem'e indi
  (`SpaceOverlays`); iki uç sütunu 4.2 rem'de kalsaydı rayın kendisine kalan yer
  90 pikselin altına inerdi — sürüklenecek bir şey kalmazdı. En uzun uç altı
  harf (VELVET) ve 3.4 rem onu 9 puntoda taşıyor.
*/
const EDGE_CLASS =
  'w-[3.4rem] shrink-0 text-[9px] tracking-[0.12em] text-white/50 sm:w-[4.2rem] sm:text-[10px] sm:tracking-[0.15em]';

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
  /**
   * Bu eksenin açıklaması — soru işaretinin altından çıkan yazı.
   *
   * ⚠️ Dört eksenin DÖRDÜNDE de dolu. Eskiden yalnız sıcaklıkta bir işaret
   * vardı ve tıklanınca dördünü birden anlatan bir panel açıyordu; sahip
   * "hepsinden de birer tane olsun" dedi. Açıklamanın sorulan eksenin yanında
   * durması, hangi cümlenin hangi raya ait olduğunu aramayı da bitiriyor.
   */
  readonly help: string;
  /** Ekran okuyucuya giden düğme adı; `sliders.help.about`tan geliyor. */
  readonly helpLabel: string;
  /** Açıklama basılarak açık tutuluyor mu? */
  readonly helpOpen: boolean;
  /** Soru işaretine basıldı — açıksa kapanıyor, kapalıysa açılıyor. */
  readonly onToggleHelp: (axis: number) => void;
  /** Odak eksenden çıktı — basılı kalan açıklama düşüyor. */
  readonly onCloseHelp: () => void;
}

function Axis({
  axis,
  label,
  low,
  high,
  onPick,
  start,
  onCommit,
  help,
  helpLabel,
  helpOpen,
  onToggleHelp,
  onCloseHelp,
}: AxisProps) {
  const helpId = `eksen-yardim-${axis}`;

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

      {/*
        Uç sözcüğü ve onun sağ üstündeki soru işareti.

        ⚠️ Sözcük ile işaret AYNI kutuda ve kutu `EDGE_CLASS` genişliğinde:
        işaret akışa girse dört rayın bittiği yer eğrilirdi (aynı gerekçe
        sol uçtaki sabit genişlikte de yazılı). `align-super` onu satırın
        yüksekliğini büyütmeden yukarı alıyor.
      */}
      <span className={`${EDGE_CLASS} relative`}>
        {high}

        {/*
          Açıklama kutusu: üstüne gelince beliriyor, BASINCA açık kalıyor.

          ⚠️ İlk sürüm tamamen CSS'ti (`peer-hover`) ve okunmuyordu: kutuyu
          okumak için fareyi kıpırdatmadan tutmak gerekiyordu, bir milim kayınca
          yazı kayboluyordu. Sahip gördü — "basınca okunsun, geri çıkınca
          kapansın". Bu bir KILIT ve kilidin durumu CSS'te tutulamaz.

          Bugünkü davranış:
            · üstüne gel          → beliriyor (önizleme, kilit yok)
            · bas                 → açık KALIYOR, fare çekilse de duruyor
            · tekrar bas          → kapanıyor
            · başka yere geç, Esc → kapanıyor

          ⚠️ Kilit bu bileşende değil bir üst katmanda, ve sebebi tek kural:
          aynı anda yalnız bir açıklama açık kalsın. İki kutu birden açıkken
          hangisinin hangi raya ait olduğu kaybolurdu — açıklamayı eksenin
          yanına taşımanın bütün sebebi buydu.

          ⚠️ Üstüne gelme kısmı **`peer`, `group` değil** ve bu ölçülerek
          bulundu: bu projede `group-focus-within` hiç üretilmiyor, düğme
          odaktayken kutu görünmüyordu. Kardeş seçici bu dosyada zaten kanıtlı —
          rayın odak parıltısı da onunla çalışıyor.
        */}
        <span className="relative inline-block">
          <button
            type="button"
            aria-label={helpLabel}
            aria-describedby={helpId}
            aria-expanded={helpOpen}
            onClick={() => onToggleHelp(axis)}
            /*
              Odak eksenden çıkınca kilit düşüyor: "geri çıktığında kapansın".
              `onBlur` hem sekmeyle geçmeyi hem de başka bir yere dokunmayı
              karşılıyor; ikisi için ayrı dinleyici gerekmiyor.
            */
            onBlur={onCloseHelp}
            onKeyDown={(event) => {
              if (event.key === 'Escape' && helpOpen) onCloseHelp();
            }}
            /* Odak halkası ve yuvarlak gövde "…" düğmesinden birebir: uzayda
               tıklanabilir olan her şey aynı dili konuşuyor. */
            className={`peer ml-1 rounded-full px-1 py-0.5 align-super text-[9px] leading-none transition-colors hover:text-white focus-visible:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/30 ${
              helpOpen ? 'text-white' : 'text-white/40'
            }`}
          >
            ?
          </button>

          {/*
            ⚠️ Kutu `absolute` ve sağa yaslı: panelin sağ kenarındaki bir
            işaretten sola doğru açılıyor. Genişlik telefonda 13 rem — ölçüldü,
            15 rem'de kutunun sol kenarı ekranın 4 piksel dışında kalıyordu.

            Zemin donuk siyah, çünkü altında harita var: saydam bir kutuda
            renkli noktalar cümlenin harflerini yiyor — aynı ölçüm eski açıklama
            panelinde de yapılmıştı.
          */}
          <span
            id={helpId}
            role="tooltip"
            className={`pointer-events-none absolute bottom-full right-0 z-20 mb-2 w-[13rem] max-w-[70vw] rounded-sm border border-white/10 bg-black/90 px-3 py-2 text-[11px] leading-[1.7] tracking-normal text-white/70 transition-opacity duration-150 sm:w-[15rem] ${
              helpOpen ? 'opacity-100' : 'opacity-0 peer-hover:opacity-100'
            }`}
          >
            {help}
          </span>
        </span>
      </span>
    </div>
  );
}

interface SpaceFeelSlidersProps {
  /**
   * Tarifin yazıldığı yer — çizim döngüsü buradan okuyor.
   *
   * Ref'i **kurmuyoruz, alıyoruz**: yazan burası, okuyan çizim; sahibi ikisini
   * de tanıyan tuval.
   */
  readonly targetRef: RefObject<FeelTarget>;
  readonly requestDraw: () => void;
  /**
   * Dışarıdan gelen tarif — sıcaklık rayından.
   *
   * ⚠️ Topuklar kontrolsüz (`defaultValue`), yani yeni bir tarif ancak grup
   * YENIDEN DOĞARSA topuğa yansıyor. Aşağıdaki `key` bunun için değer taşıyor.
   */
  readonly applied: FeelTarget | null;
  /** Topuğa dokunuldu — ray tarifi artık geçerli değil. */
  readonly onSlide: () => void;
}

export function SpaceFeelSliders({
  targetRef,
  requestDraw,
  applied,
  onSlide,
}: SpaceFeelSlidersProps) {
  /*
    Dört eksenin sözcükleri; nota sayfasındaki ölçümle aynı kaynaktan.

    ⚠️ Modül düzeyinde duramaz: kanca ancak bileşenin içinde çağrılabilir ve
    sözcükler artık sayfanın diline bağlı.
  */
  const WORDS = useDict().space.sliders;

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
   * Kaç kaydıraç açık — üç durum, dönen bir sıra.
   *
   * Sahibin seçtiği dizi: **ikisi → dördü → hiçbiri → ikisi**. Eskiden iki
   * durum vardı (iki ya da dört kaydıraç) ve haritayı tamamen açığa çıkarmanın
   * yolu yoktu; telefonda panel 390 piksellik ekranın 304'ünü kaplıyor, yani
   * "hiçbiri" bir süs değil, haritaya bakmanın tek yolu.
   *
   * Adreste doku veya yakınlık sorulmuşsa aşağıdaki etki bunu `'dordu'` yapıyor.
   * Paylaşılan bir link asla `'hicbiri'` ile açılmıyor: tarif yürürlükte olup
   * ekranda görünmeyen bir kaydıraçtan gelirdi.
   */
  const [acilim, setAcilim] = useState<Acilim>('ikisi');

  /**
   * Sıfırlama sayacı — yalnızca topukları yeniden doğurmak için.
   *
   * ⚠️ Süs değil, sessiz bir hatanın karşılığı. Kaydıraçlar kontrolsüz
   * (`defaultValue`), yani topuk ancak grup YENIDEN DOĞARSA yerine oturuyor ve
   * grubun kimliği (`key`) tarifin kendisinden geliyor. Tarif zaten boşken
   * sürüklenmiş bir topuk için o kimlik hiç değişmez: sıfırla düğmesi tarifi
   * temizler, adres temizlenir, ama ekrandaki topuz kenarda kalırdı — gördüğün
   * yer ile sorulan şey farklı şeyler söylerdi.
   */
  const [sifirlamaSayisi, setSifirlamaSayisi] = useState(0);

  /**
   * Basılarak açık tutulan açıklama — hangi eksenin, ya da hiçbiri.
   *
   * ⚠️ Durum eksenin İÇİNDE değil burada, ve sebebi tek bir kural: aynı anda
   * yalnız bir açıklama açık kalsın. Dört kutu birden açık olsaydı hangisinin
   * hangi raya ait olduğu kaybolurdu.
   *
   * Üstüne gelme hâlâ CSS'te (`peer-hover`) ve durum tutmuyor: önizleme her
   * karede React'i uyandırmamalı. Buradaki durum yalnızca KILIDI taşıyor.
   */
  const [acikYardim, setAcikYardim] = useState<number | null>(null);

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
      // Topuğa dokunmak rayın tarifini düşürüyor: iki kaynak aynı anda
      // konuşursa hangisinin cevabına bakıldığı belirsizleşir.
      onSlide();
      requestDraw();
    },
    [targetRef, requestDraw, onSlide],
  );

  /*
   * Adres bağlandıktan sonra okunuyor ve tarif yürürlüğe giriyor.
   *
   * `useSearchParams` DEĞİL, doğrudan `window.location`: adres çubuğunu aşağıda
   * kendimiz yazıyoruz ve Next'in kancasıyla okusaydık her yazma bu ağacı
   * yeniden çizerdi — tuval kendini kurar, sahne başa dönerdi.
   *
   * Adres yalnız bağlandıktan sonra okunabilir; bu, sunucu ve istemcinin ilk
   * çıktısını aynı tutarak hidrasyon uyuşmazlığını önler.
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
    setAcilim(DETAIL_AXES.some((axis) => fromUrl[axis] !== null) ? 'dordu' : 'ikisi');
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
   * Tarifi tamamen boşaltır — dört eksen de "sormuyorum" hâline döner.
   *
   * Üç şeyi birden yapmak zorunda ve üçü de gerekli:
   *   · değer (`valuesRef` + `targetRef`) — çizim döngüsünün okuduğu yer
   *   · adres (`commit`) — paylaşılan link daralmış bir uzay göstermesin
   *   · topuk (`setInitial` + sayaç) — gördüğün yer ile sorulan şey aynı olsun
   *
   * ⚠️ Sayaç olmadan üçüncüsü sessizce eksik kalıyor; gerekçe `sifirlamaSayisi`
   * tanımında yazılı.
   */
  const yardimKapat = useCallback(() => setAcikYardim(null), []);

  const yardimDegistir = useCallback(
    (axis: number) => setAcikYardim((acik) => (acik === axis ? null : axis)),
    [],
  );

  const temizle = useCallback(() => {
    /* Kilit de düşüyor: sıfırlamadan sonra havada kalmış bir açıklama, ekranda
       artık sorulmayan bir şeyi anlatıyor olurdu. */
    setAcikYardim(null);
    valuesRef.current = [...NO_FEEL];
    targetRef.current = NO_FEEL;
    setInitial(NO_FEEL);
    setSifirlamaSayisi((sayi) => sayi + 1);
    onSlide();
    commit();
    requestDraw();
  }, [targetRef, requestDraw, commit, onSlide]);

  /**
   * "…" düğmesi — üç durum arasında dönüyor.
   *
   * ⚠️ **`'hicbiri'`ne geçerken tarif tamamen düşüyor.** Kural eskiden yalnız
   * doku ve yakınlık için vardı; gerekçesi değişmedi, kapsamı büyüdü: ekranda
   * görünmeyen bir koşulun cevabı daraltması, kaydıraçların en baştan kaçındığı
   * şeyin ta kendisi. Hiç kaydıraç görünmüyorsa hiçbir şey sorulmuyor demektir.
   *
   * Dörtten ikiye inen bir adım YOK — sıra `'dordu'`dan `'hicbiri'`ne geçiyor —
   * ama doku ve yakınlığın ayrıca düşürülmesine gerek de yok: `temizle` zaten
   * dördünü birden alıyor.
   *
   * `'hicbiri'`den `'ikisi'`ye dönerken düşürülecek bir şey yok, tarif zaten boş.
   */
  const ilerlet = useCallback(() => {
    setAcikYardim(null);
    const yeri = ACILIM_SIRASI.indexOf(acilim);
    const sonraki = ACILIM_SIRASI[(yeri + 1) % ACILIM_SIRASI.length] ?? 'ikisi';

    if (sonraki === 'hicbiri') temizle();
    setAcilim(sonraki);
  }, [acilim, temizle]);

  /** Düğmenin yazısı basılınca NE OLACAĞINI söylüyor — `chart.pause` ile aynı kural. */
  const ACILIM_ADI: Readonly<Record<Acilim, string>> = {
    ikisi: WORDS.openDetail,
    dordu: WORDS.closeDetail,
    hicbiri: WORDS.reopenBasic,
  };

  /*
    Raydan gelen tarif yürürlüğe giriyor.

    ⚠️ Aynı `set-state-in-effect` gerekçesi: kaynak DIŞARIDA (çizim döngüsünün
    ref'i) ve türetilebilir değil. `applied` yalnızca parmak kalkınca
    değişiyor, yani bu etki sürükleme boyunca hiç çalışmıyor.
  */
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (applied === null) return;

    valuesRef.current = [...applied];
    targetRef.current = applied;
    setInitial(applied);
    setAcilim(DETAIL_AXES.some((axis) => applied[axis] !== null) ? 'dordu' : 'ikisi');
    commit();
    requestDraw();
  }, [applied, targetRef, requestDraw, commit]);
  /* eslint-enable react-hooks/set-state-in-effect */


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

      Sıfırlama sayacı da kimliğin içinde: tarif ZATEN boşken sürüklenmiş bir
      topuğu yerine oturtan tek şey o (gerekçe `sifirlamaSayisi` tanımında).
    */
    <div
      key={`${formatFeel(initial) ?? 'bos'}-${sifirlamaSayisi}`}
      className="flex flex-col gap-2.5"
    >
      {acilim !== 'hicbiri' ? (
        <>
          <Axis
            axis={0}
            label={WORDS.temperature.label}
            low={WORDS.temperature.low}
            high={WORDS.temperature.high}
            onPick={update}
            start={startOf(0)}
            onCommit={commit}
            help={WORDS.help.temperature}
            helpLabel={WORDS.help.about(WORDS.temperature.label)}
            helpOpen={acikYardim === 0}
            onToggleHelp={yardimDegistir}
            onCloseHelp={yardimKapat}
          />
          <Axis
            axis={2}
            label={WORDS.cleanliness.label}
            low={WORDS.cleanliness.low}
            high={WORDS.cleanliness.high}
            onPick={update}
            start={startOf(2)}
            onCommit={commit}
            help={WORDS.help.cleanliness}
            helpLabel={WORDS.help.about(WORDS.cleanliness.label)}
            helpOpen={acikYardim === 2}
            onToggleHelp={yardimDegistir}
            onCloseHelp={yardimKapat}
          />
        </>
      ) : null}

      {acilim === 'dordu' ? (
        <>
          {/*
            Etiketler ekranda seçildi.

            "Doku" için önce PÜRÜZSÜZ↔TIRTIKLI vardı ve anlaşılmadı. Sonra
            YUMUŞAK↔SERT denendi; SERT'in bilinen riski göze alınmıştı — Türkçede
            parfüm için genelde "ağır, keskin" demek, yani doku değil şiddet
            sanılabilir. Ekranda o risk gerçekleşti ve YUMUŞAK da tutmadı.

            KADIFE↔KESKIN sahibin nota sayfasına bakarken seçtiği çift. Sözcükler
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
            label={WORDS.texture.label}
            low={WORDS.texture.low}
            high={WORDS.texture.high}
            onPick={update}
            start={startOf(DETAIL_AXES[0])}
            onCommit={commit}
            help={WORDS.help.texture}
            helpLabel={WORDS.help.about(WORDS.texture.label)}
            helpOpen={acikYardim === DETAIL_AXES[0]}
            onToggleHelp={yardimDegistir}
            onCloseHelp={yardimKapat}
          />
          <Axis
            axis={DETAIL_AXES[1]}
            label={WORDS.proximity.label}
            low={WORDS.proximity.low}
            high={WORDS.proximity.high}
            onPick={update}
            start={startOf(DETAIL_AXES[1])}
            onCommit={commit}
            help={WORDS.help.proximity}
            helpLabel={WORDS.help.about(WORDS.proximity.label)}
            helpOpen={acikYardim === DETAIL_AXES[1]}
            onToggleHelp={yardimDegistir}
            onCloseHelp={yardimKapat}
          />
        </>
      ) : null}

      {/*
        Üç nokta hep duruyor: aynı düğme üç durum arasında dönüyor
        (ikisi → dördü → hiçbiri → ikisi).

        `'hicbiri'`ne geçerken tarif tamamen DÜŞÜYOR (`ilerlet`). Düşmeseydi
        ekranda hiç kaydıraç yokken cevap hâlâ daralmış olurdu ve kullanıcı
        neden o sonucu aldığını göremezdi.
      */}
      {/*
        Hiza sihirli sayıdan değil, kaydıraçlarla AYNI iskeletten geliyor: boş
        bir etiket sütunu, sonra düğmeler. Böylece üç nokta rayların tam
        başladığı yerde duruyor ve `EDGE_CLASS` değişince kendiliğinden takip
        ediyor.

        Önce `ml-[…rem]` ile hizalanmıştı ve iki kez ısırdı: hem etiket
        genişliğiyle elle eşlenmesi gereken ikinci bir sayıydı, hem de Tailwind
        yeni bir keyfi değer için sınıfı üretmeyince hiza sessizce kayıyordu.
      */}
      <div className="flex items-center gap-2">
        <span className={EDGE_CLASS} aria-hidden="true" />
        <button
          type="button"
          onClick={ilerlet}
          aria-label={ACILIM_ADI[acilim]}
          className="w-fit rounded-full px-2 py-1 text-[13px] leading-none tracking-[0.3em] text-white/50 transition-colors hover:text-white/60 focus-visible:text-white/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/30"
        >
          …
        </button>

        {/*
          Sıfırla — sahibin isteği: "biri sıfırlamak isterse sıfırlayabilsin".

          Kaydıraç sürüklendikten sonra ortaya geri götürecek bir yol yoktu;
          topuğu gözle ortaya oturtmak da işe yaramıyor, çünkü dokunulmuş bir
          eksen ortada dursa bile "ortayı soruyorum" demek oluyor (`update`in
          yorumu). Sıfırlamanın anlamı ortaya getirmek değil, SORUYU GERİ ALMAK.

          Düğme `'hicbiri'`de çizilmiyor: orada zaten sorulmuş bir şey yok.
        */}
        {acilim !== 'hicbiri' ? (
          <button
            type="button"
            onClick={temizle}
            aria-label={WORDS.resetLabel}
            className="w-fit rounded-full px-2 py-1 text-[9px] leading-none tracking-[0.18em] text-white/35 transition-colors hover:text-white/70 focus-visible:text-white/70 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/30"
          >
            {WORDS.reset}
          </button>
        ) : null}
      </div>
    </div>
  );
}
