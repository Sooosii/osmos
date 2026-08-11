import 'server-only';

import { cache } from 'react';
import { headers } from 'next/headers';
import { eq } from 'drizzle-orm';
import { getDb, schema } from '@/db';
import { getAuth, authReady } from './auth';
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
}

/** Başkasının profili — buradan e-posta ve oturum bilgisi ASLA çıkmıyor. */
export interface PublicProfile {
  readonly username: string;
  readonly bio: string | null;
  readonly topFour: readonly string[];
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
  };

  return {
    id: user.id,
    username: user.username ?? null,
    bio: user.bio ?? null,
    hidden: user.hidden ?? false,
    emailOptIn: user.emailOptIn ?? false,
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
    })
    .from(schema.user)
    .where(eq(schema.user.username, username))
    .limit(1);

  const found = rows[0];
  if (!found?.username || found.hidden) return null;

  return {
    username: found.username,
    bio: found.bio,
    topFour: await topFourOf(found.id),
  };
});
