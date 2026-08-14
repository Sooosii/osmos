/**
 * Yörünge izdüşümü — iki takımyıldızın paylaştığı kamera matematiği.
 *
 * `neighbor-orbit.ts` ve `note-orbit.ts` aynı dünyada duruyor: yatay bir düzlemde
 * dönen noktalar, yukarıdan hafifçe eğik bakan bir kamera, gerçek perspektif.
 * Matematik ikisinde de birebir aynıydı; ayrışan şey **değerler**, formül değil.
 *
 * Bu yüzden sabitler burada DEĞİL, çağıranda duruyor. İki sahnenin tuval ölçüsü,
 * yarıçap aralığı ve nokta sayısı farklı (komşularda hep üç, notada 1–26), ve
 * `PITCH`/`FOCAL` her birinde ekranda ayrı ayrı ayarlandı. Ortak bir sabit
 * seti uydurmak ikisinin de kalibrasyonunu bozardı.
 *
 * Modül saf: React, DOM, SVG bilmiyor ve hiçbir şey import etmiyor —
 * `evolution-loop.ts` ile aynı sözleşme. Saflık eskiden
 * araç zorunluluğuydu (`vitest.config.*` yoktu, `@/` çözülmüyordu);
 * `vitest.config.mts` geldikten sonra tercih — sınama veri katmanını hiç ayağa
 * kaldırmadan çalışıyor.
 */

/** Sahnenin kamerası. Her takımyıldız kendi değerlerini veriyor. */
export interface OrbitCamera {
  /**
   * Düzlemin dikliği — kameranın aşağı bakış açısı, radyan.
   *
   * Ekrandaki elipsin dikey yarıçapı `radius · sin(pitch)`. Sıfır olsaydı halka
   * düz bir çizgiye çöker, derinlik hiç okunmazdı.
   */
  readonly pitch: number;
  /** Perspektifin sertliği; büyüdükçe izdüşüm ortogonale yaklaşır. */
  readonly focal: number;
  readonly centerX: number;
  readonly centerY: number;
}

/** Bir noktanın ekran karşılığı. */
export interface ProjectedPoint {
  readonly x: number;
  readonly y: number;
  /** Perspektif büyütmesi; öndeki 1'in üstünde, arkadaki altında. */
  readonly scale: number;
  /** Kameraya göre derinlik; büyükse uzakta. Çizim sırası buna göre. */
  readonly z: number;
}

/**
 * Yatay düzlemdeki bir noktayı ekrana indirir.
 *
 * `y` dikey eksen (yükseklik), `z` kameraya doğru olan derinlik. Önce kamera
 * eğimi uygulanıyor, sonra perspektif bölmesi.
 */
export function projectPoint(
  x: number,
  y: number,
  z: number,
  camera: OrbitCamera,
): ProjectedPoint {
  const y1 = y * Math.cos(camera.pitch) - z * Math.sin(camera.pitch);
  const z1 = y * Math.sin(camera.pitch) + z * Math.cos(camera.pitch);

  const scale = camera.focal / (camera.focal + z1);
  return {
    x: camera.centerX + x * scale,
    y: camera.centerY + y1 * scale,
    scale,
    z: z1,
  };
}

/**
 * Ölçeği 0–1 aralığında bir sönümleme katsayısına açar.
 *
 * Perspektif ölçeği 1 civarında salınıyor; çizimin istediği şey ise "öndeki
 * parlasın, arkadaki sönsün" diyebileceği düz bir katsayı. Eşik ve genişlik
 * çağırana bırakıldı çünkü iki sahnenin ölçek salınımı farklı: yarıçap aralığı
 * genişledikçe salınım da genişliyor.
 */
export function fadeFromScale(scale: number, floor: number, span: number): number {
  return Math.min(Math.max((scale - floor) / span, 0), 1);
}
