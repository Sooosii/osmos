import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, resolve, relative } from 'node:path';

/**
 * Kiracı sızıntısının kapısı.
 *
 * ⚠️ **Ölçülmüş bir olaydan doğdu (2026-08-17, Nischengold yayına verilmeden
 * önceki denetim).** Kiracı derlemesinde
 * `/_next/static/chunks/000-601x7smjq.js` HTTP 200 dönüyordu, 100 KB'tı ve
 * içinde OSMOS katalogunun **154 kaydının 154'ü** vardı — marka, yıl,
 * parfümör ve elle yazılmış **küratör cümleleri, hem İngilizcesi hem
 * Türkçesi**. Yanında öbür kiracının (SELVA) 18 kimliği. Yani müşterinin
 * alan adından, tek istekle, herkese açık.
 *
 * Sayfalar 404 dönüyordu; sızan şey sayfa değil **paketti**. Sebep tek bir
 * satırdı: `EvolutionTimeline.tsx` bir `'use client'` bileşeni ve
 * `@/data/perfumes`ten `PERFUMES` çekiyordu. O modül hem OSMOS katalogunu hem
 * `TENANT_CATALOGS`u statik olarak içeriyor (`perfumes.ts`teki ternary'nin
 * iki dalı da paketleniyor), dolayısıyla katalogun tamamı istemci grafiğine
 * giriyordu.
 *
 * ⚠️ **Sınama DOLAYLI yolu da yürüyor.** Doğrudan ithali yasaklamak yetmez:
 * araya tek bir yardımcı modül girse kapı sessizce açılırdı. Bu yüzden her
 * `'use client'` dosyasından başlayıp yerel ithalleri izliyor ve zincirin
 * herhangi bir yerinde katalog modülü görürse düşüyor.
 *
 * ⚠️ **Tip ithalleri sayılmıyor** (`import type`): tip derlemede siliniyor,
 * pakete bir bayt bile girmiyor. `EvolutionTimeline` bugün `Perfume` tipini
 * tam da bu yüzden alabiliyor.
 *
 * Kural: **katalog istemciye prop olarak geçer, ithal edilmez.** Böylece her
 * site yalnız kendi katalogunu taşır.
 */

const SRC = resolve(__dirname, '..');

/** Bütün katalogları içeren modüller — istemci grafiğinde hiçbiri olmayacak. */
const KATALOG_MODULLERI = [
  'data/perfumes.ts',
  'data/osmos-catalog.ts',
  'data/tenants/catalogs.ts',
];

function kaynakDosyalari(dizin: string): string[] {
  const cikti: string[] = [];
  for (const ad of readdirSync(dizin)) {
    const yol = join(dizin, ad);
    if (statSync(yol).isDirectory()) {
      cikti.push(...kaynakDosyalari(yol));
      continue;
    }
    if (/\.tsx?$/.test(ad) && !/\.test\.tsx?$/.test(ad)) cikti.push(yol);
  }
  return cikti;
}

/**
 * Bir dosyanın DEĞER ithalleri (tip ithalleri hariç), mutlak yol olarak.
 *
 * `@/x` ve göreli `./x` biçimlerinin ikisi de çözülüyor; paket ithalleri
 * (`react`, `next/...`) atlanıyor — bu sınamanın işi depo içi zincir.
 */
function degerIthalleri(dosya: string): string[] {
  const kaynak = readFileSync(dosya, 'utf8');
  const yollar: string[] = [];
  const desen = /^import\s+(?!type\b)([^;]*?)\s*from\s*['"]([^'"]+)['"]/gm;

  for (const eslesme of kaynak.matchAll(desen)) {
    const [, baglama, hedef] = eslesme;
    // `import { type A, type B } from` — hepsi tipse pakete girmiyor.
    const adlar = baglama.match(/\{([^}]*)\}/)?.[1];
    if (adlar && adlar.split(',').every((ad) => ad.trim().startsWith('type '))) continue;

    if (hedef.startsWith('@/')) yollar.push(resolve(SRC, hedef.slice(2)));
    else if (hedef.startsWith('.')) yollar.push(resolve(dirname(dosya), hedef));
  }
  return yollar;
}

/** Uzantısız çözülmüş yolu gerçek dosyaya bağlar. */
function dosyayaCoz(yol: string): string | null {
  for (const uzanti of ['.ts', '.tsx', '/index.ts', '/index.tsx']) {
    const aday = `${yol}${uzanti}`;
    try {
      if (statSync(aday).isFile()) return aday;
    } catch {
      /* yok, sıradakine bak */
    }
  }
  return null;
}

/**
 * Zincir bu modülde kesilir mi?
 *
 * ⚠️ İki durum istemci paketine **girmiyor** ve ikisi de bu sınamada yanlış
 * alarm üretmişti:
 * - `'use server'` — sunucu eylemi. İstemci onu ithal etse bile pakete giden
 *   şey modülün kendisi değil, bir çağrı referansı.
 * - `import 'server-only'` — modül istemciye girerse derleme zaten patlıyor,
 *   yani oraya varan bir yol tanım gereği yok.
 */
function sunucudaKaliyor(dosya: string): boolean {
  const kaynak = readFileSync(dosya, 'utf8');
  return /^['"]use server['"]/.test(kaynak.trimStart()) || /import\s+['"]server-only['"]/.test(kaynak);
}

/** `dosya`dan başlayıp katalog modülüne giden ilk zinciri döndürür. */
function katalogaGidenZincir(dosya: string): string[] | null {
  const gorulen = new Set<string>();
  const kuyruk: { yol: string; iz: string[] }[] = [{ yol: dosya, iz: [dosya] }];

  while (kuyruk.length > 0) {
    const { yol, iz } = kuyruk.shift()!;
    if (gorulen.has(yol)) continue;
    gorulen.add(yol);

    const goreli = relative(SRC, yol).replaceAll('\\', '/');
    if (KATALOG_MODULLERI.includes(goreli)) return iz;

    // Başlangıç dosyası istemci bileşeni; ondan sonrası sunucuda kalıyorsa dur.
    if (iz.length > 1 && sunucudaKaliyor(yol)) continue;

    for (const ham of degerIthalleri(yol)) {
      const cozulen = dosyayaCoz(ham);
      if (cozulen && !gorulen.has(cozulen)) kuyruk.push({ yol: cozulen, iz: [...iz, cozulen] });
    }
  }
  return null;
}

describe('kiracı sızıntısı', () => {
  const istemciDosyalari = kaynakDosyalari(SRC).filter((dosya) =>
    /^['"]use client['"]/.test(readFileSync(dosya, 'utf8').trimStart()),
  );

  it("'use client' dosyaları taranabiliyor", () => {
    // Tarama boşa düşerse sınama sessizce hep yeşil kalırdı.
    expect(istemciDosyalari.length).toBeGreaterThan(5);
  });

  it('hiçbir istemci bileşeni katalog modülüne ulaşmıyor', () => {
    const suclular = istemciDosyalari
      .map((dosya) => ({ dosya, zincir: katalogaGidenZincir(dosya) }))
      .filter((kayit) => kayit.zincir !== null)
      .map(({ zincir }) => zincir!.map((yol) => relative(SRC, yol).replaceAll('\\', '/')).join('\n    → '));

    expect(
      suclular,
      `Katalog istemci paketine giriyor. Zincir(ler):\n\n    ${suclular.join('\n\n    ')}\n\n` +
        'Katalogu prop olarak geçir; istemci bileşeni onu ithal etmemeli.',
    ).toEqual([]);
  });
});
