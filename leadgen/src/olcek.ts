/**
 * Ölçek sınıflandırması — BİLGİ, kapı değil.
 *
 * ⚠️ Sahip büyük evleri elemeyi açıkça reddetti:
 * *"ne kadar daha çok markayla evle iletişime geçersek daha iyi olur;
 * 5000'den 10 tane mesaj alırsın, 1000'den 1."*
 *
 * Bu yüzden burada hiç kimse elenmiyor. Ölçek yalnız bir sütun olarak
 * yazılıyor ki sahip isterse Excel'de kendi süzsün. Buraya bir filtre
 * eklenirse `olcek.test.ts` kırmızıya döner.
 */
import type { Lead, Platform } from './types.ts';

export type Olcek = 'tek-kisilik' | 'kucuk' | 'orta' | 'buyuk' | 'bilinmiyor';

/** Bir kişinin tek başına çevirebileceği katalog bu sayının altında. */
const TEK_KISILIK_TAVANI = 30;
/** Sahibin "butik" aralığının üst ucu. */
const KUCUK_TAVANI = 500;
/** Bunun üstü kurumsal bir ekip demek. */
const ORTA_TAVANI = 1500;

/**
 * Kurumsal güvenlik duvarı izi.
 *
 * Ölçüldü: 38 alan adının 9'u nazik getiriciye 403 verdi ve dokuzu da
 * büyük evdi (Dior, Guerlain, Hermès, Jo Malone, Lancôme…). Küçük bir
 * Shopify dükkânı bu tür bir korumayı kurmuyor — 403 tek başına güçlü
 * bir "büyük şirket" işareti.
 */
const KURUMSAL_DUVAR = /ROBOTA KAPALI/;

export type OlcekGirdisi = Pick<Lead, 'product_count' | 'platform' | 'notes'>;

export function olcekCikar(lead: OlcekGirdisi): Olcek {
  if (lead.notes !== null && KURUMSAL_DUVAR.test(lead.notes)) return 'buyuk';

  const sayi = lead.product_count;
  if (sayi === null) return 'bilinmiyor';
  if (sayi < TEK_KISILIK_TAVANI) return 'tek-kisilik';
  if (sayi <= KUCUK_TAVANI) return 'kucuk';
  if (sayi <= ORTA_TAVANI) return 'orta';
  return 'buyuk';
}

/** Sahibe okunur açıklama — CSV'de ham etiketin yanında durmuyor, yerine geçiyor. */
export function olcekAciklamasi(o: Olcek, platform: Platform): string {
  const taban: Record<Olcek, string> = {
    'tek-kisilik': 'cok kucuk katalog — buyuk ihtimalle tek kisi',
    kucuk: 'butik olcek',
    orta: 'orta olcek',
    buyuk: 'buyuk — kurumsal ekip ya da guvenlik duvari',
    bilinmiyor: 'olculemedi',
  };
  return platform === 'shopify' || platform === 'woocommerce'
    ? `${taban[o]} · kendi kuran altyapi`
    : taban[o];
}
