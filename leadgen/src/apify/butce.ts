/**
 * Bütçe kapısı — sahibin kuralının koda çevrilmiş hali.
 *
 * Sahibin cümlesi: *"Aylık $5 ücretsiz krediyi aşacak hiçbir işi onayım
 * olmadan başlatma."*
 *
 * ⚠️ Saf fonksiyon, ağ yok. Böylece "tavanı aşan iş reddediliyor mu" sorusu
 * TEK KURUŞ harcamadan sınanabiliyor. Bu mantık istemcinin içine gömülseydi
 * sınamanın tek yolu gerçekten para harcamak olurdu.
 */

/** Apify Free planının aylık dahil kullanımı. Devretmiyor, ay sonunda yanıyor. */
export const AYLIK_TAVAN_USD = 5.00;
/** Tek bir çalıştırmanın aşamayacağı tutar — bütçe tek işte bitmesin. */
export const CALISTIRMA_TAVANI_USD = 1.50;
/** Bu tutarın altındaki sonda çalıştırmaları onay beklemiyor. */
export const SONDA_TAVANI_USD = 0.05;

export interface Tahmin {
  readonly actor: string;
  readonly birim: string;
  readonly adet: number;
  readonly birimUsd: number;
  readonly toplamUsd: number;
}

export type Karar =
  | { readonly izin: 'evet'; readonly sebep: string }
  | { readonly izin: 'onay-gerek'; readonly sebep: string }
  | { readonly izin: 'hayir'; readonly sebep: string };

/** Birim fiyattan tahmin kurar. */
export function tahminKur(actor: string, birim: string, adet: number, birimUsd: number, sabitUsd = 0): Tahmin {
  return { actor, birim, adet, birimUsd, toplamUsd: Number((adet * birimUsd + sabitUsd).toFixed(4)) };
}

export function butceKapisi(t: Tahmin, aylikHarcanan: number, onaylandi: boolean): Karar {
  const kalan = AYLIK_TAVAN_USD - aylikHarcanan;

  if (t.toplamUsd > CALISTIRMA_TAVANI_USD) {
    /*
      ⚠️ Onay bayrağı bu kapıyı AÇMIYOR. Sebep: bayrak bir kez yazılıp komut
      geçmişinden tekrar tekrar çağrılabilir. Tek çalıştırma tavanı, yanlışlıkla
      eklenmiş bir sıfırın bütün aylık krediyi yakmasına karşı duruyor.
    */
    return {
      izin: 'hayir',
      sebep: `tek calistirma tavani asildi: $${t.toplamUsd.toFixed(2)} > $${CALISTIRMA_TAVANI_USD.toFixed(2)}`,
    };
  }
  if (t.toplamUsd > kalan) {
    return {
      izin: 'hayir',
      sebep: `aylik kredi yetmiyor: $${t.toplamUsd.toFixed(2)} gerekiyor, $${kalan.toFixed(2)} kaldi`,
    };
  }
  if (t.toplamUsd <= SONDA_TAVANI_USD) {
    return { izin: 'evet', sebep: `sonda ($${t.toplamUsd.toFixed(4)}) — onay beklemiyor` };
  }
  if (!onaylandi) {
    return {
      izin: 'onay-gerek',
      sebep: `${t.actor}: ${t.adet} ${t.birim} ≈ $${t.toplamUsd.toFixed(2)} · kalan kredi $${kalan.toFixed(2)}`,
    };
  }
  return { izin: 'evet', sebep: `onaylandi, $${t.toplamUsd.toFixed(2)}` };
}
