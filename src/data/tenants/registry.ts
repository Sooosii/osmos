import type { Localized } from '../types';

/**
 * Kiracı kaydı — B2B'nin çekirdeği.
 *
 * OSMOS artık tek bir siteden çok, aynı motoru paylaşan sitelerden biri. Bir
 * parfüm işletmesine satılan şey bu: kendi katalogu, kendi markası, kendi
 * adresi; altında değişmeyen aynı harita, aynı benzerlik motoru, aynı 158
 * notalık ansiklopedi.
 *
 * ⚠️ **Tek depo, kiracı başına bir derleme.** Çok kiracılı veritabanı ya da
 * yönetim paneli YOK ve bilerek yok: veri bugün olduğu gibi derleme zamanında
 * statik duruyor, kiracı sitesi de 500+ statik sayfa olarak çıkıyor. Aktif
 * kiracıyı `NEXT_PUBLIC_TENANT` seçiyor — mevcut `NEXT_PUBLIC_ACCOUNTS_ENABLED`
 * ve `NEXT_PUBLIC_VAPID_PUBLIC_KEY` bayraklarının kurduğu desenin aynısı.
 *
 * ⚠️ **Bilinmeyen kimlik PATLAR, OSMOS'a düşmez** (`lib/tenant.ts`). Sessiz
 * geri düşüş, müşterinin alan adı altında OSMOS'un katalogunu yayına vermek
 * demekti — bu deponun en sevmediği hata sınıfı: site çalışır, yanlış çalışır.
 */
export interface TenantFeatures {
  /**
   * Hesap dünyasının tamamı: giriş, Top 4, raflar, burun raporu, stüdyo,
   * Patron. Kiracıda kapalı — müşterinin ziyaretçisinden hesap açmasını
   * istemek onun işini değil bizimkini büyütür.
   *
   * ⚠️ Kapalıyken ilgili **rotalar da 404 dönmek zorunda**. Yalnızca bağlantıyı
   * gizlemek yetmez: adres elde kalır, arama motoru bulur ve müşterinin
   * sitesinde OSMOS'un giriş ekranı açılır.
   */
  readonly accounts: boolean;
  /** Web Push aboneliği. Kiracıda kapalı: bildirimi kim, ne zaman gönderecek belli değil. */
  readonly notify: boolean;
  /** RSS beslemesi. */
  readonly feed: boolean;
}

export interface Tenant {
  /** `NEXT_PUBLIC_TENANT` değeri. Kalıcı kimlik, kebab-case. */
  readonly id: string;
  /** Çerçevede ve künyelerde görünen kısa marka işareti. `t.site.name`i ezer. */
  readonly name: string;
  /** Sekme başlığı ve paylaşım kartı. */
  readonly title: Localized;
  readonly description: Localized;
  readonly features: TenantFeatures;
  /**
   * Arama motorlarına açık mı.
   *
   * ⚠️ Demo kiracılarda **false** olmak zorunda: bir işletmenin markasıyla
   * kurulmuş, onayı alınmamış bir çalışma arama sonuçlarında görünmemeli.
   * `robots.ts` ve `sitemap.ts` bunu okuyor.
   */
  readonly indexable: boolean;
}

/** Ana site. Değişken yokken bu seçilir ve bugünkü OSMOS birebir çıkar. */
export const OSMOS_TENANT_ID = 'osmos';

const OSMOS: Tenant = {
  id: OSMOS_TENANT_ID,
  name: 'OSMOS',
  title: { en: 'OSMOS', tr: 'OSMOS' },
  description: {
    en: 'The scent universe — a map of niche perfume.',
    tr: 'Koku evreni — niş parfümün haritası.',
  },
  features: { accounts: true, notify: true, feed: true },
  indexable: true,
};

/**
 * SELVA — Faz 1'in doğrulama kiracısı.
 *
 * ⚠️ **Uydurma bir işletme, ama uydurma veri YOK.** Katalogu var olan
 * parfümlerden bir seçki (`tenants/demo-selva/catalog.ts`); markalar, notalar,
 * yıllar ve küratör cümleleri gerçek. Bu depoda veri uydurulmaz kuralı burada
 * da geçerli — kurgusal olan yalnızca dükkanın adı.
 *
 * Gerçek bir hedefin adıyla kurulacak demolar bunun kopyası olacak, tek farkla:
 * `retailers` alanı müşterinin kendi ürün sayfalarıyla dolacak. Burada boş,
 * çünkü olmayan bir dükkanın ürün adresi de yok ve `retailers.test.ts`
 * uydurma adresi zaten reddediyor.
 */
const DEMO_SELVA: Tenant = {
  id: 'demo-selva',
  name: 'SELVA',
  title: { en: 'SELVA — scent map', tr: 'SELVA — koku haritasi' },
  description: {
    en: 'The SELVA selection, drawn as a map of scent.',
    tr: 'SELVA seckisi, koku haritasi olarak cizildi.',
  },
  features: { accounts: false, notify: false, feed: false },
  indexable: false,
};

export const TENANTS: readonly Tenant[] = [OSMOS, DEMO_SELVA];
