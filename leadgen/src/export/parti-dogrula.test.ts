import { test } from 'node:test';
import assert from 'node:assert/strict';
import { karsilastir, partiAlanAdlari, tavandaMi } from './parti-dogrula.ts';
import { URUN_TAVANI } from '../enrich/platform.ts';

/**
 * Sayı iddiası doğrulamasının kapısı.
 *
 * ⚠️ **Bu araç, körleşen bir betiğin yerine geçti.** Üç parti boyunca denetim
 * elde tutulan geçici bir betikle yapıldı ve her seferinde kayan sayı buldu
 * (2. partide 1/10, 3. partide 3/10). Dördüncü partide betik dört hedefte
 * `NaN` bastı: taslaklar Almanca çıkmıştı ve betiğin kalıbı yalnız Ingilizce
 * biliyordu.
 *
 * ⚠️⚠️ Ders araca yazıldı: **üretilen düzyazı geri AYRIŞTIRILMIYOR.** Iddiayı
 * `leads.product_count` üretiyor, yani doğru soru "cümledeki sayı doğru mu"
 * değil "kayıttaki sayı hâlâ gerçek mi" — ve o soru dilden bağımsız.
 */

test('tavanda DEGILSE birebir esitlik araniyor', () => {
  assert.equal(karsilastir(313, false, 313).durum, 'tutuyor');
  assert.equal(karsilastir(313, false, 314).durum, 'kaymis');
  assert.equal(karsilastir(313, false, 312).durum, 'kaymis');
});

/*
  ⚠️ Tavandaki kayıtta esitlik YETMIYOR. Cümle "1000'den fazla" diyor; tam
  1000 ürünlü bir katalogda o cümle yanlış olur. Bir kez gözden kaçarsa
  mesaj yanlış bir iddiayla gider ve ilk cevapta yakalanır.
*/
test('tavandaki kayitta esitlik yetmiyor, ASMASI gerekiyor', () => {
  assert.equal(karsilastir(1000, true, 1001).durum, 'tutuyor');
  assert.equal(karsilastir(1000, true, 1000).durum, 'kaymis');
  assert.equal(karsilastir(1000, true, 940).durum, 'kaymis');
});

test('okunamayan katalog "tutuyor" SAYILMIYOR', () => {
  assert.equal(karsilastir(313, false, null).durum, 'olculemedi');
  assert.equal(karsilastir(1000, true, null).durum, 'olculemedi');
});

/*
  ⚠️ Sayı eşiği tek başına yetmiyor: tarama bir sayfa getirilemediğinde de
  kırılıyor ve toplam tavanın ÇOK altında kalıyor. Kayıt bunu nota yazıyor.
  Ölçüldü (2026-08-19): scentido.com kayıtta 250 ürünle duruyordu, gerçekte 490.
*/
test('tavan isareti KAYITTAN da okunuyor', () => {
  assert.equal(tavandaMi(URUN_TAVANI, null), true);
  assert.equal(tavandaMi(250, 'urun sayisi 250+ (tavan)'), true);
  assert.equal(tavandaMi(250, null), false);
  assert.equal(tavandaMi(977, 'baska bir not'), false);
});

test('parti dosyasindan alan adlari cikiyor', () => {
  const metin = [
    '# Sıradaki parti — 2 mesaj',
    '',
    '## 1. Petit Parfums',
    '',
    '- **Instagram:** @petit_parfums',
    '- **Alan adı:** petitparfums.ca · CA',
    '- **Kanıt adresi:** https://petitparfums.ca/products.json?limit=250&page=1',
    '',
    '## 2. FragLand',
    '',
    '- **Alan adı:** fragland.com.au',
  ].join('\n');

  assert.deepEqual(partiAlanAdlari(metin), ['petitparfums.ca', 'fragland.com.au']);
});

/*
  Boş ya da alakasız metinden alan adı UYDURULMUYOR — "- **Instagram:**"
  satırı da "- **" ile başlıyor ve gevşek bir kalıp onu yakalardı.
*/
test('alakasiz satirdan alan adi uydurulmuyor', () => {
  assert.deepEqual(partiAlanAdlari(''), []);
  assert.deepEqual(partiAlanAdlari('- **Instagram:** @x\n- **Kanıt adresi:** https://x.com/a'), []);
});
