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
export const MAX_DROPS = 1800;

/**
 * En seyrek sis — küçük ekranda bile bu kadarı çıkıyor.
 *
 * ⚠️ Taban ölçülerek ayarlandı. Önce yükseltildi (sahip telefonda sisi hiç
 * göremiyordu), sonra zerreler parçacık boyuna inince geri çekildi: dar
 * ekranda ağzın sağında zaten az yer var ve fazla zerre orada yayılamayıp
 * yumak oluyor. Alan hesabı 390×844'te 329 veriyor, taban artık onun altında
 * kalıyor ve karar alana bırakılıyor.
 */
export const MIN_DROPS = 300;

/**
 * Koninin yarı açısı (rad) ve ekseni — sağa, yukarı doğru.
 *
 * ⚠️ Koni genişledi ve ekseni yukarı çevrildi. Sebebi iki tane: sahip "çok
 * içiçe bir bulut" dedi — dar koni zerreleri aynı yola dizip üst üste
 * bindiriyordu; bir de dar ekranda ağız zaten sağ kenarda, boş olan yer
 * YUKARISI.
 */
export const CONE_SPREAD = 0.55;
export const SPRAY_ANGLE = -0.34;

/** Tek tıslamanın süresi ve tepe anı (ms). */
export const HISS_MS = 220;
export const HISS_PEAK_MS = 55;

/** Figürün kendi sisinin içinde tamamen eridiği an (ms). */
export const FIGURE_GONE_MS = 620;

/** Perdenin devralındığı an (ms) — kapının uzaması bu tek sabitte. */
export const HANDOFF_MS = 700;

/** Son zerrenin de öldüğü an (ms). */
export const SPRAY_MS = 2400;

/**
 * Sisin yukarı çekilişi (px/s²) — "buhar" okuması bundan geliyor.
 *
 * ⚠️ 26'dan iki kez yükseltildi ve ikisi de telefonda ölçüldü. Ağız ekranın
 * sağ kenarına yakın duruyor: sağa giden zerreler görünmeden dışarı çıkıyor,
 * yani genişleyecek yer YUKARISI — üstelik telefon ekranı uzun. 58'de tutam
 * hâlâ 55×70 px'lik bir yumaktı; sürüklenme yükselişi de sönümlediği için
 * (uçuş hızı ≈ RISE/sürüklenme) sayı yeterince büyük olmalı.
 */
const RISE = 160;

function clamp01(value: number): number {
  return Math.min(Math.max(value, 0), 1);
}

export interface PuffOptions {
  readonly origin: { readonly x: number; readonly y: number };
  readonly count: number;
  /** Koninin ekseni; verilmezse `SPRAY_ANGLE`. Gerekçe `sprayAngle`da. */
  readonly angle?: number;
  /**
   * Ekran ölçeği — yarıçapı, büyümeyi ve **hızı** birden sürüyor.
   *
   * ⚠️ Hız eskiden ölçeklenmiyordu ve bu bir kusurdu: 220–740 px/s, 390 px
   * genişliğindeki bir telefonda ekranı yarım saniyede geçmek demek. Sis
   * görünmeden dağılıyordu. Püskürtmenin tamamı ekranla orantılı olmak zorunda.
   */
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
    const angle = (options.angle ?? SPRAY_ANGLE) + spread;
    /*
      ⚠️ Hız 220–740'tan düşürüldü. Zerrenin kat ettiği yol kabaca
      `hız / sürüklenme`; eski değerlerle bu 260 px ediyordu ve 390 px'lik bir
      ekranda ağızdan çıkan parçacıkların yarısı ölçüldü — görünmeden dışarı
      çıkıyorlardı. Şimdi tutam ağzın yanında kalıp yükseliyor.
    */
    /*
      ⚠️ Hız KAREYLE dağılıyor, düz değil: `r * r` çoğu zerreyi yavaş tarafta
      topluyor, birkaçını uzağa fırlatıyor. Düz dağılımda hepsi kabaca aynı
      mesafede duruyor ve tutam sıkı bir yumağa dönüşüyordu — sahibin
      "çok içiçe bulut" dediği şey. Kuyruklu bir tutam, hem daha seyrek hem
      daha canlı.
    */
    const speed = (110 + 820 * random() ** 2) * scale;

