import { markaAnahtari, urunAnahtari, type KatalogParfumu } from './markalar.ts';

/**
 * Kiracı katalog taslağı — demoyu saatlerden dakikalara indiren parça.
 *
 * ⚠️ **Neden gerekti:** demo kurmanın ölçülen maliyeti 20 parfüm için 6-8 saatti
 * ve o sürenin büyük kısmı veri girişi değil ARAMAydı — her parfümün dükkândaki
 * ürün adresini elle bulmak. Oysa iki şey zaten elimizde: eşleşen parfümlerin
 * kimlikleri (`urunOrtusmesiHesapla`) ve dükkânın `products.json`u, ki adresi
 * o taşıyor (`handle`). Yani iş arama değil, **öneri + gözle onay.**
 *
 * ⚠️⚠️ **Öneri OTOMATİK KABUL EDİLMEZ ve bu ölçülmüş bir hatadan geliyor.**
 * Nischengold'da ilk otomatik eşleştirici beş parfümün beşinde de `Extrait`
 * sürümünü seçmişti; dükkân çoğu parfümü hem temel hem Extrait olarak satıyor,
 * bizim kayıtlarımız temel sürüm. Yanlış bağlantı bağlantısızlıktan **kötüdür**:
 * ziyaretçi başka ürüne düşer, sepete onu atar ve kimse fark etmez. Bu yüzden
 * üretilen dosyadaki her adres `DOGRULANMADI` işaretiyle çıkıyor ve ana depodaki
 * `dogrulama.test.ts` o işaret kaldığı sürece düşüyor.
 */

/** Dükkânın tek bir ürünü — adresi `handle`den kuruluyor. */
export interface DukkanUrunu {
  readonly handle: string;
  /** Marka + ad birleşik başlık; eşleştirme bunun üstünde. */
  readonly baslik: string;
}

export interface AdresAdayi {
  readonly id: string;
  /** Önerilen adres — en kısa başlıklı aday. */
  readonly secim: DukkanUrunu;
  /** Eşleşen bütün ürünler; birden çoksa gözle bakılacak. */
  readonly adaylar: readonly DukkanUrunu[];
}

/**
 * Kimlikten adaya.
 *
 * ⚠️ **Eşleştirme kuralı `urunOrtusmesiHesapla` ile BİREBİR aynı olmak zorunda**
 * (aynı normalleştirme, aynı "marka da tutmalı" şartı). Ayrışırsa örtüşme sayısı
 * ile taslaktaki seçki birbirini tutmaz ve bu sessiz olur: rapor "6 parfüm" der,
 * taslak 5 satır üretir, kimse sebebini aramaz.
 *
 * ⚠️ **Seçim kuralı: EN KISA BAŞLIK.** Temel sürümün adı en kısadır; `Extrait`,
 * `Intense`, `Elixir` hep ek kelimeyle geliyor. Kural uydurulmadı, **ölçüldü**:
 * Nischengold'un elle doğrulanmış 13 adresinin **13'ünü** birebir üretiyor ve
 * beş Extrait tuzağının beşini de doğru tarafa düşürüyor.
 */
export function adresAdaylari(
  urunler: readonly DukkanUrunu[],
  bizimkiler: readonly KatalogParfumu[],
): readonly AdresAdayi[] {
  const sade = urunler.map((u) => ({ urun: u, anahtar: urunAnahtari(u.baslik) }));
  const cikti: AdresAdayi[] = [];

  for (const b of bizimkiler) {
    const ad = urunAnahtari(b.ad);
    /* Üç harften kısa adlar her başlıkta geçer; yanlış eşleşme üretirler. */
    if (ad.length < 5) continue;
    const marka = markaAnahtari(b.marka);
    if (marka === '') continue;

    const adaylar = sade
      .filter((t) => t.anahtar.includes(ad) && t.anahtar.includes(marka))
      .map((t) => t.urun);
    if (adaylar.length === 0) continue;

    const secim = [...adaylar].sort((x, y) => x.baslik.length - y.baslik.length)[0];
    cikti.push({ id: b.id, secim, adaylar });
  }

  return cikti;
}

/** Dosya adı ve kayıt için kullanılan kimlik — `nischengold.com` → `nischengold`. */
export function kiraciKimligi(domain: string): string {
  const govde = domain.replace(/^www\./, '').split('.')[0] ?? domain;
  return govde.toLowerCase().replace(/[^a-z0-9-]/g, '-');
}

const ISARET = 'DOGRULANMADI';

