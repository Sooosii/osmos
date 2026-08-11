/**
 * `PushManager.subscribe` sunucu anahtarını bayt dizisi istiyor; VAPID açık
 * anahtarı ise base64url dize olarak taşınıyor (`NEXT_PUBLIC_VAPID_PUBLIC_KEY`).
 * Çeviri bu kadar: dolguyu tamamla, url-güvenli karakterleri düz base64'e
 * döndür, baytlara aç. Dizeyi doğrudan geçmek Chromium'da çalışıyor ama her
 * tarayıcıda değil — baytlara çevirmek taşınabilir yol.
 */
export function vapidKeyBytes(base64url: string): Uint8Array {
  const padding = '='.repeat((4 - (base64url.length % 4)) % 4);
  const base64 = (base64url + padding).replaceAll('-', '+').replaceAll('_', '/');
  const raw = atob(base64);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) {
    bytes[i] = raw.charCodeAt(i);
  }
  return bytes;
}
