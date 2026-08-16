/**
 * Puanlama — sahibin verdiği formül, birebir ve tek yerde.
 *
 * Saf fonksiyon: ağ yok, veritabanı yok. Böylece her kural tek tek
 * sınanabiliyor ve formül değişirse sınama önce kırmızıya döner.
 */
import type { Lead } from './types.ts';

/**
 * Sahibin ağırlıkları. Sayılar burada, kodun içine dağılmış değil.
 *
 * ⚠️ FORMÜL DEĞİŞTİ, çünkü SATILAN ŞEY değişti. Önceki sürümde en büyük
 * ikinci ağırlık "benzer-ürün bloğu YOK" idi (+20) — o bir WIDGET sinyaliydi:
 * bloğu olmayan dükkâna blok satılacaktı. Sahibin kararıyla ürün artık
 * müşterinin kendi markasıyla çalışan bir harita SİTESİ. O üründe bir
 * dükkânın öneri bloğu olup olmaması hiçbir şey söylemiyor.
 *
 * Yerine gelenler, teslim ekonomisinin ölçtüğü iki şey:
 *   ① harita-boyu katalog — 5 parfümlük evde harita boş görünür,
 *     2000 parfümlük mağazada teslim edilemez
 *   ② marka örtüşmesi — hedefin sattığı markalar bizim 110 markamızdaysa
 *     DEMO neredeyse bedava kurulur, satışın en pahalı adımı ucuzlar
 */
export const AGIRLIK = {
  eposta: 30,
  shopify: 20,
  haritalikKatalog: 25,
  urunOrtusmesi: 15,
  instagram: 10,
} as const;

/**
 * Haritanın anlamlı olduğu katalog aralığı.
 *
 * Alt uç: bu sayının altında harita boş görünüyor, koku uzayında noktalar
 * birbirine komşu olamıyor. Üst uç: teslim her parfümün elle girilmesini
 * gerektirdiği için üstü tek seferde yapılamıyor (seçkiyle yapılabilir ama
 * o başka bir konuşma).
 */
export const KATALOG_ALT = 15;
export const KATALOG_UST = 150;

/**
 * Demoyu ucuzlatan en az ortak PARFÜM sayısı.
 *
 * ⚠️ Eşik marka değil ÜRÜN üstünde ve bu ölçüldü: marka örtüşmesi 25 olan
 * dükkânda ürün örtüşmesi 4 çıktı, 24 olanda 3. Marka örtüşmesine puan
 * vermek, demo maliyetini yanlış tahmin etmek olurdu.
 */
export const ORTUSME_ESIGI = 5;

export type PuanGirdisi = Pick<
  Lead, 'email' | 'platform' | 'product_count' | 'instagram' | 'urun_ortusmesi'
>;

export interface PuanDokumu {
  readonly toplam: number;
  readonly kalemler: Readonly<Record<keyof typeof AGIRLIK, number>>;
}

export function puanla(lead: PuanGirdisi): PuanDokumu {
  const sayi = lead.product_count;
  const ortusme = lead.urun_ortusmesi;
  const kalemler = {
    eposta: lead.email !== null && lead.email !== '' ? AGIRLIK.eposta : 0,
    /*
      Shopify'ın anlamı da değişti: artık "gömülebilir" olduğu için değil,
      `products.json` sayesinde katalogu OKUNABİLİR olduğu için değerli —
      demo o yüzden ucuz.
    */
    shopify: lead.platform === 'shopify' ? AGIRLIK.shopify : 0,
    haritalikKatalog:
      sayi !== null && sayi >= KATALOG_ALT && sayi <= KATALOG_UST ? AGIRLIK.haritalikKatalog : 0,
    /*
      ⚠️ `null` "ölçülmedi" demek ve puan almıyor. Örtüşme ancak
      `demo-adaylari` komutu koştuktan sonra biliniyor.
    */
    urunOrtusmesi:
      ortusme !== null && ortusme >= ORTUSME_ESIGI ? AGIRLIK.urunOrtusmesi : 0,
    instagram: lead.instagram !== null && lead.instagram !== '' ? AGIRLIK.instagram : 0,
  } as const;

  const toplam = (Object.values(kalemler) as readonly number[]).reduce((a, b) => a + b, 0);
  return { toplam, kalemler };
}
