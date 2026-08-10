import type { CSSProperties, ReactNode } from 'react';
import { LangSwitch } from './LangSwitch';

/**
 * Ekran çerçevesi — sayfanın etrafına geçen ince HUD.
 *
 * Kaynağı sahibin getirdiği "Vitruvian hero" bileşeni; ondan **yalnızca çerçeve**
 * alındı. Alınmayanlar ve nedenleri:
 *
 *   · UnicornStudio embed'i  — animasyonun tamamı başkasına ait bir sahne
 *     kimliğinden (`whwOGlfJ5Rz2rHaEUgHl`) geliyordu ve çalışma anında
 *     jsDelivr'dan script çekiyordu. OSMOS tamamen statik üretiliyor ve dışarıya
 *     hiçbir istek atmıyor; bunu bozacak tek şey oydu.
 *   · `hideBranding()`      — her 100 ms'de DOM'u tarayıp "made with"/"unicorn"
 *     geçen elemanları siliyordu. Rozet kaldırma ücretli planların işi; yazılmadı.
 *   · İngilizce pazarlama metni, UIMIX logosu, San Francisco koordinatları,
 *     GET STARTED/LEARN MORE — başka bir ürünün sayfasıydı.
 *
 * Geriye kalan ve gerçekten değerli olan şey biçimdi: köşe braketleri, saç teli
 * kenar çizgileri, dar aralıklı mono mikro-tipografi.
 *
 * ⚠️ **Sayaçlar süs değil.** `readouts`, `status` ve `tail` çağıran sayfanın
 * GERÇEK verisini yazıyor — nota sayfasında bant, tepe dakikası, taşıyıcı sayısı.
 * Kaynak bileşendeki `LAT: 37.7749°` ve `FRAME: ∞` uydurmaydı; burada uydurma bir
 * sayı yok ve olmamalı. Yerini dolduracak gerçek veri yoksa alan boş bırakılır.
 *
 * Sunucu bileşeni: durum yok, etki yok, `<style jsx>` yok. Kaynakta styled-jsx
 * vardı; App Router'da SSR için `StyleRegistry` sarmalayıcısı gerektiriyor
 * (`next/dist/docs/01-app/02-guides/css-in-js.md`). Tram deseni tek bir satır
 * içi `background-image` ile çizilince o bağımlılık tamamen ortadan kalktı ve
 * istemci paketine hiçbir şey inmiyor.
 */

/** Üst şeritteki tek bir ölçüm. */
export interface FrameReadout {
  readonly label: string;
  readonly value: string;
}

interface ScreenFrameProps {
  readonly children: ReactNode;
  /** Sol üst — sayfanın kendi yolları. Çerçevenin içindeki tek tıklanır alan. */
  readonly nav: ReactNode;
  /** Sağ üst — sayfanın gerçek ölçümleri. Dar ekranda sonuncusu gizleniyor. */
  readonly readouts: readonly FrameReadout[];
  /** Sol alt. */
  readonly status: string;
  /** Sağ alt. */
  readonly tail: string;
}

/**
 * Tram dokusu — yörünge tuvaliyle aynı dünya.
 *
 * İki dik yönde 2 piksellik yineleme, 3 piksellik hücreye oturtuluyor: örtüşme
 * düzensiz bir noktalama üretiyor ve düz bir çizgiden farklı okunuyor. Değerler
 * kaynak bileşenden geliyor, tek değişiklik rengin `currentColor`a bağlanması.
 */
const DITHER: CSSProperties = {
  backgroundImage:
    'repeating-linear-gradient(0deg, transparent 0 1px, currentColor 1px 2px),' +
    'repeating-linear-gradient(90deg, transparent 0 1px, currentColor 1px 2px)',
  backgroundSize: '3px 3px',
};

/** Köşe braketi — dört köşede aynı parça, dönerek. */
function Corner({ className }: { readonly className: string }) {
  return <div aria-hidden="true" className={`fixed z-30 size-8 lg:size-12 ${className}`} />;
}

export function ScreenFrame({ children, nav, readouts, status, tail }: ScreenFrameProps) {
  return (
    <>
      <Corner className="left-0 top-0 border-l-2 border-t-2 border-white/25" />
      <Corner className="right-0 top-0 border-r-2 border-t-2 border-white/25" />
      <Corner className="bottom-0 left-0 border-b-2 border-l-2 border-white/25" />
      <Corner className="bottom-0 right-0 border-b-2 border-r-2 border-white/25" />

      {/* Üst şerit */}
      <div className="fixed inset-x-0 top-0 z-30 border-b border-white/15 bg-[#050507]/70 backdrop-blur-sm">
        <div
          aria-hidden="true"
          className="h-[3px] w-full text-white/40 opacity-30"
          style={DITHER}
        />
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-2.5 sm:px-10">
          {nav}

          <div className="flex items-center gap-3 sm:gap-5">
            <dl className="flex items-center gap-3 text-[9px] tracking-[0.18em] text-white/35 sm:gap-5">
              {readouts.map((readout, index) => (
                <div
                  key={readout.label}
                  // Dar ekranda ikiden fazlası sığmıyor; kalanlar sırayla düşüyor.
                  className={`flex items-baseline gap-1.5 ${index >= 2 ? 'hidden sm:flex' : ''}`}
                >
                  <dt className="text-white/25">{readout.label}</dt>
                  <dd className="tabular-nums text-white/55">{readout.value}</dd>
                </div>
              ))}
            </dl>

            {/*
              Dil değiştirici ölçümlerin sağında. `ScreenFrame` sunucu bileşeni
              ve öyle kalıyor: `LangSwitch` kendi `'use client'` sınırını
              taşıyor, sarmalayanı istemciye düşürmüyor.
            */}
            <LangSwitch />
          </div>
        </div>
      </div>

      {/*
        İçerik. Üstteki ve alttaki şeritler `fixed` — akışta yer kaplamıyorlar,
        boşluğu burası veriyor. Braketler köşelerde 32/48 piksel; yan boşluk
        sayfanın kendi `px`inden geliyor ve ikisi çakışmıyor.
      */}
      <div className="relative z-10 pb-24 pt-16">{children}</div>

      {/* Alt şerit */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/15 bg-[#050507]/70 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-2 text-[9px] tracking-[0.18em] text-white/35 sm:px-10">
          <span className="tabular-nums">{status}</span>

          <div className="flex items-center gap-3">
            {/*
              Üç nokta dönen yörüngenin nefesi. `motion-reduce` altında
              duruyorlar — hareketi kapatmış birine sürekli yanıp sönen bir
              gösterge göndermek sözü tutmamak olur.
            */}
            <div aria-hidden="true" className="flex gap-1">
              <span className="size-1 animate-pulse rounded-full bg-white/60 motion-reduce:animate-none" />
              <span
                className="size-1 animate-pulse rounded-full bg-white/40 motion-reduce:animate-none"
                style={{ animationDelay: '0.2s' }}
              />
              <span
                className="size-1 animate-pulse rounded-full bg-white/20 motion-reduce:animate-none"
                style={{ animationDelay: '0.4s' }}
              />
            </div>
            <span className="tabular-nums">{tail}</span>
          </div>
        </div>
      </div>
    </>
  );
}
