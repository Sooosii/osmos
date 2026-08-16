/**
 * CSV yazıcı — RFC 4180.
 *
 * ⚠️ Başa BOM konuyor. Sebep pratik: sahip bu dosyaları Excel'de açacak ve
 * Excel BOM'suz UTF-8'i Windows'ta ANSI sanıp "parfüm"ü "parfüm" yapıyor.
 * Açılış cümlelerinin okunaksız çıkması bütün çıktıyı kullanılmaz kılardı.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

const BOM = '﻿';

/** Tırnak, virgül, satır sonu ve baştaki `=`/`+` (formül enjeksiyonu) kaçışlanır. */
export function hucre(deger: string | number | null): string {
  if (deger === null) return '';
  const s = String(deger);
  const tehlikeli = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return /[",\n\r]/.test(tehlikeli) ? `"${tehlikeli.replace(/"/g, '""')}"` : tehlikeli;
}

export function csvMetni(basliklar: readonly string[], satirlar: readonly (readonly (string | number | null)[])[]): string {
  return BOM + [basliklar, ...satirlar].map((s) => s.map(hucre).join(',')).join('\r\n') + '\r\n';
}

export function csvYaz(yol: string, basliklar: readonly string[], satirlar: readonly (readonly (string | number | null)[])[]): void {
  mkdirSync(dirname(yol), { recursive: true });
  writeFileSync(yol, csvMetni(basliklar, satirlar), 'utf8');
}
