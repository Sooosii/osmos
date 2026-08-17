import { describe, expect, it } from 'vitest';
import { LOCALES, type Locale } from '@/i18n/locale';
import { activeTenant, dilleriSuz, isOsmos, resolveTenant } from './tenant';
import { OSMOS_TENANT_ID, TENANTS, type Tenant } from '@/data/tenants/registry';
import { TENANT_CATALOGS } from '@/data/tenants/catalogs';
import { buildTenantSpaces, SPACE_CAPACITY } from '@/data/perfume-spaces';
import { buildMarks } from './space-marks';

describe('resolveTenant', () => {
  it('tanımlı kimliği çözer', () => {
    expect(resolveTenant(OSMOS_TENANT_ID).name).toBe('OSMOS');
  });

  /*
    ⚠️ `perfumes.ts` ana derlemeyi ayırırken bu değeri **elle yazılmış metin**
    olarak karşılaştırıyor (`=== 'osmos'`), çünkü ölü dalın elenmesi sabitin
    katlanmasına bağlı kalmasın — o eleme, kiracının paketinde OSMOS
    katalogunun bulunmamasının tek sebebi. Kimlik değişirse orası sessizce her
    iki katalogu da paketlemeye döner ve sızıntı geri gelir.
  */
  it("OSMOS kimliği 'osmos' olarak kalıyor — perfumes.ts metni buna bağlı", () => {
    expect(OSMOS_TENANT_ID).toBe('osmos');
  });

  /*
    Bu sınamanın kapattığı hata sessiz olanı: değişkende bir harf hatası olan
    müşteri derlemesi sorunsuz tamamlanır, yayına çıkar ve müşterinin alan adı
    altında OSMOS'un katalogunu gösterir. Kimse fark etmez çünkü site çalışıyor
    görünür.
  */
  it('bilinmeyen kimlikte PATLAR, varsayılana düşmez', () => {
    expect(() => resolveTenant('boyle-bir-kiraci-yok')).toThrow(/Bilinmeyen kiracı/);
  });

  it('hata mesajı tanımlı kimlikleri sayar — yazım hatasını bulmak için', () => {
    expect(() => resolveTenant('yok')).toThrow(new RegExp(OSMOS_TENANT_ID));
  });
});

describe('aktif kiracı', () => {
  it('değişken yokken ana site', () => {
    expect(activeTenant().id).toBe(OSMOS_TENANT_ID);
    expect(isOsmos()).toBe(true);
  });
});

