import Link from 'next/link';
import type { SpaceMark } from '@/data/types';

/**
 * Uzayın klavye ve ekran okuyucu karşılığı.
 *
 * Tuval onların gözünde boş bir dikdörtgen; SVG sürümünde her noktanın kendi
 * odağı vardı, o yetenek kaybolmamalı. Tab ile geziliyor, odak parfümü seçip
 * kamerayı üstüne getiriyor.
 *
 * Görsel katmanlardan (`SpaceOverlays`) ayrı bir dosyada duruyor çünkü ayrı bir
 * izleyici kitlesine hizmet ediyor: biri değişirken diğerinin unutulmaması için.
 */

interface SpaceKeyboardListProps {
  readonly marks: readonly SpaceMark[];
  /** Odak ya da tıklama: parfümü seçip kamerayı üstüne getiriyor. */
  readonly onFocusMark: (mark: SpaceMark) => void;
}

export function SpaceKeyboardList({ marks, onFocusMark }: SpaceKeyboardListProps) {
  return (
    <ul className="sr-only" aria-label="Koku uzayı — parfüme git">
      {marks.map((mark) => (
        <li key={mark.id}>
          <button type="button" onFocus={() => onFocusMark(mark)} onClick={() => onFocusMark(mark)}>
            {mark.name}, {mark.brand}
          </button>
          {/*
            Tekerleği olmayanın yolu. Kaydırarak giriş fare ve dokunma için;
            klavyeyle gezen ya da ekran okuyucu kullanan biri için kaydırma
            diye bir şey yok. Gerçek bir bağlantı: yeni sekmede açılabiliyor,
            ekran okuyucu "bağlantı" diye duyuruyor, düğme taklidi değil.
          */}
          <Link href={`/parfum/${mark.id}`}>{mark.name} sayfası</Link>
        </li>
      ))}
    </ul>
  );
}
