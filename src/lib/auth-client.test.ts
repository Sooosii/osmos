import { expect, test, vi } from 'vitest';

/**
 * Oturum sorgusunun kiracı kapısı.
 *
 * ⚠️ **Ölçülmüş bir olaydan doğdu (2026-08-18).** `/api/auth` kiracıda 404'e
 * alındığı anda müşterinin sitesinde her sayfa yüklemesi konsola kırmızı bir
 * satır düşürmeye başladı: `GET /api/auth/get-session 404`. Dört bileşen
 * (`SignInLink`, `AddToTopFour`, `ShelfPicker`, `use-shelf-rings`) hiçbir şey
 * çizmedikleri hâlde kancayı çağırıyor — kanca koşullu çağrılamaz.
 *
 * Kural: **hesabı olmayan site oturum sormaz.** Kapı kaldırılırsa 404
 * gürültüsü geri gelir ve bir daha kimse fark etmez; asıl arıza da o gürültünün
 * içinde kaybolur (`/api/shelf`teki "girişsizde 401 değil" kararının aynı
 * gerekçesi).
 */

const KIRACI = {
  id: 'demo-kiraci',
  name: 'SELVA',
  title: { en: 'SELVA', tr: 'SELVA' },
  description: { en: 'x', tr: 'x' },
  features: { accounts: false, notify: false, feed: false },
  indexable: false,
};

let hesaplar = true;

vi.mock('./tenant', () => ({
  isOsmos: () => hesaplar,
  activeTenant: () => ({ ...KIRACI, features: { ...KIRACI.features, accounts: hesaplar } }),
}));

async function yukle() {
  vi.resetModules();
  return import('./auth-client');
}

test('hesaplar acikken gercek kanca disa vuruluyor', async () => {
  hesaplar = true;
  const mod = await yukle();
  expect(mod.useSession).toBe(mod.authClient.useSession);
});

test('hesaplar kapaliyken oturum SORULMUYOR', async () => {
  hesaplar = false;
  const mod = await yukle();

  expect(mod.useSession).not.toBe(mod.authClient.useSession);

  /*
    Boş oturum, `isPending: false` demek zorunda: tüketiciler beklerken hiçbir
    şey çizmiyor (`if (isPending) return null`). `true` kalsaydı kiracıda dört
    bileşen de sonsuza kadar askıda kalırdı — ekranda aynı görünen, sebebi
    bambaşka bir hata.
  */
  const oturum = (mod.useSession as unknown as () => { data: unknown; isPending: boolean })();
  expect(oturum.data).toBeNull();
  expect(oturum.isPending).toBe(false);
});
