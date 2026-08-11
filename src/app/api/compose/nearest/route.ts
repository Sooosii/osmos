import { nearestToComposition } from '@/lib/composition';
import type { PerfumeNote } from '@/data/types';

/**
 * Taslak kompozisyona en yakın parfümler.
 *
 * ⚠️ **Neden Server Action değil de uç?** İki sebep:
 *
 *   1. Bu bir **okuma** ve herkese açık — kurma aracının ilk üç notası
 *      girişsiz de çalışıyor. Depodaki kural "her Server Action ilk işi
 *      oturumu doğrular" ve bir sınama bunu tutuyor; okuma amaçlı bir
 *      istisna o kuralı deler. Uç olarak durunca kural bozulmuyor.
 *   2. Hesap **sunucuda kalmak zorunda**: `nearestToComposition` benzerlik
 *      motorunu ve 52 parfümü çağırıyor. İstemcide çalışsaydı ikisi de
 *      tarayıcı paketine inerdi ve sitenin en eski sözü ("hesap sunucuda,
 *      istemciye yalnızca sonuç") sessizce ölürdü.
 *
 * ⚠️ Kök varlık: `proxy.ts`teki `ROOT_PREFIXES` (`/api/`) bunu kapsıyor.
 */
const MAX_BODY = 4096;
const LIMIT = 5;

export async function POST(request: Request): Promise<Response> {
  const text = await request.text();
  if (text.length > MAX_BODY) return new Response(null, { status: 413 });

  let notes: unknown;
  try {
    notes = JSON.parse(text);
  } catch {
    return new Response(null, { status: 400 });
  }

  if (!Array.isArray(notes)) return new Response(null, { status: 400 });

  /*
    Doğrulama `nearestToComposition`ın içinde: geçersiz kompozisyonda boş
    dizi dönüyor, hata değil. Kullanıcı nota eklerken her tuşta buraya
    geliyor ve yarım bir kompozisyon normal bir ara durum.
  */
  const matches = nearestToComposition(notes as PerfumeNote[], LIMIT);

  return Response.json(matches, {
    /* Kişiye özel değil ama taslağa özel; önbelleğe girmesin. */
    headers: { 'Cache-Control': 'no-store' },
  });
}
