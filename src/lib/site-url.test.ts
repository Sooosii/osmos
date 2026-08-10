import { afterEach, describe, expect, test, vi } from 'vitest';
import { absolute, siteUrl } from './site-url';

/**
 * Taban adres.
 *
 * ⚠️ Varsayılan bilerek `localhost`: uydurma bir alan adı yazmak, yayına
 * çıkıldığı gün kimsenin fark etmeyeceği yanlış bir sitemap üretirdi. Yanlış
 * adres sessizce çalışır; eksik adres çalışmaz ve fark edilir.
 */
afterEach(() => {
  vi.unstubAllEnvs();
});

describe('siteUrl', () => {
  test('cevre degiskeni yoksa localhost', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', '');
    expect(siteUrl()).toBe('http://localhost:3000');
  });

  test('cevre degiskeni dinleniyor', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://osmos.example');
    expect(siteUrl()).toBe('https://osmos.example');
  });

  test('sondaki egik cizgi atiliyor — cift egik cizgi uretmesin', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://osmos.example/');
    expect(siteUrl()).toBe('https://osmos.example');
  });
});

describe('absolute', () => {
  test('yolu tabana ekliyor', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://osmos.example');
    expect(absolute('/tr/notes')).toBe('https://osmos.example/tr/notes');
    expect(absolute('/')).toBe('https://osmos.example/');
  });
});