/**
 * `src/data/tenants/<kimlik>/catalog.ts` taslağı.
 *
 * Biçim `nischengold/catalog.ts`ten alındı; oradaki gerekçe yorumları elle
 * yazılıyor çünkü her dükkânın hikâyesi ayrı. Üretilen dosya **çalışır** ama
 * `DOGRULANMADI` işaretleri durdukça yayına giremez.
 */
export function katalogTaslagi(
  kimlik: string,
  magazaAdi: string,
  domain: string,
  adaylar: readonly AdresAdayi[],
): string {
  const sabit = kimlik.toUpperCase().replace(/-/g, '_');
  const secki = adaylar.map((a) => `  '${a.id}',`).join('\n');

  const adresler = adaylar.map((a) => {
    const kacAday = a.adaylar.length;
    const not = kacAday > 1
      ? `  /* ${ISARET} · ${kacAday} aday, en kısası seçildi — ötekiler: ${a.adaylar.filter((x) => x !== a.secim).map((x) => x.handle).join(', ')} */`
      : `  /* ${ISARET} */`;
    return `${not}\n  '${a.id}': 'https://${domain}/products/${a.secim.handle}',`;
  }).join('\n');

  return `import type { Perfume } from '../../types';
import { OSMOS_ALL } from '../../osmos-catalog';
import { deriveTenantCatalog } from '../derive';

/**
 * ${magazaAdi}'in rafı.
 *
 * ⚠️ **TASLAK — elle doğrulanmadan yayına gitmez.** Bu dosya
 * \`leadgen kiraci-taslak ${domain}\` ile üretildi. Her adres bir ÖNERİ:
 * eşleşen ürünlerin en kısa başlıklısı seçildi, çünkü \`Extrait\`/\`Intense\`
 * sürümleri hep ek kelimeyle geliyor ve bizim kayıtlarımız temel sürüm.
 *
 * Adresi tarayıcıda aç, ürünün gerçekten o parfüm olduğunu GÖR, sonra
 * \`${ISARET}\` işaretini sil. Işaret duran bir katalog
 * \`dogrulama.test.ts\`i düşürür — yani doğrulanmamış demo yayına çıkamaz.
 *
 * ⚠️ Yanlış bağlantı bağlantısızlıktan kötüdür: ziyaretçi başka ürüne düşer,
 * sepete onu atar ve kimse fark etmez.
 */
const SELECTION: readonly string[] = [
${secki}
];

/** Parfümden dükkânın KENDİ ürün sayfasına — dönüşüm yolu. */
const URUN_ADRESLERI: Readonly<Record<string, string>> = {
${adresler}
};

const BY_ID = new Map(OSMOS_ALL.map((perfume) => [perfume.id, perfume]));

const SELECTED: readonly Perfume[] = SELECTION.map((id) => {
  const perfume = BY_ID.get(id);
  /*
    Seçkideki bir kimlik ana katalogdan kalkarsa kiracının haritasında sessizce
    bir nokta eksilir. Derlemede patlamak, eksik haritayı müşteriye yollamaktan
    iyidir.
  */
  if (!perfume) {
    throw new Error(\`${magazaAdi} seçkisi bilinmeyen parfüme işaret ediyor: \${id}\`);
  }
  return perfume;
});

export const ${sabit}_CATALOG: readonly Perfume[] = deriveTenantCatalog(
  SELECTED,
  URUN_ADRESLERI,
  '${magazaAdi}',
);
`;
}

/** `registry.ts` ve `catalogs.ts` için yapıştırmalık satırlar. */
export function kayitTaslagi(kimlik: string, magazaAdi: string): string {
  const sabit = kimlik.toUpperCase().replace(/-/g, '_');
  return `--- src/data/tenants/registry.ts ---

const ${sabit}: Tenant = {
  id: '${kimlik}',
  name: '${magazaAdi}',
  title: { en: '${magazaAdi} — scent map', tr: '${magazaAdi} — koku haritasi' },
  description: {
    en: 'The ${magazaAdi} shelf, drawn as a map of scent.',
    tr: '${magazaAdi} rafi, koku haritasi olarak cizildi.',
  },
  features: { accounts: false, notify: false, feed: false },
  /* Onayi alinmamis calisma arama sonuclarinda gorunmemeli. */
  indexable: false,
  /* Dukkanin dilini OLC, varsayma. */
  locales: ['en'],
};

… ve TENANTS dizisine ${sabit} eklenecek.

--- src/data/tenants/catalogs.ts ---

import { ${sabit}_CATALOG } from './${kimlik}/catalog';
… ve TENANT_CATALOGS icine:  ${kimlik}: ${sabit}_CATALOG,
`;
}
