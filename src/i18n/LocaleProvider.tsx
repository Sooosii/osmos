'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { DEFAULT_LOCALE, type Locale } from './locale';
import { getDict } from './dict';
import type { Dict } from './en';

/**
 * Sayfanın dili — istemci ağacına inen tek şey.
 *
 * ⚠️ **Bağlam sözlüğü değil dil KODUNU taşıyor.** Sözlükte işlev var
 * (`intro(count)`, `position(i, n)`, `carriersHeading(n)` …) ve React
 * sunucudan istemciye işlev serileştiremiyor: *"Functions cannot be passed
 * directly to Client Components"* diye çalışma anında patlardı. Bağlamdan düz
 * bir dize geçiyor, sözlük istemcide çözülüyor.
 *
 * Bu, Faz 1'in "dilbilgisi sözlüğün içinde kalsın" kararının bedeli ve karar
 * yine de doğru: Türkçe ile İngilizcenin sözcük sırası aynı değil, yüzde
 * işareti bile taraf değiştiriyor (%85 ↔ 85%).
 */
const LocaleContext = createContext<Locale>(DEFAULT_LOCALE);

interface LocaleProviderProps {
  readonly locale: Locale;
  readonly children: ReactNode;
}

export function LocaleProvider({ locale, children }: LocaleProviderProps) {
  return <LocaleContext value={locale}>{children}</LocaleContext>;
}

export function useLocale(): Locale {
  return useContext(LocaleContext);
}

/** İstemci bileşenlerinin sözlüğü. Sunucuda `dictFor(lang)` kullanılıyor. */
export function useDict(): Dict {
  return getDict(useContext(LocaleContext));
}
