import type { Perfume, Retailer } from '../types';

/**
 * Var olan parfümlerden kiracı katalogu türetmenin tek yolu.
 *
 * ⚠️ **Miras satıcı bağlantıları KESİLİYOR ve bu bir zevk meselesi değil.**
 * Ana katalogdaki parfümlerin `retailers` alanı dolu — markanın kendi
 * mağazası, Luckyscent, Scent Split. O nesneler kiracıya olduğu gibi
 * geçirilirse müşterinin kendi koku haritası, künyenin altından
 * **rakiplerine bağlantı verir.** Sessizce olur: sayfa çalışır, harita güzel
 * görünür, tek fark ziyaretçinin başka bir dükkândan alışveriş yapmasıdır.
 *
 * ⚠️ **Ama kesmek yetmiyordu — ve bu bir ürün eksiğiydi.** Bağlantılar
 * kesildikten sonra yerine hiçbir şey konmuyordu, yani kiracı sitesi
 * **çıkmaz sokaktı**: güzel bir harita, satın almaya giden yol yok. Satılan
 * değerin tamamı "kendi dükkânına açılan keşif katmanı" olduğu için o yol
 * ürünün kendisi. `urunAdresleri` onu kuruyor.
 *
 * Kural artık tam: kiracının parfümü ya **kendi ürün sayfasını** taşır ya
 * hiçbir şey. Miras alınmış bağlantı üçüncü seçenek değil, hatadır.
 */
export function deriveTenantCatalog(
  perfumes: readonly Perfume[],
  /** Parfüm kimliğinden müşterinin KENDİ ürün sayfasına. */
  urunAdresleri: Readonly<Record<string, string>> = {},
  /** Künyede görünecek dükkân adı. */
  magazaAdi = '',
): readonly Perfume[] {
  return perfumes.map((perfume) => {
    /*
      Kalan alanlar `rest` ile olduğu gibi taşınıyor — `Perfume`e yarın
      eklenen bir alan buradan sessizce düşmesin diye tek tek yazılmadı.
    */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- miras `retailers` bilerek düşürülüyor.
    const { retailers, ...rest } = perfume;
    const adres = urunAdresleri[perfume.id];
    if (adres === undefined || magazaAdi === '') return rest;
    /*
      ⚠️ Adres eşleşmesi ancak KESİN olduğunda yazılıyor. Yanlış bir bağlantı
      bağlantısızlıktan kötü: ziyaretçi başka bir ürüne düşer ve bunu kimse
      fark etmez. Eşleştirme kararının kendisi katalog dosyasında, gözle
      doğrulanmış hâlde duruyor.
    */
    const kendi: Retailer = { name: magazaAdi, url: adres };
    return { ...rest, retailers: [kendi] };
  });
}
