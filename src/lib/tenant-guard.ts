import { notFound } from 'next/navigation';
import { activeTenant } from './tenant';
import { OSMOS_TENANT_ID } from '@/data/tenants/registry';

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
