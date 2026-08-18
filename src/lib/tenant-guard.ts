import { notFound } from 'next/navigation';
import { activeTenant } from './tenant';
import { OSMOS_TENANT_ID, type TenantFeatures } from '@/data/tenants/registry';

/**
 * Hesap dünyasının rota kapısı.
 *
 * ⚠️ **Bağlantıyı gizlemek yetmez, rotanın kendisi kapanmak zorunda.** Kiracıda
 * `SignInLink` çizilmiyor ama adresler yerinde duruyor: `/signin`, `/settings`,
 * `/studio`, `/u/...`. Kapatılmasalardı müşterinin alan adı altında OSMOS'un
 * giriş ekranı ve profil sayfaları açılırdı — üstelik sessizce, çünkü siteye
 * bakan hiç kimse o adresleri denemez. Arama motoru dener.
 *
 * `notFound()` statik üretimde de çalışıyor: sayfa derlemede 404'e düşüyor,
 * çalışma anında bir denetim maliyeti kalmıyor.
 *
 * Ayrı dosyada çünkü `tenant.ts` saf ve `next/navigation` tanımıyor; onu içeri
 * alan istemci bileşenleri de var (`SignInLink`).
 */
export function requireAccounts(): void {
  if (!activeTenant().features.accounts) notFound();
}

/**
 * Taslak ekranların rota kapısı — `/evolution` ve `/space`.
 *
 * ⚠️ **Bunlar iç doğrulama araçları ve kiracıda hiç var olmamalı.** Ölçüldü
 * (2026-08-17, yayın öncesi denetim): kiracı derlemesinde ikisi de 200
 * dönüyordu ve sekme başlıkları `Evolution draft · Nischengold` diyordu —
 * müşteriye satılan sitede, onun markasıyla, kendini "taslak" ilan eden bir
 * sayfa. Ana sitede duruyorlar (sahibin kararı: motor değişirse önce oraya
 * bakılıyor), orada `noindex` ve sitemap dışılar.
 *
 * ⚠️ **Bu kapı tek başına sızıntıyı KAPATMIYOR — ölçüldü, varsayılmadı.**
 * `/evolution`ın istemci bileşeni katalogu çekiyordu; rota 404'e alınınca
 * *hiçbir kiracı sayfası* o parçayı yüklemez oldu, ama parça yine üretildi ve
 * adresiyle hâlâ iniyordu (HTTP 200, 99.507 bayt). Sızıntıyı asıl kapatan şey
 * istemci zincirlerinin kesilmesi (`signatureOf`, `perfumesOf`,
 * `composition-nearest.ts`, `top-four-sabit.ts`) ve onu
 * `kiraci-sizinti.test.ts` tutuyor. Buradaki kapının işi ayrı ve kendi başına
 * yeterli bir sebep: **müşterinin markasıyla "taslak" yazan bir sayfa
 * olmamalı.**
 */
export function requireMainSite(): void {
  if (activeTenant().id !== OSMOS_TENANT_ID) notFound();
}

/**
 * Kapalı özelliğin **ucu** — sayfa değil, `/api/...` işleyicisi.
 *
 * ⚠️ **Neden `notFound()` değil:** yukarıdaki iki kapı sayfalar için ve
 * `notFound()` bir EKRAN çiziyor. Bir uç ekran çizmemeli — `fetch` eden
 * istemciye HTML gövdesi dönmek, hata ayıklarken yanıltıcı ve boşuna bayt.
 * Bu yüzden kapı gövdesiz bir `Response` veriyor ve çağıran onu döndürüyor.
 *
 * ⚠️ **404, 403 değil.** Deponun duran kuralı bu: 403 "burada bir şey var ama
 * giremezsin" der; oysa müşterinin sitesinde o özellik **yok**. Kapalı
 * özelliğin sayfaları da 404 dönüyor (`requireAccounts`), uç da aynı cümleyi
 * kurmalı.
 *
 * ⚠️ **Sonucu `null` olduğunda çağıran DEVAM EDER.** Kullanım kalıbı:
 *
 *     const kapali = ucKapali('accounts');
 *     if (kapali) return kapali;
 *
 * Kapının işleyicinin **ilk satırı** olması gerekiyor: `/api/auth`ta
 * `getAuth()` kiracıda `DATABASE_URL` olmadan patlıyor, yani kapı geç
 * çalışırsa müşterinin alan adında 404 değil **500** çıkar.
 *
 * ⚠️ Bütün uçlar kapanmıyor ve kapanmamalı: `/api/perfume-search` kiracıda
 * ÇALIŞIYOR (arama kutusu çerçevede ve uzayda çiziliyor) ve kiracı
 * derlemesinde yalnız kiracının kendi katalogunu basıyor. Hangi ucun neden
 * açık olduğunu `src/app/api/kiraci-uclari.test.ts` yazılı tutuyor.
 */
export function ucKapali(feature: keyof TenantFeatures): Response | null {
  if (activeTenant().features[feature]) return null;
  return new Response(null, { status: 404 });
}
