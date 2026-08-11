/**
 * Raflar — "sahibim · denedim · listemde".
 *
 * Üyeliğin ikinci işi. Top 4 bir **seçki** ("en sevdiğim dört şey"), raf bir
 * **kayıt** ("elimde ne var, neyi kokladım, ne istiyorum"). Ayrı şeyler ve
 * ayrı duruyorlar; raf aynı zamanda burun raporunun verisi (`nose.ts`).
 *
 * ⚠️ **Bu dosya parfüm veritabanını İÇERİ ALMIYOR ve almayacak.** Sözlüğü
 * künyedeki istemci düğmeleri (`ShelfPicker`) de okuyor; `@/data/perfumes`
 * ya da `@/db/schema` importu 52 parfümü veya `drizzle-orm`u tarayıcı paketine
 * sokardı. Sitenin en eski sözü bu: hesap sunucuda kalır, tarayıcıya yalnızca
 * sonuç iner.
 *
 * "Bu parfüm gerçekten var mı" denetimi bu yüzden burada değil, yazma
 * kapısında (`profile-store.setShelf`, `hasPerfume`) — veriye en yakın yerde.
 */

/**
 * Üç raf, sabit ve kapalı liste.
 *
 * ⚠️ Sıra ekranda da bu: sahip olunan önce, istenen sonra. Rastgele değil,
 * sahiplikten isteğe doğru bir ilerleme okunuyor.
 */
export const SHELF_KINDS = ['owned', 'tried', 'wishlist'] as const;

export type ShelfKind = (typeof SHELF_KINDS)[number];

export interface ShelfEntry {
  readonly perfumeId: string;
  readonly kind: ShelfKind;
}

/**
 * Gelen değer üç raftan biri mi?
 *
 * `unknown` alıyor çünkü çağıranların biri Server Action, biri HTTP ucu —
 * ikisine de istemciden ne geleceği belli olmaz. Sütun `text` olduğu için
 * veritabanı bu soruyu sormuyor; kapı burası.
 */
export function isShelfKind(value: unknown): value is ShelfKind {
  return typeof value === 'string' && (SHELF_KINDS as readonly string[]).includes(value);
}

/** Üç rafın her biri için parfüm kimlikleri, geliş sırasıyla. */
export type GroupedShelf = Readonly<Record<ShelfKind, readonly string[]>>;

/**
 * Düz kayıt listesini üç rafa ayırır.
 *
 * Üç anahtar da **her zaman** var, boş olsa bile: ekran üçünü de okuyor ve
 * eksik bir anahtar sayfayı çökertirdi.
 *
 * Tanınmayan raf sessizce eleniyor — `cleanTopFour`ün affediciliği. Reddetmenin
 * doğru olduğu yer yazma kapısı; burası okuma, ve okuma tarafı veriden çıkmış
 * ya da eskimiş bir satır yüzünden profili çökertmemeli.
 */
export function groupShelf(entries: readonly ShelfEntry[]): GroupedShelf {
  const grouped: Record<ShelfKind, string[]> = { owned: [], tried: [], wishlist: [] };

  for (const entry of entries) {
    if (!isShelfKind(entry.kind)) continue;
    grouped[entry.kind].push(entry.perfumeId);
  }

  return grouped;
}
