import 'server-only';

import { and, eq, ne, sql } from 'drizzle-orm';
import { schema } from '@/db';
import { BIO_MAX, COMPOSITION_NAME_MAX, FREE_COMPOSITION_NOTES } from '@/db/schema';
import { hasPerfume } from '@/data/perfumes';
import type { PerfumeNote } from '@/data/types';
import { compositionError, type CompositionError } from './composition';
import { uniqueSlug } from './composition-slug';
import { isShelfKind, type ShelfEntry, type ShelfKind } from './shelf';
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

/* ───────────────────────────────  Raflar  ─────────────────────────────── */

export type ShelfError = 'unknownPerfume' | 'unknownKind';

/**
 * Kişinin rafları — yeniden eskiye, bozuk kayıt elenmiş.
 *
 * Okuma tarafı **affedici** (`cleanTopFour` ve `listCompositions` ile aynı
 * duruş): veriden bir parfüm çıkarsa ya da `kind` sütununa bir gün elle bir
 * şey yazılırsa o satır listeden düşüyor, sayfa çökmüyor. Reddetmenin doğru
 * olduğu yer yazma kapısı, burası değil.
 */
export async function readShelf(db: Db, userId: string): Promise<readonly ShelfEntry[]> {
  const rows = await db
    .select({
      perfumeId: schema.shelf.perfumeId,
      kind: schema.shelf.kind,
      createdAt: schema.shelf.createdAt,
    })
    .from(schema.shelf)
    .where(eq(schema.shelf.userId, userId));

  return [...rows]
    .sort(
      (a: { createdAt: Date }, b: { createdAt: Date }) =>
        b.createdAt.getTime() - a.createdAt.getTime(),
    )
    .filter(
      (row: { perfumeId: string; kind: string }) =>
        hasPerfume(row.perfumeId) && isShelfKind(row.kind),
    )
    .map((row: { perfumeId: string; kind: ShelfKind }) => ({
      perfumeId: row.perfumeId,
      kind: row.kind,
    }));
}

/**
 * Bir parfümü rafa koyar, rafını değiştirir ya da raftan çıkarır.
 *
 * ⚠️ **Rafta gezinmek yeni satır AÇMIYOR** — `shelf_user_perfume` kısıtı
 * üzerinden güncelleme. Şemadaki karar burada uygulanıyor: üç raf tek bir
 * ilişkinin birbirini dışlayan hâlleri, etiket değil. Ayrı satırlar bıraksaydık
 * "hem sahibim hem listemde" diye bir durum doğar, rapor da aynı parfümü iki
 * kez sayardı.
 *
 * `kind === null` raftan tamamen çıkarıyor — düğmeye tekrar basmanın karşılığı.
 */
export async function setShelf(
  db: Db,
  userId: string,
  perfumeId: string,
  kind: ShelfKind | null,
): Promise<{ ok: true } | { ok: false; error: ShelfError }> {
  /*
    Kimlik istemciden geliyor ve uç herkese açık. Doğrulanmadan yazılsaydı
    rafta var olmayan bir parfüm dururdu: ekran onu atlar, yani kullanıcı
    kaydının düştüğünü hiç fark etmez.
  */
  if (!hasPerfume(perfumeId)) return { ok: false, error: 'unknownPerfume' };

  if (kind === null) {
    await db
      .delete(schema.shelf)
      .where(and(eq(schema.shelf.userId, userId), eq(schema.shelf.perfumeId, perfumeId)));
    return { ok: true };
  }

  if (!isShelfKind(kind)) return { ok: false, error: 'unknownKind' };

  await db
    .insert(schema.shelf)
    .values({ id: `${userId}:${perfumeId}`.slice(0, 190), userId, perfumeId, kind })
    .onConflictDoUpdate({
      target: [schema.shelf.userId, schema.shelf.perfumeId],
      set: { kind },
    });

  return { ok: true };
}

/* ─────────────────────────  Kompozisyonlar  ───────────────────────── */

export interface StoredComposition {
  readonly slug: string;
  readonly name: string;
  readonly notes: readonly PerfumeNote[];
}

export type ComposeError = CompositionError | 'needsPatron' | 'noName' | 'tooManySaved';

/**
 * Bir kişinin kaydedebileceği en fazla kompozisyon.
 *
 * Sınırsız bırakmak, tek bir hesabın veritabanını doldurmasına açık kapı
 * bırakırdı; yirmi tane, gerçek bir kullanıcının isteyebileceğinden fazla.
 */
export const MAX_SAVED_COMPOSITIONS = 20;

/** Kişinin kompozisyonları — yeniden eskiye, bozuk kayıt atlanmış. */
export async function listCompositions(
  db: Db,
  userId: string,
): Promise<readonly StoredComposition[]> {
  const rows = await db
    .select({
      slug: schema.composition.slug,
      name: schema.composition.name,
      notes: schema.composition.notes,
      createdAt: schema.composition.createdAt,
    })
    .from(schema.composition)
    .where(eq(schema.composition.userId, userId));

  return [...rows]
    .sort((a: { createdAt: Date }, b: { createdAt: Date }) =>
      b.createdAt.getTime() - a.createdAt.getTime(),
    )
    .map((row: { slug: string; name: string; notes: unknown }) => ({
      slug: row.slug,
      name: row.name,
      notes: Array.isArray(row.notes) ? (row.notes as PerfumeNote[]) : [],
    }))
    /*
      ⚠️ Okurken doğrulanıyor: veriden bir nota çıkarsa ya da eski bir kayıt
      bozuksa o kompozisyon listeden düşüyor, sayfa çökmüyor.
    */
    .filter((entry: StoredComposition) => compositionError(entry.notes) === null);
}

/**
 * Kompozisyonu kaydeder.
 *
 * ⚠️ **Patron sınırı BURADA uygulanıyor, ekranda değil.** Ekrandaki sayaç bir
 * kolaylık; bu satır kapı. Server Action'lar herkese açık uçlardır ve bu
 * depoda bir kez öğrenilmiş bir ders.
 */
export async function saveComposition(
  db: Db,
  userId: string,
  input: { name: string; notes: readonly PerfumeNote[] },
): Promise<{ ok: true; slug: string } | { ok: false; error: ComposeError }> {
  const name = input.name.trim().replace(/\s+/g, ' ').slice(0, COMPOSITION_NAME_MAX);
  if (name.length === 0) return { ok: false, error: 'noName' };

  const invalid = compositionError(input.notes);
  if (invalid) return { ok: false, error: invalid };

  const owner = await db
    .select({ patron: schema.user.patron })
    .from(schema.user)
    .where(eq(schema.user.id, userId))
    .limit(1);

  if (owner.length === 0) return { ok: false, error: 'noSuchUser' as ComposeError };
  if (!owner[0].patron && input.notes.length > FREE_COMPOSITION_NOTES) {
    return { ok: false, error: 'needsPatron' };
  }

  const existing = await listCompositions(db, userId);
  if (existing.length >= MAX_SAVED_COMPOSITIONS) return { ok: false, error: 'tooManySaved' };

  const slug = uniqueSlug(name, existing.map((entry) => entry.slug));

  await db.insert(schema.composition).values({
    id: `${userId}:${slug}`.slice(0, 190),
    userId,
    slug,
    name,
    notes: input.notes,
  });

  return { ok: true, slug };
}

export async function deleteComposition(db: Db, userId: string, slug: string): Promise<void> {
  await db
    .delete(schema.composition)
    .where(and(eq(schema.composition.userId, userId), eq(schema.composition.slug, slug)));
}
