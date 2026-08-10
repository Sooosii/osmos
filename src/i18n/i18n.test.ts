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

/**
 * Yorumları düşürür, satır numaralarını korur.
 *
 * Blok yorumları satırlar arasında takip ediyor. Bu şart: depo JSX yorumlarını
 * `{/*` ile açıp düz metinle sürdürüyor ve yalnızca `*` ile başlayan satırlara
 * bakan bir sayaç bu gövdeleri kaçak sanır — ilk ölçüm tam olarak böyle
 * şişmişti (299 satır dedi, gerçeği 68'di).
 */
function stripComments(lines: readonly string[]): string[] {
  const out: string[] = [];
  let inBlock = false;

  for (const line of lines) {
    const trimmed = line.trimStart();

    if (inBlock) {
      if (trimmed.includes('*/')) inBlock = false;
      out.push('');
      continue;
    }
    if (trimmed.startsWith('/*') || trimmed.startsWith('{/*')) {
      if (!trimmed.includes('*/')) inBlock = true;
      out.push('');
      continue;
    }
    if (trimmed.startsWith('*') || trimmed.startsWith('//')) {
      out.push('');
      continue;
    }

    out.push(line.split('//')[0]);
  }

  return out;
}

/**
 * Kaçak Türkçe avcısı.
 *
 * "Site tamamen İngilizce" bir iddia değil, ölçülen bir şey olsun diye.
 *
 * Muaf tutulanlar ve nedenleri:
 *   · `src/data/**`    — nota ve parfüm verisi iki dilli kalıyor
 *   · `src/i18n/tr.ts` — bekleyen Türkçe sözlüğün evi
 *   · `*.test.ts`      — sınamaların kendi başlıkları
 *   · `throw new Error(...)` satırları — geliştirici metni, ekran metni değil;
 *     gerekçesi kod yorumlarının Türkçe kalmasıyla aynı
 *
 * ⚠️ Yorumlar atlanıyor ama dizeler okunuyor: satır içi `//` taşıyan bir dize
 * (URL gibi) o satırın kalanını gizleyebilir. Bu yön güvenli — eksik yakalar,
 * yanlış yakalamaz.
 */
/**
 * CSS `uppercase` yasağı.
 *
 * Ölçüldü (Chromium, 2026-08-10): `lang="tr"` altında CSS `text-transform:
 * uppercase` küçük `i`yi noktalı `İ`ye çeviriyor. Sahibin kuralı ekranda
 * noktalı İ olmaması; JS `toUpperCase()` dilden bağımsız çalışıyor ve aynı
 * karar parfüm künyesinde zaten yazılı.
 *
 * Yasak "dile bağlı metinlerde kullanılmasın"dan geniş ve bilerek öyle: tek
 * kural iki kuraldan iyi, ve bu kural gözle denetlenebilir.
 */
test('sitede CSS uppercase kullanilmiyor', () => {
  const files = [
    ...sourceFiles('src', ['.ts', '.tsx', '.css']),
    ...sourceFiles('public', ['.js']),
  ];
  const offenders: string[] = [];

  for (const file of files) {
    const path = unix(file);
    if (path.endsWith('.test.ts')) continue;

    stripComments(readFileSync(file, 'utf8').split('\n')).forEach((line, index) => {
      if (/text-transform:\s*uppercase|(^|[\s"'`])uppercase([\s"'`]|$)/.test(line)) {
        offenders.push(`${path}:${index + 1}: ${line.trim()}`);
      }
    });
  }

  expect(offenders).toEqual([]);
});

test('ekrana cikabilecek Turkce dize kalmadi', () => {
  const files = [
    ...sourceFiles('src', ['.ts', '.tsx', '.css']),
    ...sourceFiles('public', ['.js']),
  ];
  const offenders: string[] = [];

  for (const file of files) {
    const path = unix(file);
    if (path.startsWith('src/data/') || path === 'src/i18n/tr.ts' || path.endsWith('.test.ts')) {
      continue;
    }

    stripComments(readFileSync(file, 'utf8').split('\n')).forEach((line, index) => {
      if (line.includes('throw new Error(')) return;
      if (/[çğıöşüÇĞİÖŞÜ]/.test(line)) offenders.push(`${path}:${index + 1}: ${line.trim()}`);
    });
  }

  expect(offenders).toEqual([]);
});
