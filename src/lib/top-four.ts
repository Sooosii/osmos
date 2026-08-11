import { hasPerfume } from '@/data/perfumes';

/**
 * Top 4 kuralları — saf, sınanabilir.
 *
 * Üyeliğin ilk (ve şimdilik tek) işi: dört parfüm seçmek. Kurallar tek yerde
 * duruyor çünkü üç ayrı yer aynı listeye dokunuyor — parfüm sayfasındaki
 * düğme, profil düzenleme ekranı ve sunucudaki Server Action. Üçü ayrı ayrı
 * denetleseydi biri gevşerdi.
 *
 * ⚠️ **Sıra anlamlı ve veride tutuluyor** (`position` sütunu). Diziyi
 * veritabanından sırasız çekip "nasılsa aynı" saymak, "birinci parfümüm"
 * iddiasını sessizce bozar.
 */

export const MAX_TOP_FOUR = 4;

export type TopFourError = 'tooMany' | 'duplicate' | 'unknown';

/**
 * Kuralı çiğneyen ilk şey, ya da `null`.
 *
 * Sunucu tarafının kapısı: uç herkese açık ve kimlik listesi istemciden
 * geliyor. Doğrulanmadan yazılırsa profilde var olmayan bir parfüm durur;
 * imza onu atlar, yani kullanıcı yuvasını kaybettiğini bile fark etmez.
 */
export function topFourError(ids: readonly string[]): TopFourError | null {
  if (ids.length > MAX_TOP_FOUR) return 'tooMany';
  if (new Set(ids).size !== ids.length) return 'duplicate';
  if (ids.some((id) => !hasPerfume(id))) return 'unknown';
  return null;
}

/**
 * Listeyi kurallara uydurur: bilinmeyeni atar, yinelemeyi tekleştirir,
 * dörtte keser. Sıra korunuyor.
 *
 * `topFourError`in affedici kardeşi. Reddetmenin doğru olduğu yer uç
 * (kullanıcı ne yaptığını bilir ve hata görmeli); bunun yeri **okuma**:
 * veriden bir parfüm çıkmışsa profil çökmez, kalanla çizilir.
 */
export function cleanTopFour(ids: readonly string[]): readonly string[] {
  const seen = new Set<string>();
  const clean: string[] = [];

  for (const id of ids) {
    if (clean.length >= MAX_TOP_FOUR) break;
    if (seen.has(id) || !hasPerfume(id)) continue;
    seen.add(id);
    clean.push(id);
  }

  return clean;
}

/**
 * Bir yuvayı doldurur, değiştirir ya da boşaltır.
 *
 * `null` boşaltıyor ve **arkası kayıyor**: boşluk bırakmak, üçüncüsünü silen
 * kişiye ortasında delik olan bir Top 4 gösterirdi.
 *
 * Zaten listede olan bir parfümü başka yuvaya koymak **taşımak** demek; eski
 * yuvasından kalkıyor. İki kopya bırakmak `duplicate` hatasına düşerdi ve
 * kullanıcı sebebini anlamazdı.
 */
export function setSlot(
  ids: readonly string[],
  slot: number,
  perfumeId: string | null,
): readonly string[] {
  if (!Number.isInteger(slot) || slot < 0 || slot >= MAX_TOP_FOUR) return ids;
  if (perfumeId !== null && !hasPerfume(perfumeId)) return ids;

  const next = [...ids];

  if (perfumeId === null) {
    next.splice(slot, 1);
    return next;
  }

  const existing = next.indexOf(perfumeId);
  if (existing !== -1 && existing !== slot) next.splice(existing, 1);

  const target = Math.min(slot, next.length);
  if (target < next.length) next[target] = perfumeId;
  else next.push(perfumeId);

  return next.slice(0, MAX_TOP_FOUR);
}
