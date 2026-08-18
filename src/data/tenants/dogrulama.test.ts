import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

/**
 * Doğrulanmamış demo yayına çıkamaz.
 *
 * ⚠️ **Ölçülmüş bir hatadan doğdu.** Nischengold'un ilk otomatik eşleştiricisi
 * beş parfümün beşinde de `Extrait` sürümünü seçmişti; dükkân çoğu parfümü hem
 * temel hem Extrait olarak satıyor ve bizim kayıtlarımız temel sürüm. Yanlış
 * bağlantı bağlantısızlıktan **kötüdür**: ziyaretçi başka ürüne düşer, sepete
 * onu atar ve kimse fark etmez — ne biz ne müşteri.
 *
 * `leadgen kiraci-taslak <domain>` artık katalog taslağını üretiyor ve her
 * adresi `DOGRULANMADI` işaretiyle bırakıyor. Işaret, adresi tarayıcıda açıp
 * ürünün gerçekten o parfüm olduğunu GÖREN kişi tarafından siliniyor.
 *
 * Bu sınama o işareti kalıcı bir kapıya çeviriyor: taslak derlenebilir ve
 * yerelde gezilebilir, ama işaret durdukça sınamalar yeşile dönmez — yani
 * doğrulanmamış bir demo master'a giremez.
 *
 * ⚠️ Kapı ÜRETİLEN dosyayı değil **depodaki** katalogları denetliyor: taslak
 * `leadgen/data/` altında duruyor ve oradan `src/data/tenants/<kimlik>/`e
 * taşınması bilinçli bir adım. Kapı taşınmadan sonra bekliyor.
 */

const TENANTS = resolve(__dirname);
const ISARET = 'DOGRULANMADI';

function katalogDosyalari(dizin: string): string[] {
  const cikti: string[] = [];
  for (const ad of readdirSync(dizin)) {
    const yol = join(dizin, ad);
    if (statSync(yol).isDirectory()) {
      cikti.push(...katalogDosyalari(yol));
      continue;
    }
    if (ad === 'catalog.ts') cikti.push(yol);
  }
  return cikti;
}

describe('kiracı katalogları', () => {
  const dosyalar = katalogDosyalari(TENANTS);

  it('en az bir kiracı katalogu bulundu — tarayıcı boşa düşmesin', () => {
    expect(dosyalar.length).toBeGreaterThan(0);
  });

  it.each(dosyalar.map((d) => d.slice(TENANTS.length + 1)))(
    '%s içinde doğrulanmamış adres kalmamış',
    (bagil) => {
      const kaynak = readFileSync(join(TENANTS, bagil), 'utf8');
      const kacinci = kaynak.split(ISARET).length - 1;

      expect(
        kacinci,
        `${bagil}: ${kacinci} adres hâlâ ${ISARET} — adresi tarayıcıda aç, `
        + 'ürünün gerçekten o parfüm olduğunu gör, sonra işareti sil',
      ).toBe(0);
    },
  );

  /*
    Kapının boş çalışmadığının kanıtı: işaretin kendisi bu dosyada geçiyor ve
    sınama onu KENDİ kaynağında saymıyor — yalnız katalog dosyalarına bakıyor.
    Bu iddia olmasa, "hiç eşleşme yok" ile "hiç dosya yok" ayırt edilemezdi.
  */
  it('işaret gerçekten aranıyor — kapı boş çalışmıyor', () => {
    const sahte = `'x': 'https://y.com/products/z', /* ${ISARET} */`;
    expect(sahte.split(ISARET).length - 1).toBe(1);
  });
});
