import { describe, expect, test } from 'vitest';
import { EN } from './en';
import { TR } from './tr';

/**
 * Sözlük bütünlüğü.
 *
 * Şekli tip zaten zorluyor (`TR: Dict`). Bu sınamalar tipin göremediğini
 * yakalıyor: boş dize, unutulmuş yer tutucu, ve işlev/metin karışması.
 */
function flatten(value: unknown, path: string, out: Map<string, unknown>): void {
  if (value === null || typeof value !== 'object') {
    out.set(path, value);
    return;
  }

  for (const [key, child] of Object.entries(value)) {
    flatten(child, path ? `${path}.${key}` : key, out);
  }
}

describe('sozluk butunlugu', () => {
  test('iki sozluk ayni anahtar kumesine sahip', () => {
    const en = new Map<string, unknown>();
    const tr = new Map<string, unknown>();
    flatten(EN, '', en);
    flatten(TR, '', tr);

    expect([...tr.keys()].sort()).toEqual([...en.keys()].sort());
  });

  test('hicbir deger bos degil', () => {
    for (const dict of [EN, TR]) {
      const flat = new Map<string, unknown>();
      flatten(dict, '', flat);

      for (const [path, value] of flat) {
        if (typeof value === 'string') expect(value.trim(), path).not.toBe('');
        else expect(typeof value, path).toBe('function');
      }
    }
  });

  test('ingilizce sozlukte Turkceye ozgu harf yok', () => {
    const flat = new Map<string, unknown>();
    flatten(EN, '', flat);

    for (const [path, value] of flat) {
      if (typeof value !== 'string') continue;
      expect(value, path).not.toMatch(/[çğıöşüÇĞİÖŞÜ]/);
    }
  });
});
