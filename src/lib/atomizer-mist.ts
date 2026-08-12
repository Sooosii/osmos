/**
 * Açılışın sisi — atomizörün tek tıslaması.
 *
 * Sahip açılıştaki astronotun yerine eski bir parfüm atomizörü istedi: basınca
 * fışlasın, tozlar havada görünsün ve yayılsın, "canlı olsun, sabit duragan
 * yapay olmasın". Sisin nereye gideceğine de karar verildi — sis dağılıp
 * kaybolmuyor, **perdenin kendisi oluyor**: büyüyüp ekranı kaplıyor ve uzaya
 * geçiş onun içinden oluyor. Tek hareket, ikinci bir adım yok.
 *
 * ⚠️ `glitter.ts` KARE tabanlı (`step`in `dt`si yok) ve burada kopyalanmadı.
 * 120 Hz'lik bir ekranda iki kat hızlı akıyor; imleç izinde görünmez ama süresi
 * bir DURUM GEÇIŞINI tetikleyen sis için ölümcül olurdu: kapı bazı cihazlarda
 * yarı sürede açılırdı. Bu modül `dt` sürüyor, sınaması da onu tutuyor.
 *
 * Saf: DOM'a, canvas'a dokunmuyor; rastgelelik dışarıdan geçiyor.
 */

export interface Drop {
  x: number;
  y: number;
  /** Piksel/SANIYE — kare değil. */
  vx: number;
  vy: number;
  /** Yaşadığı süre ve toplam ömrü (ms). */
  age: number;
  life: number;
  /** Yarıçap (px) ve büyüme hızı (px/s). */
  radius: number;
  growth: number;
  /** Sürüklenme katsayısı (1/s) — her zerre kendi ağırlığında. */
  drag: number;
  /** Türbülans: genlik (px/s²), açısal hız (rad/ms), faz. */
  swirl: number;
  swirlW: number;
  phase: number;
  /** Opaklık bandı — kalabalıkta derinlik. */
  band: number;
}

/** Ekranda aynı anda duracak en fazla zerre. */
export const MAX_DROPS = 640;

/** Koninin yarı açısı (rad) ve ekseni — sağa, hafif yukarı. */
export const CONE_SPREAD = 0.42;
export const SPRAY_ANGLE = -0.18;

/** Tek tıslamanın süresi ve tepe anı (ms). */
export const HISS_MS = 220;
export const HISS_PEAK_MS = 55;

/** Figürün kendi sisinin içinde tamamen eridiği an (ms). */
export const FIGURE_GONE_MS = 620;

/** Perdenin devralındığı an (ms) — kapının uzaması bu tek sabitte. */
export const HANDOFF_MS = 700;

/** Son zerrenin de öldüğü an (ms). */
export const SPRAY_MS = 2400;

/** Sisin yukarı çekilişi (px/s²) — "buhar" okuması bundan geliyor. */
const RISE = 26;

function clamp01(value: number): number {
  return Math.min(Math.max(value, 0), 1);
}

export interface PuffOptions {
  readonly origin: { readonly x: number; readonly y: number };
  readonly count: number;
  /** Ekran ölçeği: aynı püskürtme telefonda da aynı okunsun. */
  readonly scale?: number;
  readonly random?: () => number;
}

/**
 * Ağızdan koni içine zerre serper.
 *
 * ⚠️ Hiçbir sayı paylaşılmıyor — hız, ömür, sürüklenme, büyüme ve türbülans
 * frekansı zerre başına ayrı çekiliyor. Arka plandaki nokta alanının "ortak
 * ritim yok" sözleşmesinin aynısı, sebebi de aynı: paylaşılan tek bir sayı,
 * gözün hemen yakaladığı yapay bir tekrar üretiyor.
 */
export function emitPuff(drops: Drop[], options: PuffOptions): void {
  const random = options.random ?? Math.random;
  const scale = options.scale ?? 1;

  for (let index = 0; index < options.count; index += 1) {
    if (drops.length >= MAX_DROPS) return;

    /*
      Koninin çekirdeği yoğun: iki rastgele sayının ortalaması ortaya toplanıyor.
      Düz dağılımda püskürtme, sis değil açılmış bir yelpaze gibi görünüyordu.
    */
    const spread = ((random() + random()) / 2 - 0.5) * 2 * CONE_SPREAD;
    const angle = SPRAY_ANGLE + spread;
    const speed = 220 + random() * 520;

    drops.push({
      x: options.origin.x,
      y: options.origin.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      age: 0,
      life: 900 + random() * 1400,
      radius: (2.5 + random() * 4) * scale,
      growth: (26 + random() * 46) * scale,
      drag: 1.4 + random() * 1.2,
      swirl: random() * 90,
      swirlW: 0.0012 + random() * 0.0026,
      phase: random() * Math.PI * 2,
      band: 0.35 + random() * 0.65,
    });
  }
}

/**
 * Sisi bir adım ilerletir; ölenleri atar.
 *
 * Dizi **yerinde** değişiyor: kare başına yeni dizi ayırmak çöp toplayıcıyı
 * açılışın en kritik anında çalıştırıyor — `glitter.step`in aynı kararı.
 */
export function stepMist(drops: Drop[], dtMs: number): void {
  const dt = Math.max(dtMs, 0) / 1000;
  let write = 0;

  for (let read = 0; read < drops.length; read += 1) {
    const drop = drops[read];
    drop.age += Math.max(dtMs, 0);
    if (drop.age >= drop.life) continue;

    const ax = Math.cos(drop.age * drop.swirlW + drop.phase) * drop.swirl;
    const ay =
      Math.sin(drop.age * drop.swirlW * 1.31 + drop.phase * 1.7) * drop.swirl * 0.7 - RISE;

    drop.vx += ax * dt;
    drop.vy += ay * dt;

    drop.vx -= drop.vx * drop.drag * dt;
    drop.vy -= drop.vy * drop.drag * dt;

    drop.x += drop.vx * dt;
    drop.y += drop.vy * dt;
    drop.radius += drop.growth * dt;

    drops[write] = drop;
    write += 1;
  }

  drops.length = write;
}

