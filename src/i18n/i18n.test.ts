import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
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

/** Bir ağaçtaki bütün kaynak dosyalar, verilen uzantılarla. */
function sourceFiles(dir: string, extensions: readonly string[]): string[] {
  const found: string[] = [];

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) found.push(...sourceFiles(path, extensions));
    else if (extensions.some((extension) => entry.name.endsWith(extension))) found.push(path);
  }

  return found;
}

/** Windows'ta `join` ters bölü üretiyor; karşılaştırmalar tek biçimde. */
function unix(path: string): string {
  return path.split('\\').join('/');
}

/**
 * Veri okumaları tek uçtan.
 *
 * `.tr` alan erişimi kalmışsa ekran karışık dil gösterir. Kaçak Türkçe avcısı
 * bunu göremez — `.tr` içinde Türkçeye özgü harf yok.
 *
 * Muaf: `src/data/**` (veri iki dilli kalıyor) ve `src/i18n/` (sözlüğün evi).
 */
test('ekranda .tr okumasi kalmadi', () => {
  const offenders: string[] = [];

  for (const file of sourceFiles('src', ['.ts', '.tsx'])) {
    const path = unix(file);
    if (path.startsWith('src/data/') || path.startsWith('src/i18n/')) continue;

    readFileSync(file, 'utf8')
      .split('\n')
      .forEach((line, index) => {
        if (/\.tr\b/.test(line)) offenders.push(`${path}:${index + 1}`);
      });
  }

  expect(offenders).toEqual([]);
});