describe('kiracı kaydı', () => {
  it('kimlikler benzersiz', () => {
    const ids = TENANTS.map((tenant) => tenant.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  /*
    Demo kiracı gerçek bir işletmenin adıyla kurulacak ve onayı alınmamış
    olacak. Arama motoruna açık kalması hem o işletme hem bizim için sorun;
    kapıyı kayıt tutuyor, kaldırılmasın.
  */
  it('ana site dışındaki her kiracı indekslemeye kapalı başlar', () => {
    for (const tenant of TENANTS) {
      if (tenant.id === OSMOS_TENANT_ID) continue;
      expect(tenant.indexable, `${tenant.id} indekslenebilir işaretli`).toBe(false);
    }
  });

  it('ana site dışında hesap dünyası kapalı', () => {
    for (const tenant of TENANTS) {
      if (tenant.id === OSMOS_TENANT_ID) continue;
      expect(tenant.features.accounts, `${tenant.id}`).toBe(false);
    }
  });

  it('ana site dışındaki her kiracının katalogu tanımlı', () => {
    for (const tenant of TENANTS) {
      if (tenant.id === OSMOS_TENANT_ID) continue;
      expect(TENANT_CATALOGS[tenant.id], `${tenant.id} katalogsuz`).toBeDefined();
    }
  });
});

describe('kiracı uzayları', () => {
  const catalog = TENANT_CATALOGS['demo-selva'];

  /*
    ⚠️ Ana sitenin "uzay 1 tam 52 olmalı" şartı kiracıya UYGULANMAZ. Uygulansaydı
    52'nin katı olmayan her katalog — yani neredeyse her müşteri — reddedilirdi.
  */
  it('52 katı olmayan katalogu kabul eder', () => {
    expect(catalog.length).not.toBe(SPACE_CAPACITY);
    const spaces = buildTenantSpaces(catalog);
    expect(spaces).toHaveLength(1);
    expect(spaces[0].id).toBe(1);
    expect(spaces[0].perfumes).toHaveLength(catalog.length);
  });

  it('büyük katalogu eşit böler — dolduр taşırmaz', () => {
    const big = Array.from({ length: 53 }, (_, index) => ({
      ...catalog[0],
      id: `sahte-${index}`,
    }));
    const sizes = buildTenantSpaces(big).map((space) => space.perfumes.length);
    expect(sizes).toEqual([27, 26]);
  });

  it('boş katalogda patlar — noktasız harita satılamaz', () => {
    expect(() => buildTenantSpaces([])).toThrow(/boş/);
  });
});

describe('kalibrasyon kiracının kendi kataloğunda', () => {
  const catalog = TENANT_CATALOGS['demo-selva'];

  /*
    Satılan şeyin çalışması buna bağlı. Kaydıraç eksenleri gözlenen aralığa
    yayılıyor; ölçü ana sitenin 150 parfümü olsaydı, 18 parfümlük bir seçki
    haritanın ortasında küçük bir bulut hâlinde toplanır ve kaydıraçların yolu
    büyük ölçüde ölü kalırdı. Kiracıda `PERFUMES` zaten yalnızca onun katalogu
    olduğu için ölçü de kendisi oluyor — bu sınama o bağın kopmadığını tutuyor.
  */
  it('her eksende uçlar 0 ve 1e değiyor', () => {
    const marks = buildMarks(catalog);

    for (let axis = 0; axis < 4; axis += 1) {
      const values = marks.map((mark) => mark.feel[axis]);
      expect(Math.min(...values), `eksen ${axis} alt uç`).toBeCloseTo(0, 6);
      expect(Math.max(...values), `eksen ${axis} üst uç`).toBeCloseTo(1, 6);
    }
  });

  it('ana sitenin evreni ölçü olarak verilirse uçlar KAYBOLUYOR — farkın kanıtı', async () => {
    const { PERFUMES } = await import('@/data/perfumes');
    const marks = buildMarks(catalog, 'en', { feelUniverse: PERFUMES });
    const values = marks.map((mark) => mark.feel[0]);

    /* En az bir eksende seçki artık uca değmiyor: kiracıya global cetvel yanlış. */
    expect(Math.max(...values)).toBeLessThan(1);
  });
});

describe('demo kiracının katalogu', () => {
  it('gerçek parfümlerden oluşuyor — uydurma veri yok', async () => {
    const { OSMOS_ALL } = await import('@/data/osmos-catalog');
    const known = new Set(OSMOS_ALL.map((perfume) => perfume.id));

    for (const perfume of TENANT_CATALOGS['demo-selva']) {
      expect(known.has(perfume.id), `${perfume.id} ana katalogda yok`).toBe(true);
    }
  });

  /*
    Olmayan bir dükkanın ürün sayfası da yok. Gerçek müşteride bu alan onun
    kendi ürün linkleriyle dolacak; demoda uydurma adres koymak
    `retailers.test.ts`in kapattığı hatanın ta kendisi olurdu.
  */
  it('satıcı bağlantısı taşımıyor', () => {
    for (const perfume of TENANT_CATALOGS['demo-selva']) {
      expect(perfume.retailers ?? []).toHaveLength(0);
    }
  });
});

/* Kayıt biçiminin kendisi — yeni kiracı eklenirken alan atlanmasın. */
describe('kiracı şekli', () => {
  it('her kiracı bütün alanları taşıyor', () => {
    for (const tenant of TENANTS) {
      const shape: Tenant = tenant;
      expect(shape.name.length).toBeGreaterThan(0);

      /*
        Diller `LOCALES` üzerinden dönülüyor, dil kodu elle yazılmıyor.
        `i18n.test.ts` ekran kodunda tek dile sabitlenmiş alan erişimini
        yasaklıyor ve o avcı yorumları atlamıyor — kendi sınamamı geçirmek için
        korumayı daraltmak yanlış olurdu (bu depoda aynı karar üçüncü kez
        veriliyor). Döngü ayrıca üçüncü bir dil eklendiğinde onu da kapsar.
      */
      for (const locale of LOCALES) {
        expect(shape.title[locale].length, `${tenant.id} ${locale} başlık`).toBeGreaterThan(0);
        expect(
          shape.description[locale].length,
          `${tenant.id} ${locale} tarif`,
        ).toBeGreaterThan(0);
      }
    }
  });
});

describe('kiracının dilleri', () => {
  const kiraci = (locales?: readonly Locale[]): Tenant => ({
    id: 'x',
    name: 'X',
    title: { en: 'x', tr: 'x' },
    description: { en: 'x', tr: 'x' },
    features: { accounts: false, notify: false, feed: false },
    indexable: false,
    ...(locales === undefined ? {} : { locales }),
  });

  /* Dil bildirmeyen kiraci etkilenmiyor — OSMOS ve demo-selva iki dilli kaliyor. */
  it('dil bildirilmezse hepsi üretiliyor', () => {
    expect(dilleriSuz(kiraci())).toEqual(LOCALES);
  });

  /*
    ⚠️ Bir müşteriye konuşmadığı dilde sekme göstermek, sitenin ona
    hazırlanmadığını söyler. Nischengold tek dilli Almanca satıyor (ölçüldü:
    `locale":"de"`, CHF, `/en` → 404); Türkçe sekme orada özensizlik olur.
  */
  it('bildirilen dil dışındakiler üretilmiyor', () => {
    expect(dilleriSuz(kiraci(['en']))).toEqual(['en']);
  });

  it('sıra LOCALES ten geliyor, kiracının yazdığı sıradan değil', () => {
    expect(dilleriSuz(kiraci(['tr', 'en']))).toEqual([...LOCALES]);
  });

  /* Bos liste sessizce dilsiz bir site uretirdi. */
  it('hiçbir geçerli dil kalmazsa patlıyor', () => {
    expect(() => dilleriSuz(kiraci([]))).toThrow(/geçerli dili yok/);
  });
});
