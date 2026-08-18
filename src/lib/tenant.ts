import { OSMOS_TENANT_ID, TENANTS, type Tenant } from '@/data/tenants/registry';
import { TENANT_ID } from './tenant-id';
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
  ⚠️ Ortam okuması artık `lib/tenant-id.ts`te ve sebebi bir ithal döngüsü:
  `locale.ts` varsayılan dili kiracıdan alıyor, bu dosya da `locale.ts`ten
  `LOCALES` okuyor. Okuma ikisinin de altına inince zincir düzleşti.
  Kalıbın neden tam ad yazılmak zorunda olduğu orada yazılı.
*/

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
 * ⚠️⚠️ **Sıra artık KIRACININ yazdığı sıra — ve bu kural bir kez tersine
 * çevrildi.** Eskiden `LOCALES` sırası kazanıyordu ve gerekçesi şuydu:
 * "varsayılan dilin ilk sırada kalması `stripLocale`/`withLocale` davranışına
 * bağlı." O gerekçe doğruydu ama varsayılan dil **sabit `'en'`** olduğu sürece.
 * Artık varsayılan dil kiracıdan geliyor (`locale.ts`), yani ilişki tersine
 * döndü: **ilk sırada yazılan dil varsayılan olan dildir.**
 *
 * `locales: ['tr', 'en']` yazan bir kiracıda `/` Türkçe açılıyor ve `/en/...`
 * önekli duruyor. Eski sıralama bunu sessizce bozardı: kiracı Türkçe isterdi,
 * site Ingilizce açılırdı ve kimse sebebini `dilleriSuz`ta aramazdı.
 */
export function dilleriSuz(tenant: Tenant, hepsi: readonly Locale[] = LOCALES): readonly Locale[] {
  const izinli = tenant.locales;
  if (izinli === undefined) return hepsi;
  const suzulmus = izinli.filter((l) => hepsi.includes(l));
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
