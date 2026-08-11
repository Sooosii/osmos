import 'server-only';

import { and, eq, ne, sql } from 'drizzle-orm';
import { schema } from '@/db';
import { BIO_MAX } from '@/db/schema';
import { MAX_TOP_FOUR, setSlot, topFourError } from './top-four';
import { normalizeUsername, usernameError, type UsernameError } from './username';

/**
 * Profil verisinin yazma tarafı.
 *
 * ⚠️ **Veritabanı parametre olarak alınıyor** ve tek sebebi sınanabilirlik:
 * bu dosyadaki her kural PGlite üzerinde, gerçek SQL'e karşı sınanıyor.
 * Yetki denetimi içeren kod, taklitle sınandığında sınanmamış sayılır.
 *
 * ⚠️ Buradaki hiçbir fonksiyon **kimin çağırdığını sormuyor** — `userId`
 * parametresi zaten "bu kullanıcı adına" demek. Oturumu doğrulamak
 * çağıranın (Server Action) işi ve orada `currentViewer()`dan geçiyor.
 * Sınır böyle çizildi ki yetki denetimi tek yerde kalsın; bu dosya
 * "kullanıcı doğrulandı" varsayımıyla çalışıyor ve bunu bilerek yapıyor.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = any;

export type SaveError = UsernameError | 'taken' | 'bioTooLong' | 'noSuchUser';

/**
 * Kullanıcı adını ilk kez seçmek ya da değiştirmek.
 *
 * ⚠️ Benzersizlik **iki katmanda**: burada bir sorgu, veritabanında bir
 * kısıt. Sorgu tek başına yeterli değil — iki istek aynı anda gelirse ikisi
 * de "boşta" görür ve ikincisi kısıta çarpar. Kısıt tek başına da yeterli
 * değil, çünkü kullanıcıya anlaşılır bir hata göstermek istiyoruz.
 */
export async function claimUsername(
  db: Db,
  userId: string,
  raw: string,
): Promise<{ ok: true; username: string } | { ok: false; error: SaveError }> {
  const username = normalizeUsername(raw);

  const shape = usernameError(username);
  if (shape) return { ok: false, error: shape };

  const clash = await db
    .select({ id: schema.user.id })
    .from(schema.user)
    .where(and(eq(schema.user.username, username), ne(schema.user.id, userId)))
    .limit(1);
  if (clash.length > 0) return { ok: false, error: 'taken' };

  try {
    const updated = await db
      .update(schema.user)
      .set({ username, updatedAt: new Date() })
      .where(eq(schema.user.id, userId))
      .returning({ id: schema.user.id });
    if (updated.length === 0) return { ok: false, error: 'noSuchUser' };
  } catch {
    /* Yarış: iki istek arasında biri adı kaptı; kısıt yakaladı. */
    return { ok: false, error: 'taken' };
  }

  return { ok: true, username };
}

/** Profildeki tek satır ve gizleme anahtarı. */
export async function saveProfile(
  db: Db,
  userId: string,
  input: { bio?: string | null; hidden?: boolean; emailOptIn?: boolean },
): Promise<{ ok: true } | { ok: false; error: SaveError }> {
  const patch: Record<string, unknown> = { updatedAt: new Date() };

  if (input.bio !== undefined) {
    const bio = input.bio?.trim() ?? '';
    if (bio.length > BIO_MAX) return { ok: false, error: 'bioTooLong' };
    /*
      ⚠️ Satır sonları siliniyor: tek SATIR sözü verildi ve çok satırlı bir
      metin profilin yerleşimini bozar. Kaçış React'in işi (HTML asla
      `dangerously` basılmıyor); buradaki iş yalnızca biçim.
    */
    patch.bio = bio === '' ? null : bio.replace(/\s+/g, ' ');
  }

  if (input.hidden !== undefined) patch.hidden = input.hidden;
  if (input.emailOptIn !== undefined) patch.emailOptIn = input.emailOptIn;

  const updated = await db
    .update(schema.user)
    .set(patch)
    .where(eq(schema.user.id, userId))
    .returning({ id: schema.user.id });

  if (updated.length === 0) return { ok: false, error: 'noSuchUser' };
  return { ok: true };
}

/** Kullanıcının Top 4'ü — sıralı, veriden. */
export async function readTopFour(db: Db, userId: string): Promise<readonly string[]> {
  const rows = await db
    .select({ perfumeId: schema.topFour.perfumeId, position: schema.topFour.position })
    .from(schema.topFour)
    .where(eq(schema.topFour.userId, userId));

  return [...rows]
    .sort((a: { position: number }, b: { position: number }) => a.position - b.position)
    .map((row: { perfumeId: string }) => row.perfumeId);
}

/**
 * Bir yuvayı doldurmak, değiştirmek ya da boşaltmak.
 *
 * ⚠️ **Bütün liste yeniden yazılıyor, tek satır güncellenmiyor.** Sebep
 * `setSlot`un davranışı: bir yuva boşaldığında arkası kayıyor ve zaten
 * listede olan parfüm taşınıyor — yani tek bir işlem birden çok satırın
 * `position`ını değiştirebiliyor. Tek satır güncellemek, benzersizlik
 * kısıtına çarpan yarım bir duruma yol açardı.
 */
export async function writeSlot(
  db: Db,
  userId: string,
  slot: number,
  perfumeId: string | null,
): Promise<{ ok: true; ids: readonly string[] } | { ok: false; error: 'tooMany' | 'duplicate' | 'unknown' }> {
  const current = await readTopFour(db, userId);
  const next = setSlot(current, slot, perfumeId);

  const invalid = topFourError(next);
  if (invalid) return { ok: false, error: invalid };

  await db.delete(schema.topFour).where(eq(schema.topFour.userId, userId));

  if (next.length > 0) {
    await db.insert(schema.topFour).values(
      next.map((id, position) => ({
        id: `${userId}:${position}:${id}`.slice(0, 190),
        userId,
        perfumeId: id,
        position,
      })),
    );
  }

  return { ok: true, ids: next };
}

/** Parfüm sayfasındaki düğmenin yolu: ilk boş yuvaya ekle. */
export async function appendToTopFour(
  db: Db,
  userId: string,
  perfumeId: string,
): Promise<{ ok: true; ids: readonly string[] } | { ok: false; error: 'tooMany' | 'duplicate' | 'unknown' }> {
  const current = await readTopFour(db, userId);
  if (current.includes(perfumeId)) return { ok: false, error: 'duplicate' };
  if (current.length >= MAX_TOP_FOUR) return { ok: false, error: 'tooMany' };
  return writeSlot(db, userId, current.length, perfumeId);
}

/** Kaç kişi kayıtlı — yalnızca sınamalar ve ileride yönetim için. */
export async function countUsers(db: Db): Promise<number> {
  const rows = await db.select({ n: sql<number>`count(*)::int` }).from(schema.user);
  return rows[0]?.n ?? 0;
}
