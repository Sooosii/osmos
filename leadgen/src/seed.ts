/**
 * Tohum — OSMOS'un kendi kataloğundaki satıcı bağlantıları.
 *
 * ⚠️ Bu liste bedava VE önceden doğrulanmış. Hafızanın yazdığına göre
 * kataloğun 52 parfümündeki her adres gerçek tarayıcıda açılıp ürün adı
 * görülerek yazıldı (`osmos-satici-baglantilari`). Yani boru hattı daha ilk
 * gün, tek kuruş harcamadan, yanlış-pozitifi elenmiş bir küme üstünde
 * çalışıyor — Apify'ın bulacağı ham sonuçlardan çok daha temiz bir başlangıç.
 *
 * ⚠️ Hangisinin hedef olduğuna burada karar VERİLMİYOR. Dior da Zoologist de
 * aynı borudan geçiyor; ayıklamayı puan yapıyor. Elle ayıklamak, ölçüm yerine
 * benim tahminimi listeye sokmak olurdu.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { normalizeDomain } from './domain.ts';

/** `{ name: 'Luckyscent', url: 'https://…' }` — kataloğun tek biçimi. */
const SATICI = /\{\s*name:\s*'([^']+)'\s*,\s*url:\s*'([^']+)'\s*\}/g;

export interface Tohum {
  readonly domain: string;
  readonly shopName: string;
  readonly seedUrl: string;
}

export function katalogTohumlari(katalogDizini: string): readonly Tohum[] {
  const gorulen = new Map<string, Tohum>();

  for (const dosya of readdirSync(katalogDizini).filter((d) => d.endsWith('.ts') && !d.endsWith('.test.ts'))) {
    const metin = readFileSync(join(katalogDizini, dosya), 'utf8');
    for (const m of metin.matchAll(SATICI)) {
      const shopName = m[1];
      const seedUrl = m[2];
      if (shopName === undefined || seedUrl === undefined) continue;
      const domain = normalizeDomain(seedUrl);
      if (domain === null) continue;
      /*
        İlk görülen kazanıyor: aynı alan adı birden çok parfümde geçiyor
        (Luckyscent 4 kez) ve hepsi aynı işletme. Tekilleştirme burada da
        alan adı üstünden, veritabanındaki UNIQUE kısıtla aynı anahtarla.
      */
      if (!gorulen.has(domain)) gorulen.set(domain, { domain, shopName, seedUrl });
    }
  }
  return [...gorulen.values()].sort((a, b) => a.domain.localeCompare(b.domain));
}

/** Depo kökündeki katalog dizini — `leadgen/src`ten iki üst. */
export function varsayilanKatalogDizini(): string {
  return join(import.meta.dirname, '..', '..', 'src', 'data', 'perfume-sets');
}

/**
 * Kataloğdaki parfüm sayısı — mektuptaki güven cümlesinin kaynağı.
 *
 * ⚠️ Sabit yazılmıyor, HER KOŞUDA sayılıyor. Sebep: bu sayı müşteriye giden
 * metne giriyor ve katalog büyüdükçe elle güncellenmesi unutulur. Unutulan
 * bir sayı, doğrulanabilir olsun diye konmuş bir cümleyi yalana çevirir —
 * dükkân sahibi adrese girip beş saniyede sayabiliyor.
 */
export function katalogParfumSayisi(katalogDizini: string): number {
  let toplam = 0;
  for (const dosya of readdirSync(katalogDizini).filter((d) => d.endsWith('.ts') && !d.endsWith('.test.ts'))) {
    const metin = readFileSync(join(katalogDizini, dosya), 'utf8');
    toplam += (metin.match(/^ {4}id: '/gm) ?? []).length;
  }
  return toplam;
}
