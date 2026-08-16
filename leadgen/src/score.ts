/**
 * Puanlama — sahibin verdiği formül, birebir ve tek yerde.
 *
 * Saf fonksiyon: ağ yok, veritabanı yok. Böylece her kural tek tek
 * sınanabiliyor ve formül değişirse sınama önce kırmızıya döner.
 */
import type { Lead } from './types.ts';

/** Sahibin ağırlıkları. Sayılar burada, kodun içine dağılmış değil. */
export const AGIRLIK = {
  eposta: 30,
  shopify: 20,
  urunAraligi: 20,
  benzerYok: 20,
  instagram: 10,
} as const;

/** "Butik" sayılan ürün sayısı aralığı — sahibin verdiği sınırlar. */
export const URUN_ALT = 30;
export const URUN_UST = 500;

export type PuanGirdisi = Pick<Lead, 'email' | 'platform' | 'product_count' | 'has_similar_feature' | 'instagram'>;

export interface PuanDokumu {
  readonly toplam: number;
  readonly kalemler: Readonly<Record<keyof typeof AGIRLIK, number>>;
}

export function puanla(lead: PuanGirdisi): PuanDokumu {
  const sayi = lead.product_count;
  const kalemler = {
    eposta: lead.email !== null && lead.email !== '' ? AGIRLIK.eposta : 0,
    shopify: lead.platform === 'shopify' ? AGIRLIK.shopify : 0,
    urunAraligi: sayi !== null && sayi >= URUN_ALT && sayi <= URUN_UST ? AGIRLIK.urunAraligi : 0,
    /*
      ⚠️ Yalnız KESIN yokluk puan alıyor. `null` "bakılmadı" demek ve
      ölçülmemiş bir siteye bu 20 puanı vermek, ulaşılamayan dükkânları
      listenin tepesine taşırdı — puanlamanın en kolay bozulacak yeri burası.
    */
    benzerYok: lead.has_similar_feature === false ? AGIRLIK.benzerYok : 0,
    instagram: lead.instagram !== null && lead.instagram !== '' ? AGIRLIK.instagram : 0,
  } as const;

  const toplam = (Object.values(kalemler) as readonly number[]).reduce((a, b) => a + b, 0);
  return { toplam, kalemler };
}
