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
 *
 * ⚠️ Bu yüzden **hiçbir yerde çıplak `sessionStorage` çağrısı olmamalı**:
 * Safari "bütün çerezleri engelle" açıkken `window.sessionStorage`a **erişmek
 * bile** `SecurityError` fırlatıyor.
 *
 * `use-approach-scene.ts` çıplak çağırıyordu ama **kurulu bir tuzaktı, patlamış
 * bir mayın değil**: iki çağrı da `APPROACH_ONCE` sabitinin arkasındaydı ve o
 * sabit bugün `false`, yani satırlar hiç çalışmıyordu. Tehlike o sabiti bir gün
 * `true` yapanın hiçbir uyarı görmemesiydi — orası sitenin **giriş kapısı** ve
 * fırlayan bir hata kapıyı kırardı. Şimdi ikisi de bu güvenli yoldan geçiyor;
 * bir sınama da çıplak çağrıları denetliyor.
 */
export function oturumOku(
  storage: SessionLike | null | undefined,
  key: string,
): string | null {
  if (!storage) return null;
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

export function oturumYaz(
  storage: SessionLike | null | undefined,
  key: string,
  value: string,
): void {
  if (!storage) return;
  try {
    storage.setItem(key, value);
  } catch {
    // Yazılamadıysa eşik bir daha görünür; sayfanın açılmasından daha önemsiz.
  }
}

export function acilistanGecildi(storage: SessionLike | null | undefined): boolean {
  return oturumOku(storage, ACILIS_SEEN_KEY) === '1';
}

export function acilisiIsaretle(storage: SessionLike | null | undefined): void {
  oturumYaz(storage, ACILIS_SEEN_KEY, '1');
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
