import { test } from 'node:test';
import assert from 'node:assert/strict';
import { acilisCumlesi } from './outreach.ts';
import { URUN_TAVANI } from '../enrich/platform.ts';
import type { Evidence, Lead } from '../types.ts';

/**
 * Tavana dayanan sayı iddia edilmez.
 *
 * ⚠️ **Ölçülerek bulundu (2026-08-18, ilk parti kurulurken).** Tarama Shopify'da
 * dördüncü sayfada duruyor ve `product_count` 1000'de tavana dayanıyor —
 * kayıtta notu bile var: *"urun sayisi 1000+ (tavan)"*. Ama mesaj metni bunu
 * bilmiyordu ve şu cümleyi üretiyordu:
 *
 *     "I counted the 1000 fragrances in your catalogue"
 *
 * 1000 bir sayım değil, taramanın durduğu yer. **59 DM hedefi tam bu cümleyle
 * gidecekti** ve akışın kendi kuralını çiğniyordu: *"cümlede yazan şey o
 * sayfada gerçekten yoksa gönderme."* Ilk cevapta yakalanan bir yanlış, o
 * dükkânı temelli kapatır.
 *
 * Doğrusu zaten elimizdeydi: **1000'den fazla** hem doğru hem daha etkileyici.
 */

const kanit = [
  {
    domain: 'x.com', kind: 'platform', snippet: '',
    url: 'https://x.com/products.json?limit=250&page=1',
  },
] as unknown as readonly Evidence[];

const lead = (product_count: number, notes: string | null = null): Lead => ({
  domain: 'x.com',
  shop_name: 'Niche Perfume Shop',
  notes,
  product_count,
} as unknown as Lead);

/*
  ⚠️ Iki yardımcı, cümle ÜRETİLMEDİĞİNDE sınamanın sessizce geçmesini
  engelliyor. `acilisCumlesi` `undefined` dönebiliyor ve "içermiyor" denetimi
  o durumda kendiliğinden doğru çıkardı — yani kapı, asıl korktuğumuz durumda
  (metin hiç kurulmamış) açık kalırdı.
*/
function icerir(metin: string | undefined, parca: string): void {
  if (typeof metin !== 'string') assert.fail(`cumle uretilmedi, "${parca}" aranamadi`);
  assert.ok(metin.includes(parca), `"${parca}" bulunamadi — gelen: ${metin}`);
}

function icermez(metin: string | undefined, parca: string): void {
  if (typeof metin !== 'string') assert.fail(`cumle uretilmedi, "${parca}" denetlenemedi`);
  assert.ok(!metin.includes(parca), `"${parca}" gecmemeliydi — gelen: ${metin}`);
}

test('tavanin ALTINDA gercek sayi soyleniyor', () => {
  const a = acilisCumlesi(lead(313), kanit, 'en');
  icerir(a?.cumle, 'I counted 313 fragrances');
  icerir(a?.kisa, 'I counted the 313 fragrances');
});

/*
  Asıl kapı. "counted" kelimesi tavanda GEÇMEMELİ — sayılmadı, tarama durdu.
*/
test('tavanda "saydim" DEMIYOR', () => {
  const a = acilisCumlesi(lead(URUN_TAVANI), kanit, 'en');
  icermez(a?.cumle, 'I counted');
  icerir(a?.cumle, 'runs past');
  icermez(a?.kisa, 'I counted');
});

test('tavanda Turkce de iddia etmiyor', () => {
  const a = acilisCumlesi(lead(URUN_TAVANI), kanit, 'tr');
  icermez(a?.cumle, 'saydım');
  icerir(a?.cumle, "'den fazla");
});

/*
  ⚠️ **Sayı eşiği tek başına yetmiyor.** Tarama bir sayfa getirilemediğinde de
  kırılıyor ve toplam orada kalıyor — 1000'in ÇOK altında. Ölçüldü
  (2026-08-19): scentido.com kayıtta 250 ürünle duruyordu, gerçekte 490.
  Kayıt bunu nota yazmıştı (); eksik olan metnin onu okumasıydı.
*/
test('kayittaki (tavan) isareti sayidan BAGIMSIZ olarak iddiayi kaldiriyor', () => {
  const a = acilisCumlesi(lead(250, 'urun sayisi 250+ (tavan)'), kanit, 'en');
  icermez(a?.cumle, 'I counted');
  icerir(a?.cumle, 'runs past 250');
});

test('isaret YOKSA sayi gercek sayilir', () => {
  const a = acilisCumlesi(lead(977), kanit, 'en');
  icerir(a?.cumle, 'I counted 977');
});

/* Tavanın üstü de aynı muameleyi görmeli — sayı yine gerçek değil. */
test('tavanin USTU de iddia degil', () => {
  const a = acilisCumlesi(lead(URUN_TAVANI + 500), kanit, 'en');
  icermez(a?.cumle, 'I counted');
});
