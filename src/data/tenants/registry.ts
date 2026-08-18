import type { Localized } from '../types';
import type { Locale } from '@/i18n/locale';

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
  /**
   * Bu kiracı için ÜRETİLECEK diller. Verilmezse sitenin tamamı.
   *
   * ⚠️ Bir müşteriye konuşmadığı dilde sekme göstermek, sitenin ona
   * hazırlanmadığını söyler. Nischengold Konstanz'da, tek dilli Almanca
   * satıyor (para birimi CHF, `/en` sürümü bile 404) — Türkçe bir sekme
   * orada özensizlik olarak okunur.
   *
   * ⚠️ Bu alan **tip evrenini değiştirmiyor**: `LOCALES` sitenin
   * desteklediği dillerin listesi olarak duruyor, buradaki alt küme yalnız
   * hangi sayfaların üretileceğini söylüyor.
   */
  readonly locales?: readonly Locale[];
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
  /*
    ⚠️ **Doğrulama kiracısı olmasının asıl işi burada.** SELVA iki dilli ve
    **Türkçesi önce**: `/` Türkçe açılıyor, `/en/...` önekli duruyor. Bu diziliş
    kiracının varsayılan dilini gerçekten sınayan tek yer — Nischengold tek dilli
    (`['en']`) olduğu için orada eski davranışla yenisi ayırt edilemiyor.

    Türk dükkânları listede 45 hesap ve teslim için bu şart: bir Türk dükkânının
    sitesi `/` adresinde Ingilizce açılamaz.
  */
  locales: ['tr', 'en'],
};

/**
 * Nischengold — ilk GERÇEK işletme demosu.
 *
 * ⚠️ `indexable: false` bir tercih değil zorunluluk: var olan bir işletmenin
 * markasıyla, onayı alınmamış bir çalışma arama sonuçlarında görünmemeli.
 * Sahibin kuralı ayrıca talep edilirse aynı gün kaldırılmasını söylüyor.
 */
const NISCHENGOLD: Tenant = {
  id: 'nischengold',
  name: 'Nischengold',
  title: { en: 'Nischengold — scent map', tr: 'Nischengold — koku haritasi' },
  description: {
    en: 'The Nischengold shelf, drawn as a map of scent.',
    tr: 'Nischengold rafi, koku haritasi olarak cizildi.',
  },
  features: { accounts: false, notify: false, feed: false },
  indexable: false,
  /*
    Dükkân tek dilli Almanca (ölçüldü: `locale":"de"`, CHF, `/en` → 404).
    Almanca eklemek 269 sözlük dizesi + 158 nota açıklaması demek; o ayrı bir
    karar. Bu demo İngilizce duruyor — bitmiş bir teslimat gibi değil, bir
    ÖRNEK gibi görünmesi de bilinçli.

    Sahibin kararı (2026-08-18): Almanca **cevap gelirse** eklenecek, önce
    değil. Ilgi doğrulanmadan 269 sözlük dizesi + 158 nota açıklaması
    yazılmıyor. Ayrıntı: `docs/b2b/nischengold-mesaj.md`.
  */
  locales: ['en'],
};

/**
 * Scentitude — ilk partiden gelen ilk demo (BAE).
 *
 * ⚠️ 19 Ağustos'ta Instagram DM'e **WhatsApp numarası bırakarak** cevap verdi;
 * demoyu istediklerini söylemediler. `indexable: false` ve talep edilirse aynı
 * gün kaldırılır — Nischengold'la aynı kural.
 *
 * ⚠️ Dükkân Ingilizce satıyor (BAE, "Get Free UAE Delivery"), yani `/` Ingilizce
 * açılıyor. Dilin sırası artık öneksiz dili belirliyor (`i18n/locale.ts`).
 */
const SCENTITUDE: Tenant = {
  id: 'scentitude',
  name: 'Scentitude',
  title: { en: 'Scentitude — scent map', tr: 'Scentitude — koku haritasi' },
  description: {
    en: 'The Scentitude shelf, drawn as a map of scent.',
    tr: 'Scentitude rafi, koku haritasi olarak cizildi.',
  },
  features: { accounts: false, notify: false, feed: false },
  indexable: false,
  locales: ['en'],
};

export const TENANTS: readonly Tenant[] = [OSMOS, DEMO_SELVA, NISCHENGOLD, SCENTITUDE];
