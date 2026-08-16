/**
 * Boru hattının ortak tipleri.
 *
 * Tek yerde durmalarının sebebi `db.ts` ile dışa aktarıcıların aynı sütun
 * adlarını iki ayrı yerde yazmasını engellemek: sütun adı kayarsa SQLite
 * sessizce `undefined` döndürür ve CSV boş sütunla çıkar — bu hata ancak
 * çıktıya gözle bakınca fark edilir.
 */

/** Dükkânın üstünde çalıştığı altyapı. `diger` = ölçüldü ama tanınmadı. */
export type Platform = 'shopify' | 'woocommerce' | 'diger' | 'bilinmiyor';

/** Sahibin üç hedef segmenti. */
export type Segment = 'decant' | 'butik-eticaret' | 'nis-parfum-evi' | 'bilinmiyor';

/** Adayın boru hattındaki durumu. */
export type Durum = 'yeni' | 'zenginlestirildi' | 'ulasilamadi' | 'elendi';

/**
 * Üçlü mantık: `null` "bakılmadı", `false` "bakıldı ve yok" demek.
 *
 * ⚠️ Bu ayrım puanlamanın kalbi. "Benzer ürün özelliği YOK" +20 puan
 * getiriyor; ölçülemeyen bir siteye o puanı vermek, ulaşılamayan dükkânı
 * listenin tepesine taşırdı.
 */
export type UclyMantik = boolean | null;

export interface Lead {
  readonly id?: number;
  readonly domain: string;
  readonly shop_name: string | null;
  readonly platform: Platform;
  readonly email: string | null;
  readonly instagram: string | null;
  readonly country: string | null;
  readonly product_count: number | null;
  readonly has_similar_feature: UclyMantik;
  readonly segment: Segment;
  /** Ölçek — BİLGİ amaçlı. Sahibin kararı: kimse elenmiyor. */
  readonly olcek: string;
  /**
   * Hedefin sattığı markalardan kaçı bizim kataloğumuzda var.
   *
   * ⚠️ `null` "ölçülmedi" demek, "sıfır" değil. Örtüşme ancak
   * `demo-adaylari` komutu koştuktan sonra biliniyor ve puanlama bu ayrımı
   * gözetiyor — ölçülmemiş bir hedefe örtüşme puanı verilmiyor.
   */
  readonly marka_ortusmesi: number | null;
  readonly score: number;
  readonly durum: Durum;
  readonly source: string;
  readonly notes: string | null;
  /** Tohumda görülen asıl adres — alt alan adı kırpılmış olabilir. */
  readonly seed_url: string | null;
}

/** Bir iddianın ham dayanağı. Kanıtsız cümle yazılmıyor. */
export interface Evidence {
  readonly lead_id: number;
  readonly kind: string;
  readonly url: string;
  readonly snippet: string;
  readonly http_status: number | null;
  readonly fetched_at: string;
}

/** Apify harcama defteri satırı (Faz B). */
export interface Spend {
  readonly run_id: string;
  readonly actor: string;
  readonly unit: string;
  readonly units: number;
  readonly usd: number;
  readonly at: string;
}
