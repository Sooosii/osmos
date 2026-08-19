import { memoryAllowed, redisPipeline, redisTarget, redisCommand } from './redis-rest';

/**
 * Çıkış tıklaması sayacı — turnike.
 *
 * Satılan şeyin adı "kapı": harita ziyaretçiyi müşterinin **kendi ürün
 * sayfasına** bırakıyor. Teklif metni bunu dürüstçe itiraf ediyordu
 * (`docs/b2b/teklif.md`): *"This does not sell anything by itself."* Ölçülemeyen
 * bir söz, €490'ı bir inanç sıçraması, €290/yıl yenilemeyi ise savunulamaz
 * yapıyordu — yenilemenin arkasında gösterilecek tek bir rakam yoktu.
 *
 * Bu modül o rakamı üretiyor: kapıdan geçen sayılıyor.
 *
 * ⚠️ **Kim değil, ne sayılıyor.** Kayıt yalnız `(parfüm, satıcı)` çiftinin o ay
 * kaç kez tıklandığı. Ziyaretçiye ait hiçbir şey — IP, çerez, oturum, sıra —
 * yazılmıyor ve yazılamaz: anahtar biçiminde onlara yer yok.
 *
 * ⚠️ **Eksik sayıyor, fazla değil.** Sayım tarayıcıdaki `sendBeacon`la
 * başlıyor; reklam engelleyici ya da JavaScript kapalıysa tıklama hiç
 * ulaşmıyor. Yönlendirme (`/git?url=...`) tam sayardı ama `href`i gerçek
 * adresten koparırdı — dürüstlük iddiası üstüne kurulmuş bir sitede fareyle
 * üstüne gelince başka bir adres göstermek bedava bir güven kaybı. Seçim
 * bilinçli: müşteriye verilen rakam bir **taban**, ve rapor bunu söylüyor.
 *
 * Tek anahtar yaşıyor:
 *   `tiklama:<kiracı>:<YYYY-MM>` — hash; alan = `<parfüm id>|<satıcı adı>`,
 *                                  değer = o ayki tıklama sayısı.
 *
 * Ay ayrı anahtar olduğu için aylık rapor tek `HGETALL`. Kiracı öneki
 * ayırıyor: kiracılar aynı Upstash örneğini paylaşsa bile sayaçları
 * karışmıyor.
 *
 * ⚠️ Env yokken davranış `push-store.ts` ile birebir aynı: üretimde depo
 * "hazır değil" (uç 503), geliştirme ve sınamada bellek içi harita. Bellek
 * yolu üretimde bilerek kapalı — sessizce kaybolan sayaç, olmayan sayaçtan
 * kötüdür: rapora yanlış rakam yazdırırdı.
 */

/** Alan adının iki parçasını ayıran işaret. Katalogda geçmediğini sınama tutuyor. */
export const ALAN_AYRAC = '|';

/**
 * Sayaç anahtarının ömrü — son tıklamadan 400 gün sonra.
 *
 * Her tıklamada tazeleniyor (kayan). Ayın hash'i küçük, ama kiracı gelip
 * gidiyor ve terk edilmiş bir kiracının sayaçları sonsuza kadar durmamalı.
 * 400 gün, yıllık raporun bir sonraki yenilemeye kadar okunabilmesi için
 * gereken 12 ayın üstünde duruyor.
 */
const TTL_SANIYE = 400 * 24 * 60 * 60;

export interface TiklamaSatiri {
  readonly perfumeId: string;
  readonly retailer: string;
  readonly sayi: number;
}

/** `2026-08` — sayaç anahtarının ay dilimi. UTC, sunucunun saat diliminden bağımsız. */
export function ayDilimi(now: Date): string {
  const yil = now.getUTCFullYear();
  const ay = String(now.getUTCMonth() + 1).padStart(2, '0');
  return `${yil}-${ay}`;
}

export function sayacAnahtari(tenantId: string, ay: string): string {
  return `tiklama:${tenantId}:${ay}`;
}

export function alanAdi(perfumeId: string, retailer: string): string {
  return `${perfumeId}${ALAN_AYRAC}${retailer}`;
}

/** Uç bunu 503'e çevirir; depo yokken tarayıcıya yarım söz verilmez. */
export function storeReady(): boolean {
  return redisTarget() !== null || memoryAllowed();
}

const memorySayaclar = new Map<string, Map<string, number>>();

/** Yalnızca sınamalar için — bellek yolu sınamalar arasında sızmasın. */
export function __clearMemoryStore(): void {
  memorySayaclar.clear();
}

function requireTarget() {
  const target = redisTarget();
  if (target) return target;
  if (memoryAllowed()) return null;
  /* Rota storeReady() ile korunuyor; burası savunma hattı. */
  throw new Error('Tıklama sayacı yapılandırılmadı (KV_REST_API_URL / _TOKEN)');
}

/**
 * Bir tıklamayı say.
 *
 * `HINCRBY` + `EXPIRE` tek boru hattında — hız sınırının (`rate-limit.ts`)
 * kurduğu desenin aynısı. İki ayrı gidiş-dönüş, sayan şeyin kendisini
 * yavaşlatan şey hâline gelirdi.
 */
export async function tiklamaSay(
  tenantId: string,
  perfumeId: string,
  retailer: string,
  now: Date,
): Promise<void> {
  const anahtar = sayacAnahtari(tenantId, ayDilimi(now));
  const alan = alanAdi(perfumeId, retailer);

  const target = requireTarget();
  if (!target) {
    const ay = memorySayaclar.get(anahtar) ?? new Map<string, number>();
    ay.set(alan, (ay.get(alan) ?? 0) + 1);
    memorySayaclar.set(anahtar, ay);
    return;
  }

  await redisPipeline(target, [
    ['HINCRBY', anahtar, alan, '1'],
    ['EXPIRE', anahtar, String(TTL_SANIYE)],
  ]);
}

/** Ham `HGETALL` çıktısını satırlara çevirir. Saf — sınamanın tuttuğu yer burası. */
export function satirlariCoz(flat: readonly string[]): readonly TiklamaSatiri[] {
  const satirlar: TiklamaSatiri[] = [];
  for (let i = 0; i < flat.length - 1; i += 2) {
    const alan = flat[i];
    const sayi = Number(flat[i + 1]);
    /*
      Bozuk tek bir alan bütün raporu düşürmesin — atlanır. Rapor müşteriye
      gidiyor; eksik bir satır, hiç rapor gitmemesinden iyidir.
    */
    if (!Number.isFinite(sayi)) continue;
    const ayrac = alan.indexOf(ALAN_AYRAC);
    if (ayrac <= 0) continue;
    satirlar.push({
      perfumeId: alan.slice(0, ayrac),
      retailer: alan.slice(ayrac + ALAN_AYRAC.length),
      sayi,
    });
  }
  return satirlar.toSorted((a, b) => b.sayi - a.sayi);
}

/** Bir ayın bütün sayaçları, çoktan aza sıralı. Raporun okuduğu yer. */
export async function ayinTiklamalari(
  tenantId: string,
  ay: string,
): Promise<readonly TiklamaSatiri[]> {
  const anahtar = sayacAnahtari(tenantId, ay);

  const target = requireTarget();
  if (!target) {
    const bellek = memorySayaclar.get(anahtar);
    if (!bellek) return [];
    const flat: string[] = [];
    for (const [alan, sayi] of bellek) flat.push(alan, String(sayi));
    return satirlariCoz(flat);
  }

  const flat = (await redisCommand(target, ['HGETALL', anahtar])) as readonly string[];
  return satirlariCoz(flat ?? []);
}
