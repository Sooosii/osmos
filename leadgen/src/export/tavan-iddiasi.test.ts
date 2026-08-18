import { describe, expect, it } from 'vitest';
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

describe('sayı iddiası', () => {
  it('tavanin ALTINDA gercek sayi soyleniyor', () => {
    const a = acilisCumlesi(lead(313), kanit, 'en');
    expect(a?.cumle).toContain('I counted 313 fragrances');
    expect(a?.kisa).toContain('I counted the 313 fragrances');
  });

  /*
    Asıl kapı. "counted" kelimesi tavanda GEÇMEMELİ — sayılmadı, tarama durdu.
  */
  it('tavanda "saydim" DEMIYOR', () => {
    const a = acilisCumlesi(lead(URUN_TAVANI), kanit, 'en');
    expect(a?.cumle).not.toContain('I counted');
    expect(a?.cumle).toContain('runs past');
    expect(a?.kisa).not.toContain('I counted');
  });

  it('tavanda Turkce de iddia etmiyor', () => {
    const a = acilisCumlesi(lead(URUN_TAVANI), kanit, 'tr');
    expect(a?.cumle).not.toContain('saydım');
    expect(a?.cumle).toContain("'den fazla");
  });

  /*
    ⚠️ **Sayı eşiği tek başına yetmiyor.** Tarama bir sayfa getirilemediğinde de
    kırılıyor ve toplam orada kalıyor — 1000'in ÇOK altında. Ölçüldü
    (2026-08-19): scentido.com kayıtta 250 ürünle duruyordu, gerçekte 490.
    Kayıt bunu nota yazmıştı (); eksik olan metnin onu okumasıydı.
  */
  it('kayittaki (tavan) isareti sayidan BAGIMSIZ olarak iddiayi kaldiriyor', () => {
    const a = acilisCumlesi(lead(250, 'urun sayisi 250+ (tavan)'), kanit, 'en');
    expect(a?.cumle).not.toContain('I counted');
    expect(a?.cumle).toContain('runs past 250');
  });

  it('isaret YOKSA sayi gercek sayilir', () => {
    const a = acilisCumlesi(lead(977), kanit, 'en');
    expect(a?.cumle).toContain('I counted 977');
  });

  /* Tavanın üstü de aynı muameleyi görmeli — sayı yine gerçek değil. */
  it('tavanin USTU de iddia degil', () => {
    const a = acilisCumlesi(lead(URUN_TAVANI + 500), kanit, 'en');
    expect(a?.cumle).not.toContain('I counted');
  });
});