/**
 * Zerrenin o andaki opaklığı: doğuş, plato, sönüş.
 *
 * Sönüş karesel — doğrusal olsaydı sis son karesinde topluca "kapanıyor" gibi
 * görünüyordu; kareseli incelerek dağılıyor.
 */
export function dropAlpha(drop: Drop): number {
  const attack = Math.min(drop.age / 120, 1);
  const decay = (1 - clamp01(drop.age / drop.life)) ** 2;
  return clamp01(drop.band * attack * decay);
}

/** Tıslamanın şekli: tek tepeli, iki ucu sıfır. */
function hissShape(t: number): number {
  const peak = HISS_PEAK_MS / HISS_MS;
  const b = 2;
  const a = (peak * b) / (1 - peak);
  return t ** a * (1 - t) ** b;
}

/**
 * Tıslamanın birikimli eğrisi — 0'dan t'ye kadar şeklin altında kalan alanın
 * payı. Kurulumda bir kez örnekleniyor.
 */
const HISS_STEPS = 240;
const HISS_CUM = (() => {
  const table = new Float64Array(HISS_STEPS + 1);
  let acc = 0;
  for (let i = 1; i <= HISS_STEPS; i += 1) {
    acc += hissShape((i - 0.5) / HISS_STEPS);
    table[i] = acc;
  }
  const total = table[HISS_STEPS] || 1;
  for (let i = 0; i <= HISS_STEPS; i += 1) table[i] /= total;
  return table;
})();

/**
 * Tıslamanın başından bu ana kadar çıkmış olması gereken zerre sayısı.
 *
 * ⚠️ **Anlık hız değil BIRIKIM** ve bu ölçülerek düzeltildi. Önce "o anda
 * saniyede kaç zerre" veren bir işlev vardı; bileşen onu kare başına
 * örnekliyordu. Tarayıcıda denendi: kare hızı düştüğünde (görünmeyen sekme,
 * yavaş cihaz, geçişin ilk karesi) 220 ms'lik tıslama penceresi **iki karenin
 * arasına düşüyor** ve hiç zerre çıkmıyordu — kapı sissiz açılıyordu.
 *
 * Birikimle bu imkânsız: bileşen "şu ana kadar kaç zerre olmalıydı"yı soruyor,
 * kaç kare geçtiğinin önemi yok. Tek bir kare bile tıslamanın tamamını
 * doğurabiliyor.
 */
export function hissTotal(elapsedMs: number, budget: number): number {
  if (elapsedMs <= 0) return 0;
  if (elapsedMs >= HISS_MS) return budget;

  const x = (elapsedMs / HISS_MS) * HISS_STEPS;
  const index = Math.floor(x);
  const frac = x - index;
  const low = HISS_CUM[index];
  const high = HISS_CUM[Math.min(index + 1, HISS_STEPS)];

  return (low + (high - low) * frac) * budget;
}

/**
 * Sisin figürü ne kadar yuttuğu, 0…1.
 *
 * Bir kez 1 olunca geri dönmüyor: figür kendi sisinin içinde eriyor ve geri
 * gelmesi "sis dağıldı, hâlâ buradayım" derdi — oysa o an kapı çoktan açılmış
 * oluyor.
 */
export function coverAt(elapsedMs: number): number {
  return clamp01(Math.max(elapsedMs, 0) / FIGURE_GONE_MS) ** 1.5;
}

/**
 * Ekrana göre zerre bütçesi.
 *
 * Kaba işaretçide (telefon) düşüyor: aynı sayıda zerre orada hem gereksiz
 * (ekran küçük) hem pahalı. Arka plandaki nokta alanı da ekranla ölçekleniyor.
 */
export function mistBudget(width: number, height: number, coarse: boolean): number {
  const raw = Math.round((width * height) / 3400) * (coarse ? 0.55 : 1);
  return Math.round(Math.min(Math.max(raw, 160), MAX_DROPS));
}

export interface SampledCell {
  readonly col: number;
  readonly row: number;
  readonly luma: number;
}

/** Ağzın aranacağı üst bant — figürün ilk yarısı. */
export const NOZZLE_BAND = 0.5;

/**
 * Ağzın hücre koordinatı: üst bandın EN SAĞDAKI hücresi.
 *
 * ⚠️ Piksel yazmamanın tek yolu bu. SVG rötuşlandığında elle güncellenecek bir
 * sayı kalmıyor; tek şart geometrik ve okunabilir: **ağız, üst yarının en
 * sağındaki şey olsun.** Aynı sütunda birden çok hücre varsa ORTANCASI
 * alınıyor — ucun üçgeni birkaç satıra yayılıyor ve en üst satır ucun kendisi
 * değil kenarı.
 */
export function nozzleCell(
  cells: readonly SampledCell[],
  cols: number,
  rows: number,
): { readonly col: number; readonly row: number } {
  const band = cells.filter((cell) => cell.row <= rows * NOZZLE_BAND);
  if (band.length === 0) return { col: cols - 1, row: Math.round(rows * 0.35) };

  let col = band[0].col;
  for (const cell of band) col = Math.max(col, cell.col);

  const rowsAt = band
    .filter((cell) => cell.col === col)
    .map((cell) => cell.row)
    .sort((a, b) => a - b);

  return { col, row: rowsAt[Math.floor(rowsAt.length / 2)] };
}
