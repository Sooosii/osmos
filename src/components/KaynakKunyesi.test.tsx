// @vitest-environment jsdom

import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { expect, test, vi } from 'vitest';

/**
 * Kaynak künyesinin iki hâli.
 *
 * ⚠️ Kiracı kimliği modül yüklenirken çözülüyor (`lib/tenant.ts`), yani hangi
 * derlemede olduğumuzu sınama içinde değiştiremiyoruz — bu yüzden kapı
 * mock'lanıyor. Sözlük de aynı modülü okuyor (`dict.ts` yüklenirken
 * `activeTenant()` çağırıyor), dolayısıyla mock markalamayı da gerçekten
 * çalıştırıyor: aşağıdaki ikinci durum `brandStrings` geçişinin ARDINDAN
 * ölçülmüş oluyor.
 */

const KIRACI = {
  id: 'demo-kiraci',
  name: 'SELVA',
  title: { en: 'SELVA', tr: 'SELVA' },
  description: { en: 'x', tr: 'x' },
  features: { accounts: false, notify: false, feed: false },
  indexable: false,
} as const;

let osmosMu = true;

vi.mock('@/lib/tenant', () => ({
  isOsmos: () => osmosMu,
  activeTenant: () => (osmosMu ? { ...KIRACI, id: 'osmos', name: 'OSMOS' } : KIRACI),
  resolveTenant: () => KIRACI,
  dilleriSuz: () => ['en', 'tr'],
  aktifDiller: () => ['en', 'tr'],
}));

/*
  ⚠️ `resetModules` olmadan bu sınama YALAN söylüyordu ve ölçülerek görüldü:
  `dict.ts` sözlüğü modül yüklenirken bir kez markalıyor, yani ilk durumun
  (OSMOS) sözlüğü ikinci durumda da kullanılıyordu. "SELVA yok" iddiası
  markalama hiç çalışmadığı için geçiyordu. Şimdi her çizimde modül grafiği
  yeniden kuruluyor ve sözlük gerçekten kiracı için markalanıyor.
*/
async function ciz(): Promise<HTMLDivElement> {
  vi.resetModules();
  const { KaynakKunyesi } = await import('./KaynakKunyesi');
  (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean })
    .IS_REACT_ACT_ENVIRONMENT = true;

  const kap = document.createElement('div');
  document.body.append(kap);
  const kok = createRoot(kap);
  await act(async () => {
    kok.render(<KaynakKunyesi lang="en" />);
  });
  return kap;
}

test('OSMOS derlemesinde hic cizilmiyor', async () => {
  osmosMu = true;
  const kap = await ciz();
  expect(kap.textContent).toBe('');
});

test('kiracida ciziliyor ve markayi BAGLANTI soyluyor', async () => {
  osmosMu = false;
  const kap = await ciz();

  const bag = kap.querySelector('a');
  expect(bag?.getAttribute('href')).toBe('https://osmos.me');
  expect(bag?.textContent).toBe('osmos.me');

  /*
    ⚠️ Asıl iddia bu: cümle kiracının adına DÖNÜŞMEDİ. Sözlüğe "OSMOS"
    yazılsaydı burada "SELVA" görürdük ve satır kendi kendini yalanlardı —
    müşterinin sitesi kendi kendisi tarafından kurulduğunu söylerdi.
  */
  expect(kap.textContent).not.toContain('SELVA');
  expect(kap.textContent).toContain('osmos.me');
});
