import 'server-only';

import { cache } from 'react';
import { headers } from 'next/headers';
import { eq } from 'drizzle-orm';
import type { PerfumeNote } from '@/data/types';
import { getDb, schema } from '@/db';
import { getAuth, authReady } from './auth';
import { listCompositions, readShelf } from './profile-store';
import { groupShelf, type GroupedShelf, type ShelfEntry } from './shelf';
import { cleanTopFour } from './top-four';

/**
 * Erişim katmanı — kullanıcı verisine giden tek kapı.
 *
 * Next'in kimlik kılavuzunun önerdiği yapı (Data Access Layer): yetki
 * denetimi veriye **en yakın** yerde duruyor, sayfaların içine dağılmıyor.
 * Sebebi somut: bir sayfada denetimi unutmak sessiz bir sızıntı; burada
 * unutmak imkânsız, çünkü veriye başka yoldan ulaşılmıyor.
 *
 * ⚠️ **Düzende (`layout`) oturum denetimi YAPILMAYACAK.** Düzenler gezinmede
 * yeniden çizilmiyor (kısmi render), yani denetim ilk yüklemeden sonra
 * sessizce atlanır. Kılavuzun kendi uyarısı; denetim veriye yakın yerde.
 *
 * ⚠️ **Proxy'de veritabanı denetimi YAPILMAYACAK.** Proxy her rotada
 * çalışıyor — önden getirilen bağlantılar dahil — ve bizimki zaten dil
 * katmanı. Oraya sorgu koymak her gezinmeyi yavaşlatır.
 *
 * `cache` ile tekilleştirme: bir sayfa çiziminde oturum kaç kez sorulursa
 * sorulsun veritabanına bir kez gidiliyor.
 */

/** Dışarı çıkan tek kullanıcı biçimi — DTO. */
export interface Viewer {
  readonly id: string;
  readonly username: string | null;
  readonly bio: string | null;
  readonly hidden: boolean;
  readonly emailOptIn: boolean;
  /** Ücretli üyelik; bugün elle çevriliyor, yarın webhook. */
  readonly patron: boolean;
}

/** Başkasının profili — buradan e-posta ve oturum bilgisi ASLA çıkmıyor. */
export interface PublicProfile {
  readonly username: string;
  readonly bio: string | null;
  readonly topFour: readonly string[];
  /** Süslemeleri açan bayrak; ücretli üyelik. */
  readonly patron: boolean;
  readonly compositions: readonly { readonly slug: string; readonly name: string }[];
  /**
   * Üç raf, kimlik listeleri hâlinde.
   *
   * Profil sayfası bundan yalnızca üç sayı okuyor ama tamamı geliyor ve bu
   * bilinçli: raf en fazla katalog boyunda (52 satır) ve aynı çağrı raf
   * sayfasını da burun raporunu da besliyor. Ayrı bir "sayı" sorgusu açmak
   * üç sayfa için üç ayrı yol demek olurdu.
   */
  readonly shelf: GroupedShelf;
}

/**
 * Oturumdaki kullanıcı, yoksa `null`.
 *
 * ⚠️ Dönen nesne **DTO**: `e-posta`, `emailVerified`, oturum kimliği ve
 * sağlayıcı bağlantıları burada yok. Kılavuzun kuralı — "tüm nesneyi değil,
 * gereken alanları döndür". Bir gün e-posta gerekirse ayrı ve adı üstünde
 * bir fonksiyonla alınacak, bu kapıdan sızmayacak.
 */
export const currentViewer = cache(async (): Promise<Viewer | null> => {
  if (!authReady()) return null;

  const session = await getAuth().api.getSession({ headers: await headers() });
  if (!session?.user) return null;

  const user = session.user as {
    id: string;
    username?: string | null;
    bio?: string | null;
    hidden?: boolean | null;
    emailOptIn?: boolean | null;
    patron?: boolean | null;
  };

  return {
    id: user.id,
    username: user.username ?? null,
    bio: user.bio ?? null,
    hidden: user.hidden ?? false,
    emailOptIn: user.emailOptIn ?? false,
    patron: user.patron ?? false,
  };
});

