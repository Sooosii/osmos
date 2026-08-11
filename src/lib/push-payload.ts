import type { Perfume } from '@/data/types';
import { getDict } from '@/i18n/dict';
import { withLocale, type Locale } from '@/i18n/locale';

/**
 * Bildirimin gövdesi — sözlükten kurulur, tek yerden.
 *
 * Hem gönderici (`scripts/push-send.ts`, GitHub Action'da koşar) hem sınamalar
 * aynı kurucuyu çağırıyor: Action'ın yolladığı metinle sınanan metin ayrışamaz.
 * Abonenin dili kayıtta duruyor; bildirim o dilde gider ve bağlantısı o dilin
 * sayfasına açılır.
 */
export interface PushMessage {
  readonly title: string;
  readonly body: string;
  /** Göreli yol — service worker aynı kökte açar, taban adres gerekmez. */
  readonly url: string;
}

export function pushMessage(
  perfume: Pick<Perfume, 'id' | 'name' | 'brand'>,
  locale: Locale,
): PushMessage {
  const t = getDict(locale);
  return {
    title: t.notify.pushTitle,
    body: t.notify.pushBody(perfume.name, perfume.brand),
    url: withLocale(locale, `/perfume/${perfume.id}`),
  };
}
