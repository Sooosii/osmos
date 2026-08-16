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

/** Karşılaştırma için parfüm adını sadeleştirir. */
export function urunAnahtari(ham: string): string {
  return ham.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export interface KatalogParfumu {
  readonly id: string;
  readonly ad: string;
  readonly marka: string;
}

/** Kataloğumuzun kimlik + ad + marka listesi — eşleştirmenin girdisi. */
export function osmosParfumleri(katalogDizini: string): readonly KatalogParfumu[] {
  const hepsi: KatalogParfumu[] = [];
  for (const dosya of readdirSync(katalogDizini).filter((d) => d.endsWith('.ts') && !d.endsWith('.test.ts'))) {
    const metin = readFileSync(join(katalogDizini, dosya), 'utf8');
    for (const kayit of metin.split(/\n {4}id: /).slice(1)) {
      const id = /^.([^']+)./.exec(kayit)?.[1];
      const ad = /name: .([^']+)./.exec(kayit)?.[1];
      const marka = /brand: .([^']+)./.exec(kayit)?.[1];
      if (id !== undefined && ad !== undefined && marka !== undefined) hepsi.push({ id, ad, marka });
    }
  }
  return hepsi;
}

export interface UrunOrtusmesi {
  /** Dükkânın raflarında GERÇEKTEN bulunan, bizde de olan parfüm sayısı. */
  readonly sayi: number;
  /** Eşleşen parfümlerin kimlikleri — demo seçkisinin kendisi. */
  readonly kimlikler: readonly string[];
}

/**
 * ÜRÜN düzeyinde örtüşme — demo seçkisini kuran gerçek ölçüm.
 *
 * ⚠️ Marka örtüşmesi bunun yerine geçmiyor ve bu ÖLÇÜLDÜ. Yirmi dükkânda
 * bakıldı: marka örtüşmesi 25 olan dükkânda ürün örtüşmesi 4 çıktı, 24 olanda
 * 3, 14 olanda 2. Ortalama yalnızca **3 parfüm.**
 *
 * Sebep katalogun biçiminde: bizde marka başına 1-2 KÜRATÖRLÜ parfüm var,
 * dükkânlar ise o markanın POPÜLER parfümlerini satıyor. İkisinin kesişmesi
 * için özel bir sebep yok.
 *
 * Sonuç, satış planının bir varsayımını düşürdü: "hedef bizim markaları
 * satıyorsa demo bedava kurulur" doğru değil. Demo, müşterinin parfümlerinin
 * girilmesini gerektiriyor — yani teslim emeğinin bir kısmı peşin ödeniyor.
 * Marka örtüşmesi yine de işe yarıyor ama başka bir işe: sıfırsa ürün
 * örtüşmesi de kesin sıfırdır, yani ucuz bir ön eleme.
 */
export function urunOrtusmesiHesapla(
  dukkanBasliklari: readonly string[],
  bizimkiler: readonly KatalogParfumu[],
): UrunOrtusmesi {
  const sadeBasliklar = dukkanBasliklari.map(urunAnahtari);
  const kimlikler = bizimkiler
    .filter((b) => {
      const ad = urunAnahtari(b.ad);
      /* Üç harften kısa adlar her başlıkta geçer; yanlış eşleşme üretirler. */
      if (ad.length < 5) return false;
      /*
        ⚠️ MARKA DA TUTMAK ZORUNDA. İlk sürüm yalnız parfüm ADINA bakıyordu
        ve gerçek bir yanlış eşleşme üretti: bizim `profumum-roma-neroli`
        kaydımız dükkânın Matière Première **"Neroli Oranger"**ıyla eşleşti —
        aynı kelime, bambaşka parfüm, üstelik başka ev. Aynı şekilde
        `naomi-goodsir-bois-dascese` de yanlış sayıldı.

        Bunun bedeli sayı hatası değil: o iki parfüm demo seçkisine girdi ve
        "sizin kataloğunuzdan kurdum" diyen bir demo, dükkânın satmadığı
        parfümleri içerir hâle geldi. İlk cevapta yakalanırdı.
      */
      const marka = markaAnahtari(b.marka);
      if (marka === '') return false;
      return sadeBasliklar.some((t) => t.includes(ad) && t.includes(marka));
    })
    .map((b) => b.id);
  return { sayi: kimlikler.length, kimlikler };
}
