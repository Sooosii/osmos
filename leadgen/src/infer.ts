/**
 * Ölçülenden çıkarılanlar: segment ve ülke.
 *
 * ⚠️ Kestirilemeyen alan **boş bırakılıyor.** Sahibin kuyruk kuralı
 * ("isim uydurulmayacak") burada da geçerli: yanlış bir ülke kodu, yanlış
 * dilde mektup demek.
 */
import type { Platform, Segment } from './types.ts';

/** Decant/numune satışının ürün adlarındaki izleri. */
const DECANT_IZI = /\b(decant|decants|sample|samples|numune|tester|travel\s*size|discovery\s*set|5\s*ml|10\s*ml|2\s*ml)\b/i;

/**
 * Kendi markasını satan bir parfüm evi bu sayının altında kalıyor.
 * Üstü çok markalı bir dükkân demek — sahibin "butik e-ticaret" segmenti.
 */
const EV_URUN_TAVANI = 35;
/** Decant demek için ürün adlarının en az bu oranı iz taşımalı. */
const DECANT_ESIGI = 0.15;

export function segmentCikar(
  urunAdlari: readonly string[],
  productCount: number | null,
  platform: Platform,
): Segment {
  if (urunAdlari.length >= 8) {
    const izli = urunAdlari.filter((a) => DECANT_IZI.test(a)).length;
    if (izli / urunAdlari.length >= DECANT_ESIGI) return 'decant';
  }
  if (productCount === null) return 'bilinmiyor';
  if (productCount <= EV_URUN_TAVANI) return 'nis-parfum-evi';
  if (platform === 'shopify' || platform === 'woocommerce') return 'butik-eticaret';
  return 'bilinmiyor';
}

/** Ülke kodlu üst düzey alan adları → hedef pazarlar. */
const TLD_ULKE: Readonly<Record<string, string>> = {
  tr: 'TR', de: 'DE', fr: 'FR', it: 'IT', es: 'ES', nl: 'NL', be: 'BE',
  se: 'SE', dk: 'DK', pl: 'PL', pt: 'PT', at: 'AT', ch: 'CH', uk: 'GB',
  ae: 'AE', sa: 'SA', qa: 'QA', kw: 'KW', bh: 'BH', om: 'OM',
  us: 'US', ca: 'CA', gr: 'GR', ro: 'RO', cz: 'CZ', hu: 'HU', fi: 'FI', no: 'NO',
};

/**
 * Alan adı uzantısından ülke. `.com`/`.net` bir şey söylemiyor —
 * o durumda boş dönüyor, ABD varsayılmıyor.
 */
export function ulkeCikar(domain: string): string | null {
  const uzanti = domain.split('.').pop() ?? '';
  return TLD_ULKE[uzanti] ?? null;
}
