import { FAMILIES, getFamily } from '@/data/families';
import type { ScentFamily } from '@/data/types';
import { noseOf } from './nose';
import { familyVector } from './similarity';

/**
 * Uzayın kimliği — kendi kataloğundan türetilen renk.
 *
 * Sahibin büyüme fikri: *"Farklı renk, farklı açılışı olan uzaylar."* Ama
 * sitede **renk = koku ailesi** ve bu kural üç kez ayrı ayrı korundu (imleç
 * tozu, raf halkaları, arka plan kanalları). Uzaylara elle renk seçmek onu
 * delerdi: aynı kırmızı bir yerde "baharatlı", başka yerde "uzay 2" demeye
 * başlardı. O yüzden renk uydurulmuyor, ölçülüyor.
 *
 * ⚠️ **Renk BASKIN aile DEĞİL, AYIRT EDEN aile — ve bu ölçümle seçildi.**
 * İlk tasarım baskın aileyi kullanıyordu; üç uzayda da `gourmand` çıktı, yani
 * üç renk de aynı `#D9A066` olurdu ve "kimlik" diye eklenen şey hiçbir şeyi
 * ayırmazdı. Sebep istatistik: 150 parfümlük katalogdan alınan ~50'lik
 * gruplar katalogun ortalamasına yakınsıyor. Ölçülmeden yazılsaydı iş bittikten
 * sonra anlaşılırdı.
 *
 * Şimdiki ölçü **fazlalık**: uzayın aile payı ile bütün haritanın aile payı
 * arasındaki fark. "Bu uzayda haritanın geri kalanından çok olan aile."
 * Bugünkü değerler: uzay 1 mineral, uzay 2 fruity, uzay 3 citrus — üçü de
 * ayrı renk.
 *
 * ⚠️ Farklar küçük (1.7–1.9 puan), yani yeni parfüm eklendiğinde kazanan
 * değişebilir. Bu bir kusur değil — veri değişince kimlik de değişir — ama
 * SESSİZCE olmamalı: `space-identity.test.ts` bugünkü üçlüyü tutuyor ve
 * kaydığında kırılıyor. Kırıldığında yapılacak şey sınamayı güncellemek değil,
 * yeni rengin ekranda iyi durup durmadığına bakmak.
 *
 * ⚠️ **Yeni motor YAZILMADI — numaranın BEŞİNCİ tekrarı.** Uzayın parfümleri
 * `noseOf` ile tek sentetik parfümde birleşiyor (`composition.ts` → `nose.ts`
 * → `shelf.ts` zincirinin aynısı) ve `familyVector` olduğu gibi çalışıyor.
 *
 * ⚠️ Bu modül **sunucuda kalmalı**: `noseOf` bütün parfüm veritabanını okuyor.
 * İstemciye yalnızca sonuç iniyor — bir aile adı ve bir hex.
 */
export interface SpaceIdentity {
  readonly family: ScentFamily;
  readonly color: string;
}

/**
 * Aile paylarının toplamı 1 olan hâli.
 *
 * Pay alınıyor çünkü karşılaştırma **büyüklükten bağımsız** olmak zorunda:
 * 52 parfümlük uzayla 49 parfümlük uzayın ham aile toplamları zaten farklı
 * çıkar ve fark ölçüsü uzayın boyutunu ölçmeye dönüşürdü.
 */
function familyShares(perfumeIds: readonly string[]): readonly number[] | null {
  const merged = noseOf(perfumeIds, []);
  if (!merged) return null;

  const vector = familyVector(merged);
  const total = vector.reduce((sum, value) => sum + value, 0);
  if (total === 0) return null;

  return vector.map((value) => value / total);
}

export function spaceIdentity(
  spacePerfumeIds: readonly string[],
  universePerfumeIds: readonly string[],
): SpaceIdentity {
  const mine = familyShares(spacePerfumeIds);
  const universe = familyShares(universePerfumeIds);

  /*
    Boş uzay çizilecek noktası olmayan bir harita demek; `buildTenantSpaces` de
    aynı sebeple patlıyor. Sessizce bir renk uydurmak, kimliği anlamsız kılardı.
  */
  if (!mine || !universe) {
    throw new Error('Uzayın kimliği hesaplanamadı: katalog boş.');
  }

  let winner = 0;
  for (let index = 1; index < mine.length; index += 1) {
    if (mine[index] - universe[index] > mine[winner] - universe[winner]) winner = index;
  }

  /* Eşitlikte `FAMILIES` sırası kazanıyor: kimlik derlemeden derlemeye oynamaz. */
  const family = FAMILIES[winner].id;
  return { family, color: getFamily(family).color };
}