    drops.push({
      x: options.origin.x,
      y: options.origin.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      age: 0,
      life: 900 + random() * 1400,
      /*
        ⚠️ **Zerre büyümüyor, bulut AÇILIYOR.**

        Sahip ekranda gördü: "çok yapay bi toz birikimi var gibi, onu
        parçacıklar hâline getir." Sebebi buradaydı — yarıçap 5'ten başlayıp
        saniyede 55–145 px büyüyordu, yani 1.5 saniyede 200 px'lik lekelere
        dönüşüyor ve üst üste binip tek bir bulanık kütle oluyorlardı.

        Gerçek bir püskürtmede zerre şişmiyor; bulut, zerrelerin birbirinden
        UZAKLAŞMASIYLA açılıyor. Genişleme artık hız dağılımından ve
        türbülanstan geliyor, yarıçaptan değil: her zerre kendi başına
        görünen bir parçacık olarak kalıyor.
      */
      radius: (1.1 + random() * 3) * scale,
      growth: (1.2 + random() * 3.5) * scale,
      /*
        ⚠️ Sürüklenme 1.4–2.6'dan yükseltildi. Zerrenin kat ettiği yol kabaca
        `hız / sürüklenme`; eski değerlerle bu 250 px ediyordu ve 390 px'lik bir
        ekranda ağızdan çıkan sis doğruca dışarı gidiyordu. Yüksek sürüklenme
        jeti hemen yavaşlatıp BULUTA çeviriyor — gerçek bir atomizör de öyle.
      */
      drag: 1.8 + random() * 1.4,
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

    /*
      ⚠️ Sürüklenme TAM ÇÖZÜMLE uygulanıyor (`exp(-drag·dt)`), `v -= v·drag·dt`
      ile değil. Ikincisi açık Euler ve sürüklenme sertleştikçe `dt`ye duyarlı
      hâle geliyor: sınama tam bu yüzden kırıldı (60 Hz ile 120 Hz arasında
      %2.07 fark). Üstel sönüm `dt`den bağımsız ve zaten fiziğin doğrusu.
    */
    const decay = Math.exp(-drop.drag * dt);
    drop.vx = (drop.vx + ax * dt) * decay;
    drop.vy = (drop.vy + ay * dt) * decay;

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
 *
 * ⚠️ **Yoğunluk ölçülerek ayarlandı** (2026-08-13). Sahip telefonda sisi hiç
 * göremedi, masaüstünde "az" buldu. Ölçü, ekrana düşen ortalama toplamalı
 * opaklık — "mürekkep"; toplamalı harmanlamada 1.0 civarı beyaza doyma demek.
 * Sis modülü Node'da gerçek sayılarla sürülüp ölçüldü:
 *
 *   an        telefon (390×844)   masaüstü (1440×900)
 *   önce      0.015 (görünmez)    0.036 (soluk)
 *   256 ms    0.04                0.05
 *   512 ms    0.06                0.10
 *   **768 ms  0.07 ← tepe         0.11 ← tepe**
 *   1280 ms   0.04                0.07
 *   1792 ms   0.01                0.01
 *
 * Yani telefonda ~4.5, masaüstünde ~3 kat yoğunlaştı. Daha ileri gidilmedi:
 * zerre başına opaklık 0.2'yken bulutun çekirdeği (~10 kat üst üste binme)
 * beyaza doyup leke oluyordu.
 */
export function mistBudget(width: number, height: number, coarse: boolean): number {
  const raw = Math.round((width * height) / 700) * (coarse ? 0.7 : 1);
  return Math.round(Math.min(Math.max(raw, MIN_DROPS), MAX_DROPS));
}

/**
 * Ağzın sağında bu kadar yer varsa koni olduğu gibi kalıyor (ekran payı).
 */
const ROOM_ENOUGH = 0.35;

/** Yer kalmadığında koninin yukarı çevrileceği en büyük açı (rad). */
const TILT_MAX = 0.7;

/**
 * Püskürtmenin ekseni — ağzın sağında kalan yere göre.
 *
 * ⚠️ Telefonda çekilip görüldü: figür ekranın çoğunu kapladığı için ağız sağ
 * kenara dayanıyor ve sis daha doğmadan kırpılıyordu — köşede küçük bir leke.
 * Sağa yer yoksa boş olan yer YUKARISI, üstelik telefon ekranı uzun. Geniş
 * ekranda hiçbir şey değişmiyor: koni referans fotoğraftaki gibi yana gidiyor.
 *
 * Figürü küçültmek de bir çözümdü ve reddedildi: sahip figürün okunmasını
 * ayrıca istemişti, küçültmek onu geri bozardı.
 */
export function sprayAngle(nozzleX: number, viewportWidth: number): number {
  const room = viewportWidth > 0 ? (viewportWidth - nozzleX) / viewportWidth : 1;
  const tight = 1 - Math.min(Math.max(room, 0) / ROOM_ENOUGH, 1);
  return SPRAY_ANGLE - tight * TILT_MAX;
}

/**
 * Zerrelerin ekrana göre boyu.
 *
 * ⚠️ Bu ölçek eskiden figürün IZGARA oranından geliyordu (`cssW / figW`) ve
 * ızgara 88'den 120 sütuna çıkınca sessizce %27 küçüldü — telefonda zerreler
 * bir pikselin altına indi ve sis görünmez oldu. Ölçü artık ızgaraya değil
 * **ekrana** bağlı: sisin işi okunmak, hücre saymak değil.
 *
 * Taban 0.7: küçük ekranda orantılı küçülmek doğru ama görünmezliğe kadar
 * gitmemeli. Tavan 1.2: büyük ekranda zerre lekeye dönüşmesin.
 */
export function mistScale(width: number, height: number): number {
  return Math.min(Math.max(Math.min(width, height) / 800, 0.7), 1.2);
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
