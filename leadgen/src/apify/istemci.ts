/**
 * Apify REST istemcisi — Faz B. YAZILDI, ÇALIŞTIRILMADI.
 *
 * MCP bağlantısı bu oturumda yoktu (alet listesinde `mcp__apify__*` yok,
 * `APIFY_TOKEN` tanımsız), sahip de "önce ücretsiz" dedi. Bu yüzden modül
 * token gelir gelmez çalışacak biçimde duruyor ama boru hattının Faz A'sı
 * ona hiç dokunmuyor.
 *
 * ⚠️ Ağ çağrısı DIŞARIDAN veriliyor (`Getirici`). Sebebi sınama: bütçe
 * kapısının gerçekten kapandığı, tek kuruş harcamadan ve sahte bir
 * getiriciyle ölçülebiliyor.
 */
import { butceKapisi, tahminKur, type Karar, type Tahmin } from './butce.ts';
import type { ActorTanimi } from './actors.ts';

const KOK = 'https://api.apify.com/v2';

export type Getirici = (url: string, secenekler: RequestInit) => Promise<Response>;

export interface CalistirmaSonucu<T> {
  readonly kayitlar: readonly T[];
  readonly gercekMaliyetUsd: number;
  readonly runId: string;
}

export class ApifyIstemcisi {
  readonly #token: string;
  readonly #getir: Getirici;

  constructor(token: string, getir: Getirici = fetch) {
    if (token.trim() === '') throw new Error('APIFY_TOKEN bos — Apify adimi calistirilamaz');
    this.#token = token;
    this.#getir = getir;
  }

  /** Ortamdan kurar; token yoksa `null` döner (patlamaz — Faz A etkilenmesin). */
  static ortamdan(getir: Getirici = fetch): ApifyIstemcisi | null {
    const t = process.env['APIFY_TOKEN'];
    return t === undefined || t.trim() === '' ? null : new ApifyIstemcisi(t, getir);
  }

  /**
   * Ay boyunca harcanan gerçek tutar.
   *
   * ⚠️ Harcamayı `adet × birim fiyat` diye HESAPLAMAK yerine Apify'a soruyoruz.
   * Sebep: hesaplanan sayı bir tahmindir ve tahminle tutulan bir harcama
   * defteri, bütçe kapısının bütün anlamını yok eder. İki koşu arasındaki
   * fark, o koşunun gerçek maliyetidir.
   *
   * Alan adı sürüme göre değişebildiği için birkaç bilinen ad deneniyor;
   * hiçbiri tutmazsa `null` dönüyor ve çağıran tarafa "ölçemedim" diyor —
   * sessizce sıfır yazmıyor.
   */
  async aylikKullanimUsd(): Promise<number | null> {
    const y = await this.#getir(`${KOK}/users/me/usage/monthly`, {
      method: 'GET',
      headers: { authorization: `Bearer ${this.#token}` },
    });
    if (!y.ok) return null;
    const govde = (await y.json()) as { data?: Record<string, unknown> };
    const veri = govde.data ?? {};
    for (const alan of ['totalUsageCreditsUsdAfterVolumeDiscount', 'totalUsageCreditsUsd', 'usageTotalUsd']) {
      const d = veri[alan];
      if (typeof d === 'number' && Number.isFinite(d)) return d;
    }
    return null;
  }

  async #cagir(yol: string, govde: unknown): Promise<unknown> {
    const y = await this.#getir(`${KOK}${yol}`, {
      method: 'POST',
      headers: { authorization: `Bearer ${this.#token}`, 'content-type': 'application/json' },
      body: JSON.stringify(govde),
    });
    if (!y.ok) {
      /*
        ⚠️ Gövde OKUNUYOR. Yalnız durum kodu fırlatıldığında "HTTP 400" diye
        bir mesaj kalıyor ve sebebi bulmak için elle curl atmak gerekiyordu.
        Apify hatayı açıkça yazıyor ("Field input.country must be equal to
        one of…"); onu saklamak ayıklamayı iki katına çıkarıyor.
      */
      const govdeMetni = await y.text().catch(() => '');
      throw new Error(`Apify ${yol} → HTTP ${y.status}: ${govdeMetni.slice(0, 400)}`);
    }
    return y.json();
  }

  /**
   * Actor'ı çalıştırır ve kayıtları döndürür.
   *
   * ⚠️ `maxItems` HER ZAMAN gönderiliyor. Olay başı ücretlendirmede üst
   * sınırsız bir çalıştırma, bütçenin tamamını tek istekte yakabilir.
   */
  async calistir<T>(
    actorId: string,
    girdi: Record<string, unknown>,
    maxItems: number,
    tavanUsd?: number,
  ): Promise<CalistirmaSonucu<T>> {
    /*
      ⚠️ İKİ ayrı sınır, ikisi de gerekli.

      `maxItems` kaç kayıt isteneceğini söylüyor ama olay başı ücretlendirmede
      bir kaydın kaça mal olduğunu BİZ tahmin ediyoruz. Tahmin şaşarsa
      (sondada şaştı: ilan edilen fiyatla ölçülen tutmadı) bütçe kapısı da
      şaşar, çünkü o da aynı tahmine bakıyor.

      `maxTotalChargeUsd` bu zinciri kırıyor: sınırı APIFY uyguluyor. Tahminim
      yanlış olsa bile platform o tutarın üstüne çıkmadan koşuyu durduruyor.
      Ücretsiz planda kredi zaten bitince kesiliyor ama bu, tek bir koşunun
      bütün ayı yakmasını da engelliyor.
    */
    /*
      ⚠️ Apify tavan icin bir ALT sinir dayatiyor: $0.50'nin altindaki
      degeri "max-total-charge-usd-below-minimum" diye reddediyor. Tavan bir
      HARCAMA degil, ust sinir — dusuk tutmak koruma degil hata uretiyordu.
    */
    const EN_AZ_TAVAN = 0.5;
    const tavan = tavanUsd === undefined
      ? ''
      : `&maxTotalChargeUsd=${Math.max(tavanUsd, EN_AZ_TAVAN).toFixed(4)}`;
    const yol = `/acts/${actorId.replace('/', '~')}/run-sync-get-dataset-items?maxItems=${maxItems}${tavan}`;
    const veri = await this.#cagir(yol, girdi);
    const kayitlar = Array.isArray(veri) ? (veri as T[]) : [];
    return { kayitlar, gercekMaliyetUsd: 0, runId: `${actorId}@${Date.now()}` };
  }
}

export interface SondaRaporu {
  readonly tanim: ActorTanimi;
  readonly sondaAdedi: number;
  readonly tamTahmin: Tahmin;
  readonly karar: Karar;
}

/**
 * Sahibin kuralının uygulanışı: önce sonda, sonra tahmin, sonra SOR.
 *
 * Bu fonksiyon tam çalıştırmayı **başlatmaz** — yalnız kararı üretir.
 * Başlatma kararı sahibin, kodun değil.
 */
export function sondadanTahmin(
  tanim: ActorTanimi,
  sondaAdedi: number,
  hedefAdet: number,
  aylikHarcanan: number,
  onaylandi: boolean,
): SondaRaporu {
  const tamTahmin = tahminKur(tanim.id, tanim.birim, hedefAdet, tanim.birimUsd, tanim.sabitUsd);
  return { tanim, sondaAdedi, tamTahmin, karar: butceKapisi(tamTahmin, aylikHarcanan, onaylandi) };
}
