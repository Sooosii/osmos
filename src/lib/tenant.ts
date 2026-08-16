import { OSMOS_TENANT_ID, TENANTS, type Tenant } from '@/data/tenants/registry';
import { LOCALES, type Locale } from '@/i18n/locale';

/**
 * Aktif kiracıyı çözen katman.
 *
 * Saf yarısı (`resolveTenant`) parametreyle çalışıyor ve sınanabiliyor; ortama
 * bakan yarısı (`activeTenant`) tek satır. Bu ayrım `locale.ts` ve
 * `space-feel-url.ts` ile aynı gerekçeye sahip: ortamı okuyan bir modül
 * sınanamaz, saf olan sınanır.
 */

/*
  ⚠️ **Tam ad kalıp olarak yazılmak ZORUNDA.** Next `NEXT_PUBLIC_*`i derlemede
  satıra gömüyor ve bunu metinsel eşleşmeyle yapıyor: `process.env[key]` ya da
  yeniden adlandırılmış bir okuma gömülmez, tarayıcıda `undefined` çıkar ve
  kiracı sitesi sessizce OSMOS'a döner. `NotifyControl` aynı uyarıyı taşıyor.
*/
const TENANT_ID = process.env.NEXT_PUBLIC_TENANT?.trim() || OSMOS_TENANT_ID;

/**
 * Kimlikten kiracıya.
 *
 * ⚠️ **Bilinmeyen kimlik PATLAR.** Varsayılana düşmek cazip görünüyor ama
 * sonucu şu: değişkende bir harf hatası olan bir müşteri derlemesi sorunsuz
 * tamamlanır, yayına çıkar ve müşterinin alan adı altında **OSMOS'un
 * katalogunu** gösterir. Derleme zamanında gürültüyle durmak, canlıda sessizce
 * yanlış çalışmaktan iyidir.
 */
export function resolveTenant(id: string, tenants: readonly Tenant[] = TENANTS): Tenant {
  const found = tenants.find((tenant) => tenant.id === id);
  if (!found) {
    const known = tenants.map((tenant) => tenant.id).join(', ');
    throw new Error(`Bilinmeyen kiracı: ${id}. Tanımlı olanlar: ${known}`);
  }
  return found;
}

export function activeTenant(): Tenant {
  return resolveTenant(TENANT_ID);
}

/** Ana site mi — kiracıya özel dallanmaları okunur kılmak için. */
export function isOsmos(): boolean {
  return TENANT_ID === OSMOS_TENANT_ID;
}

/**
 * Kiracının bildirdiği dilleri süzer — SAF yarı, sınanabilir.
 *
 * ⚠️ `LOCALES` yerine geçmiyor, onu SÜZÜYOR. `LOCALES` sitenin desteklediği
 * dillerin evreni ve `Locale` tipinin kaynağı; buradan dönen liste yalnız
 * hangi sayfaların basılacağını söylüyor. Kiracı bir dil bildirmezse hepsi
 * üretiliyor — OSMOS ve eski kiracılar etkilenmiyor.
 *
 * ⚠️ Sıra `LOCALES`ten geliyor, kiracının yazdığı sıradan değil: varsayılan
 * dilin ilk sırada kalması `stripLocale`/`withLocale` davranışına bağlı.
 */
export function dilleriSuz(tenant: Tenant, hepsi: readonly Locale[] = LOCALES): readonly Locale[] {
  const izinli = tenant.locales;
  if (izinli === undefined) return hepsi;
  const suzulmus = hepsi.filter((l) => izinli.includes(l));
  /*
    Boş liste bir yazım hatasıdır ve sessizce dilsiz bir site üretirdi.
    Patlamak, hiç sayfası olmayan bir derlemeyi müşteriye yollamaktan iyidir.
  */
  if (suzulmus.length === 0) {
    throw new Error(`Kiracının hiçbir geçerli dili yok: ${tenant.id}`);
  }
  return suzulmus;
}

/** Bu derlemede üretilecek diller — ortama bakan yarı. */
export function aktifDiller(): readonly Locale[] {
  return dilleriSuz(activeTenant());
}
