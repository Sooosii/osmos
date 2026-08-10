/**
 * Açılış kapısından bu oturumda geçildi mi — saf modül.
 *
 * Kapı (`Acilis`: astronot → perde) bir eşik, ve `use-approach-scene.ts`in
 * yazdığı kural burada da geçerli: *"sahne bir eşik, ama tanıdık bir yere dönen
 * için eşik yoktur."* O kural şimdiye kadar yalnızca `?mark=` ile işliyordu —
 * parfüm sayfası dönüş bağlantısında onu taşıyor, **nota sayfası düz `/`'e
 * dönüyor**. Sahip ekranda yakaladı: notadan uzaya dönünce kapı baştan
 * oynuyordu.
 *
 * Bayrak adresle değil oturumla taşınıyor, çünkü dönüş yolu üç farklı yerden
 * geliyor (nota sayfası, parfüm sayfası, tarayıcının geri tuşu) ve hepsine ayrı
 * parametre iliştirmek her yeni bağlantıda unutulacak bir borç olurdu. Oturum
 * bitince — sekme kapanınca — kapı yeniden kapı.
 *
 * Depo parametre olarak alınıyor: modül `sessionStorage`ı kendi aramıyor, o
 * yüzden sunucuda da, sınamada da güvenle çağrılabiliyor.
 */

export const ACILIS_SEEN_KEY = 'osmos:acilis-gecildi';

/** `Storage`ın kullanılan yüzü — sınamada iki satırlık bir sahte yetiyor. */
export interface SessionLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

/**
 * Depoya erişim sessizce yutuluyor.
 *
 * `sessionStorage` her ortamda yok ve her yerde yazılabilir değil: gizli
 * pencerede ve üçüncü taraf çerezleri kapalıyken okuma/yazma **fırlatabiliyor**.
 * Fırlatırsa doğru davranış kapıyı göstermek — eşik iki kez görünür, ama sayfa
 * açılır. Ters tercih (hatayı yaymak) açılışı tamamen kırardı.
 */
function safeGet(storage: SessionLike | null | undefined, key: string): string | null {
  if (!storage) return null;
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

export function acilistanGecildi(storage: SessionLike | null | undefined): boolean {
  return safeGet(storage, ACILIS_SEEN_KEY) === '1';
}

export function acilisiIsaretle(storage: SessionLike | null | undefined): void {
  if (!storage) return;
  try {
    storage.setItem(ACILIS_SEEN_KEY, '1');
  } catch {
    // Yazılamadıysa kapı bir daha görünür; sayfanın açılmasından daha önemsiz.
  }
}

/** Tarayıcıdaki depo — sunucuda `undefined`, çağıranlar bunu tolere ediyor. */
export function oturumDeposu(): SessionLike | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}
