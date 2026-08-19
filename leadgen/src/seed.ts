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
import { existsSync, readFileSync, readdirSync } from 'node:fs';
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
 * Yalnız kiracı demoları için girilmiş, ana sitenin uzaylarına GİRMEYEN
 * parfüm gruplarının dosya adları.
 *
 * `osmos-catalog.ts`ten türetiliyor, elle yazılmıyor: orada
 * `OSMOS_TENANT_ONLY` hangi grupları topluyorsa, o grupların geldiği dosyalar
 * buradan düşüyor. Dosya adı değişirse eşleşme kendiliğinden düzeliyor.
 */
export function kiraciyaOzelDosyalar(katalogDizini: string): ReadonlySet<string> {
  const yol = join(katalogDizini, '..', 'osmos-catalog.ts');
  if (!existsSync(yol)) return new Set();
  const metin = readFileSync(yol, 'utf8');

  const blok = /OSMOS_TENANT_ONLY[^=]*=\s*\[([^\]]*)\]/s.exec(metin);
  if (blok === null) return new Set();

  const adlar = new Set([...blok[1].matchAll(/\.\.\.([A-Z0-9_]+)/g)].map((m) => m[1]));

  /*
    ⚠️ Ad eşleşmesi TAM, "içeriyor" değil. `satir.includes(ad)` yazılsaydı
    `SPACE_3_C` arayan bir tur `SPACE_3_CX`i de yakalardı ve yanlış dosya
    sayımdan düşerdi — sessizce, çünkü sonuç yine makul bir sayı olurdu.
  */
  const dosyalar = new Set<string>();
  for (const satir of metin.split('\n')) {
    const ithal = /^import\s*\{([^}]*)\}\s*from\s*'\.\/perfume-sets\/([^']+)'/.exec(satir);
    if (ithal === null) continue;
    const isimler = ithal[1].split(',').map((x) => x.trim());
    if (isimler.some((isim) => adlar.has(isim))) dosyalar.add(`${ithal[2]}.ts`);
  }
  return dosyalar;
}

/**
 * Kataloğdaki parfüm sayısı — mektuptaki güven cümlesinin kaynağı.
 *
 * ⚠️ Sabit yazılmıyor, HER KOŞUDA sayılıyor. Sebep: bu sayı müşteriye giden
 * metne giriyor ve katalog büyüdükçe elle güncellenmesi unutulur. Unutulan
 * bir sayı, doğrulanabilir olsun diye konmuş bir cümleyi yalana çevirir —
 * dükkân sahibi adrese girip beş saniyede sayabiliyor.
 *
 * ⚠️ **Kiracıya özel kayıtlar SAYILMIYOR (2026-08-19'da düzeltildi).** Sayım
 * bütün dosyaları tarıyordu ve 154 buluyordu; oysa `space-3-c.ts`teki dört
 * Matière Première kaydı yalnız kiracı demoları için girilmiş ve ana sitenin
 * uzaylarına hiç girmiyor (gerekçesi `osmos-catalog.ts`te: ana kataloğa
 * eklendiklerinde uzay renkleri kaymıştı). Yani mektup *"154 fragrances are
 * mapped"* diyordu, osmos.me'de sayılabilen ise **150**.
 *
 * Fark küçük ama cümlenin bütün değeri doğrulanabilir olmasında: sayan
 * dükkân sahibi tutmayan bir rakam bulursa, mektubun geri kalanı da şüpheli
 * hâle gelir. Aynı disiplin `parti-dogrula` komutunun da sebebi.
 */
export function katalogParfumSayisi(katalogDizini: string): number {
  const haric = kiraciyaOzelDosyalar(katalogDizini);
  let toplam = 0;
  for (const dosya of readdirSync(katalogDizini).filter((d) => d.endsWith('.ts') && !d.endsWith('.test.ts'))) {
    if (haric.has(dosya)) continue;
    const metin = readFileSync(join(katalogDizini, dosya), 'utf8');
    toplam += (metin.match(/^ {4}id: '/gm) ?? []).length;
  }
  return toplam;
}
