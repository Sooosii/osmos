import { afterEach, describe, expect, test, vi } from 'vitest';
import { NOTES } from '@/data/notes';
import { PERFUMES } from '@/data/perfumes';
import { sitemapEntries } from './site-map';

afterEach(() => {
  vi.unstubAllEnvs();
});

/** Diller dışındaki sabit sayfalar: `/` ve `/notes`. */
const SABIT_SAYFA = 2;

describe('sitemapEntries', () => {
  test('her sayfa iki dilde bir kez listeleniyor', () => {
    const beklenen = (SABIT_SAYFA + NOTES.length + PERFUMES.length) * 2;
    expect(sitemapEntries()).toHaveLength(beklenen);
  });

  test('dogrulama ekranlari sitemapte yok', () => {
    /*
      İç araçlar vitrine girmiyor: başlıkları "draft" diyor ve aramadan gelen
      ziyaretçi kendini taslak ilan eden bir sayfaya düşerdi. Ekranların
      kendisi duruyor, yalnızca daveti kalktı — `noindex` de sayfalarında.
    */
    const urls = sitemapEntries().map((entry) => entry.url);
    for (const path of ['/space', '/evolution']) {
      expect(urls.some((url) => url.endsWith(path)), path).toBe(false);
    }
  });

  test('her girdide iki dilin de alternatifi var', () => {
    for (const entry of sitemapEntries()) {
      expect(entry.alternates?.languages).toBeDefined();
      expect(Object.keys(entry.alternates!.languages!).sort()).toEqual(['en', 'tr']);
    }
  });

  test('adres cevre degiskenini dinliyor', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://osmos.example');
    for (const entry of sitemapEntries()) {
      expect(entry.url.startsWith('https://osmos.example')).toBe(true);
    }
  });

  test('Turkce adresler /tr onekli, Ingilizce oneksiz', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://osmos.example');
    const urls = sitemapEntries().map((e) => e.url);
    expect(urls).toContain('https://osmos.example/notes');
    expect(urls).toContain('https://osmos.example/tr/notes');
    expect(urls).toContain('https://osmos.example/');
    expect(urls).toContain('https://osmos.example/tr');
  });

  test('ayni adres iki kez girmiyor', () => {
    const urls = sitemapEntries().map((e) => e.url);
    expect(new Set(urls).size).toBe(urls.length);
  });
});
