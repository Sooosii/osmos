import type { Perfume } from '../types';

/**
 * Var olan parfümlerden kiracı katalogu türetmenin tek yolu.
 *
 * ⚠️ **Satıcı bağlantıları KESİLMEK ZORUNDA ve bu bir zevk meselesi değil.**
 * Ana katalogdaki 52 parfümün her birinde `retailers` dolu — markanın kendi
 * mağazası, Scent Split, FragranceX. O nesneler kiracıya olduğu gibi
 * geçirilirse müşterinin kendi koku haritası, künyenin altından **rakiplerine
 * bağlantı verir.** Sessizce olur: sayfa çalışır, harita güzel görünür, tek
 * fark ziyaretçinin başka bir dükkandan alışveriş yapmasıdır.
 *
 * Sınama tutuyor (`lib/tenant.test.ts`), ve kural gerçek müşteride de aynı:
 * kiracının parfümü ya **kendi ürün sayfasını** taşır ya hiçbir şey taşımaz.
 * Miras alınmış bağlantı üçüncü seçenek değil, hatadır.
 */
export function deriveTenantCatalog(perfumes: readonly Perfume[]): readonly Perfume[] {
  /*
    Kalan alanlar `rest` ile olduğu gibi taşınıyor — `Perfume`e yarın eklenen
    bir alan buradan sessizce düşmesin diye tek tek yazılmadı.
  */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- `retailers` bilerek düşürülüyor.
  return perfumes.map(({ retailers, ...rest }) => rest);
}
