/**
 * Marka örtüşmesi — demonun kaça mal olacağını söyleyen ölçüm.
 *
 * ⚠️ Bu modül satışın ekonomisini belirliyor. Kiracı katalogu, OSMOS'un
 * mevcut parfümlerinden bir **seçki listesi** (`demo-selva/catalog.ts` bunu
 * kanıtlıyor: 18 kimlik). Yani:
 *
 *   hedef bizim markalarımızı satıyorsa  → demo dakikalar içinde kurulur
 *   satmıyorsa                            → her parfüm elle girilecek
 *
 * İkincisi teslimin kendisi ve satılan emek o. Ama DEMO ucuz olmalı, çünkü
 * demo kurulmadan satış konuşması başlamıyor.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const MARKA = /brand: '([^']+)'/g;

/**
 * Karşılaştırma için markayı sadeleştirir.
 *
 * ⚠️ Düz eşitlik yetmiyor: aynı ev "Orto Parisi", "ORTO PARISI" ve
 * "Orto-Parisi" diye yazılıyor; "Parfums Dusita" ile "Dusita" aynı ev.
 * Küçük harfe indirip harf-dışını atmak bu üçünü de birleştiriyor.
 */
export function markaAnahtari(ham: string): string {
  return ham
    .toLowerCase()
    .replace(/\b(parfums?|perfumes?|fragrances?|maison|atelier|the)\b/g, '')
    .replace(/[^\p{L}\p{N}]/gu, '');
}

/** Kataloğumuzdaki markalar — her koşuda dosyalardan sayılıyor. */
export function osmosMarkalari(katalogDizini: string): ReadonlySet<string> {
  const kume = new Set<string>();
  for (const dosya of readdirSync(katalogDizini).filter((d) => d.endsWith('.ts') && !d.endsWith('.test.ts'))) {
    const metin = readFileSync(join(katalogDizini, dosya), 'utf8');
    for (const m of metin.matchAll(MARKA)) {
      const ad = m[1];
      if (ad === undefined) continue;
      const anahtar = markaAnahtari(ad);
      if (anahtar !== '') kume.add(anahtar);
    }
  }
  return kume;
}

export interface Ortusme {
  /** Kaç marka ortak. */
  readonly sayi: number;
  /** Ortak markaların okunabilir adları — demo seçkisinin iskeleti. */
  readonly ortak: readonly string[];
  /** Hedefin toplam kaç markası var. */
  readonly hedefMarkaSayisi: number;
}

/**
 * Hedefin marka listesiyle bizimkini karşılaştırır.
 *
 * ⚠️ Boş liste `sayi: 0` döndürüyor ama bu "ölçüldü, yok" demek — çağıran
 * taraf hiç ölçemediyse `null` yazmalı. Puanlama bu ayrımı gözetiyor.
 */
export function ortusmeHesapla(
  hedefMarkalari: readonly string[],
  bizimkiler: ReadonlySet<string>,
): Ortusme {
  const gorulen = new Map<string, string>();
  for (const ham of hedefMarkalari) {
    const anahtar = markaAnahtari(ham);
    if (anahtar !== '' && !gorulen.has(anahtar)) gorulen.set(anahtar, ham.trim());
  }
  const ortak = [...gorulen.entries()]
    .filter(([anahtar]) => bizimkiler.has(anahtar))
    .map(([, ad]) => ad)
    .sort();
  return { sayi: ortak.length, ortak, hedefMarkaSayisi: gorulen.size };
}