/** Bir kullanıcının Top 4'ü — **sıraya göre**, veriden. */
export const topFourOf = cache(async (userId: string): Promise<readonly string[]> => {
  const rows = await getDb()
    .select({ perfumeId: schema.topFour.perfumeId, position: schema.topFour.position })
    .from(schema.topFour)
    .where(eq(schema.topFour.userId, userId));

  /*
    ⚠️ Sıralama BURADA yapılıyor, veritabanının döndürdüğü sıraya
    güvenilmiyor: SQL `ORDER BY` olmadan sırasızdır ve "birinci parfümüm"
    bir iddia. `cleanTopFour` ayrıca veriden çıkmış bir parfümü atıyor —
    profil onun yüzünden çökmüyor.
  */
  const ordered = [...rows].sort((a, b) => a.position - b.position);
  return cleanTopFour(ordered.map((row) => row.perfumeId));
});

/**
 * Bir kullanıcının rafları — ham kayıtlar, gruplanmamış.
 *
 * `cache` şart: profil sayfası bunu profil üzerinden, künye ucu doğrudan
 * çağırıyor ve bir çizimde ikisi de olabilir.
 */
export const shelfOf = cache(async (userId: string): Promise<readonly ShelfEntry[]> => {
  if (!authReady()) return [];
  return readShelf(getDb(), userId);
});

/**
 * Herkese açık profil — yoksa ya da **gizliyse** `null`.
 *
 * ⚠️ Gizli profil "gizli" sayfası değil `null` dönüyor; sayfa onu 404'e
 * çeviriyor. "Bu kullanıcı profilini gizlemiş" demek, kullanıcının var
 * olduğunu söylemektir — gizlemenin amacı tam olarak bunu söylememek.
 */
export const publicProfile = cache(async (username: string): Promise<PublicProfile | null> => {
  if (!authReady()) return null;

  const rows = await getDb()
    .select({
      id: schema.user.id,
      username: schema.user.username,
      bio: schema.user.bio,
      hidden: schema.user.hidden,
      patron: schema.user.patron,
    })
    .from(schema.user)
    .where(eq(schema.user.username, username))
    .limit(1);

  const found = rows[0];
  if (!found?.username || found.hidden) return null;

  const compositions = await listCompositions(getDb(), found.id);

  return {
    username: found.username,
    bio: found.bio,
    patron: found.patron,
    topFour: await topFourOf(found.id),
    /* Listede yalnızca ad ve adres; notalar kompozisyonun kendi sayfasında. */
    compositions: compositions.map((entry) => ({ slug: entry.slug, name: entry.name })),
    shelf: groupShelf(await shelfOf(found.id)),
  };
});

/**
 * Tek bir kompozisyon — sahibinin adı ve slug'ıyla.
 *
 * ⚠️ **Gizli profilin kompozisyonu da yok.** Profil sayfası gibi bu da `null`
 * dönüyor: gizlemek profili saklamak değil, kişinin var olduğunu söylememek.
 * Kompozisyon adresi açık kalsaydı gizli bir profilin varlığı oradan sızardı.
 */
export const publicComposition = cache(
  async (
    username: string,
    slug: string,
  ): Promise<{
    readonly username: string;
    readonly patron: boolean;
    readonly name: string;
    readonly notes: readonly PerfumeNote[];
  } | null> => {
    if (!authReady()) return null;

    const rows = await getDb()
      .select({
        id: schema.user.id,
        username: schema.user.username,
        hidden: schema.user.hidden,
        patron: schema.user.patron,
      })
      .from(schema.user)
      .where(eq(schema.user.username, username))
      .limit(1);

    const owner = rows[0];
    if (!owner?.username || owner.hidden) return null;

    const found = (await listCompositions(getDb(), owner.id)).find(
      (entry) => entry.slug === slug,
    );
    if (!found) return null;

    return {
      username: owner.username,
      patron: owner.patron,
      name: found.name,
      notes: found.notes,
    };
  },
);
