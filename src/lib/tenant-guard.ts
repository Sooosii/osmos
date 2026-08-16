import { notFound } from 'next/navigation';
import { activeTenant } from './tenant';

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
