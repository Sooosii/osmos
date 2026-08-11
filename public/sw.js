/*
  OSMOS service worker — tek işi bildirim.

  Sayfa önbelleği, offline desteği, fetch araya girmesi YOK: çalışan yalnızca
  push olayını sistem bildirimine çevirir ve dokunuşu doğru sayfaya açar.
  Gönderen GitHub Action (`scripts/push-send.ts`); gövde `push-payload.ts`ın
  kurduğu {title, body, url} üçlüsü.

  ⚠️ Kök varlık: `src/proxy.ts`teki ROOT_ASSETS'te satırı var — düşerse adres
  dil önekiyle yeniden yazılır ve çalışan sessizce 404 döner.
  ⚠️ HTTP önbelleği iki yerden kapalı: kayıt `updateViaCache: 'none'` ile
  yapılıyor (`NotifyControl`) ve `next.config.ts` bu dosyaya no-cache basıyor.
  İkisinden biri kalkarsa eski çalışan günlerce takılı kalabilir.
*/

self.addEventListener('push', (event) => {
  if (!event.data) return;

  let message;
  try {
    message = event.data.json();
  } catch {
    return;
  }
  if (!message || typeof message.title !== 'string') return;

  /*
    `url` göreli tutuluyor ve kökle başlamak zorunda: gövde yalnızca kendi
    göndericimizden gelebilir (VAPID) ama depo bir gün ele geçse bile çalışan
    siteden dışarı pencere açmaz.
  */
  const url = typeof message.url === 'string' && message.url.startsWith('/') ? message.url : '/';

  event.waitUntil(
    self.registration.showNotification(message.title, {
      body: typeof message.body === 'string' ? message.body : '',
      icon: '/icon-512',
      data: { url },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const data = event.notification.data;
  const url = data && typeof data.url === 'string' ? data.url : '/';
  event.waitUntil(self.clients.openWindow(url));
});
