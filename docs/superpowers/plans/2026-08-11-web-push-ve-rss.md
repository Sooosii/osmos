# Web Push + RSS — uygulama planı

> Spec: `docs/superpowers/specs/2026-08-11-web-push-ve-rss-design.md`
> (kararlar + reddedilenler orada; burası "nasıl" ve sıra).
> Para yol haritasının ② adımı; sahip planı onayladı (2026-08-11).

**Mimari özet:** Site yalnızca abone kaydı tutar (`/api/push` — sitenin ilk
sunucu parçası, Upstash Redis'e SDK'sız REST). Gönderen **GitHub Action**:
parfüm verisi değişip master'a girince Redis'teki "duyurulmuşlar" kümesiyle
farkı bulur, abonelere kendi dilinde yollar. **VAPID özel anahtarı sitenin
hiçbir yerinde durmaz** — yalnızca GitHub secrets. RSS tamamen statik.

## Görevler (hepsi TDD: önce sınama, kırmızı görülür, sonra uygulama)

1. **RSS** — `src/lib/feed.ts` saf üretici (`buildFeedXml`: XML kaçışı, veri
   sırasının tersi, `guid` = kanonik adres, tarih alanı bilerek yok,
   `atom:link rel="self"`) + `src/app/feed.xml/route.ts`
   (`dynamic = 'force-static'`) + `ROOT_ASSETS` satırı + otokeşif.
   ⚠️ Uygulamada öğrenildi: otokeşif bağlantısı düzene KONULAMAZ — altı
   sayfanın altısı kendi `alternates`ını tanımlıyor ve çocuğun bloğu düzenin
   `types`ını komple eziyor. Ortak yardımcı doğdu: `pageAlternates`
   (`site-url.ts`), altı sayfa ona bağlandı.
2. **Sözlük + metin** — `notify` bölümü (en/tr; `Dict` tipi TR'yi zorlar) ve
   `src/lib/push-payload.ts`: `pushMessage(perfume, locale)` → `{title, body,
   url}`; `url` göreli, `withLocale` ile. Sınama 52 parfümü iki dilde noktalı
   büyük İ için tarar.
3. **Doğrulama** — `src/lib/push-subscription.ts`: `parseSubscription` (https
   endpoint ≤2000, base64url anahtarlar ≤512, `isLocale` dil) +
   `parseEndpoint` (DELETE gövdesi için, aynı sınırlar).
4. **Depo** — `src/lib/push-store.ts`: beş Redis komutu tek `fetch`
   sarmalayıcısında; env iki adla okunur (`KV_REST_API_*` ↔
   `UPSTASH_REDIS_REST_*`); env yokken üretimde "hazır değil", dev/test'te
   bellek yolu. `listSubscriptions`/`announcedIds`/`markAnnounced` gönderici
   ile paylaşılır.
5. **Uç** — `src/app/api/push/route.ts`: POST 204/400/413/503, DELETE 204;
   düz `Request` alır, vitest'te sunucusuz sınanır; hata gövdeleri boş.
6. **Service worker** — `public/sw.js` (yalnızca push + notificationclick;
   `url` kökle başlamak zorunda) + `next.config.ts` `headers()` `/sw.js`e
   no-cache + `sinirlar.test.ts`e kaynak denetimleri.
7. **Düğme** — `src/lib/push-client.ts` (`vapidKeyBytes`) +
   `NotifyControl.tsx`: durumlar hidden/idle/busy/on/denied; izin YALNIZCA
   tıklamada; SW mount'ta kurulmaz (`getRegistration` okur, `register` ilk
   aboneliğe kalır); POST düşerse tarayıcı aboneliği geri alınır. Yerleşim:
   `ScreenFrame` meta kümesi + `SpaceOverlays` sağ üst (`switchRef` kapsıyor,
   `inert` ikisini birden tutuyor).
8. **Gönderici** — devDeps `web-push`/`@types/web-push`/`tsx`;
   `scripts/push-send.ts`: announced farkı, ilk çalışmada tohum, 404/410
   budama, `PUSH_TEST_MESSAGE` deneme kipi, `--dry-run`.
   `.github/workflows/push-notify.yml`: master + veri yolları
   (⚠️ `perfume-sets/**` dahil — veri bölünmüş dosyalarda yaşıyor,
   `perfumes.ts` toplayıcı nadiren değişir) + `workflow_dispatch(message)`.
   ⚠️ Betik depo env'i yoksa DURUR: bellek yolu Action'da sessiz bir
   "0 abone" başarısı üretirdi.
9. **Belgeler** — README (kanallar, sunucu parçası cümlesi, env tablosu),
   `.env.example`, bu plan.
10. **Yerel demo** — geçici VAPID çifti `.env.local`e; abone ol → DevTools
    push simülasyonu → bildirim + doğru sayfa. Düğme adayları ekranda sahibe.
11. **Güvenlik + doğrulama** — ECC kontrol listesi; `npm test` + lint +
    üretim derlemesi. Master'a merge ayrı izinle.

## Sahibin kurulum işleri

Spec'in ③ tablosu: Upstash for Redis (Vercel Marketplace) + VAPID çifti
üret + Vercel env (`NEXT_PUBLIC_VAPID_PUBLIC_KEY`) + GitHub secrets (beş ad).
Vercel'deki açık anahtar ile GitHub'daki aynı çift olmak zorunda.

## Doğrulama

- Sınamalar: feed (kaçış/sıra/guid/tarihsizlik), parse (kabul/ret), store
  (komut biçimi + bellek döngüsü), uç (204/400/413/503), payload (iki dil +
  İ taraması), sw kaynak denetimi, `ROOT_ASSETS` üç yeni satır.
- `/feed.xml` W3C doğrulayıcısından; 52 madde, mutlak kanonik bağlantılar.
- Yerel uçtan uca: abone → simüle push → bildirim → doğru sayfa.
- Kurulum sonrası canlı: abone → Action `message` ile elle → cihaza düşer.
- Yeni parfüm provası: tohumlu kümeyle parfüm ekle → yalnız o duyurulur.
