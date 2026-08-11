/**
 * İmleç tozu — uzayda imlecin ardında parıldayan zerreler.
 *
 * ⚠️ **three.js ALINMADI ve alınmayacak.** Sahibin getirdiği örnek WebGL
 * shader'larıyla yazılmıştı ve yeni bir çizim kütüphanesi demekti; site
 * bugüne kadar her şeyi elle yazılmış canvas 2D ile çiziyor ve README ile
 * duyuru metinleri bunu açıkça söylüyor ("no charting library"). Aynı etki
 * birkaç yüz zerreyle 2D'de çıkıyor — dither-field ve astronot kararlarının
 * üçüncü tekrarı: referansın *biçimi* alınır, altyapısı değil.
 *
 * ⚠️ **Renk taşımıyor ve bu bilinçli.** Sitede **renk = koku ailesi**;
 * imlecin ardına renkli zerre serpmek o kodu bozardı — kırmızı bir parıltı
 * "baharatlı" der gibi görünürdü. Zerreler sıcak beyaz: ışığı yakalayan toz,
 * bir anlam taşımıyor. Üstelik uzay zaten renkli noktalarla dolu; renkli toz
 * onlarla yarışırdı.
 *
 * Saf tutuluyor: fizik burada, çizim bileşende. Ömür ve sönme sınanabiliyor.
 */

export interface Speck {
  x: number;
  y: number;
  /** Piksel/kare cinsinden hız. */
  vx: number;
  vy: number;
  /** 1'den 0'a iner; 0'da zerre ölür. */
  life: number;
  /** Ömrün her karede azaldığı miktar. */
  decay: number;
  size: number;
  /** Parıltının fazı — hepsi aynı anda yanıp sönmesin diye. */
  phase: number;
}

/** Kaç zerre canlı tutulabilir; üstü sessizce atılıyor. */
export const MAX_SPECKS = 420;

/**
 * İmlecin iki karesi arasına zerre serpiyor.
 *
 * ⚠️ Zerreler noktaya değil **yola** dağıtılıyor: hepsi son konuma
 * bırakılsaydı hızlı hareket eden imleç ardında boncuk dizisi bırakırdı,
 * süreklilik değil. Ara noktalar bu yüzden hesaplanıyor.
 *
 * Sayı hıza bağlı: duran imleç toz üretmiyor (ekranda kalıcı bir leke
 * olurdu), hızlı imleç daha çok üretiyor.
 */
export function emit(
  specks: Speck[],
  from: { x: number; y: number },
  to: { x: number; y: number },
  random: () => number = Math.random,
): void {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const distance = Math.hypot(dx, dy);
  if (distance < 0.5) return;

  const count = Math.min(14, Math.max(1, Math.round(distance / 6)));

  for (let i = 0; i < count; i += 1) {
    if (specks.length >= MAX_SPECKS) break;
    const t = (i + random()) / count;
    const angle = random() * Math.PI * 2;
    const push = random() * 0.5;

    specks.push({
      x: from.x + dx * t,
      y: from.y + dy * t,
      vx: Math.cos(angle) * push,
      vy: Math.sin(angle) * push - 0.08,
      life: 1,
      /* Ömürler farklı: hepsi aynı anda sönerse iz kesik kesik kaybolur. */
      decay: 0.012 + random() * 0.016,
      size: 0.6 + random() * 1.5,
      phase: random() * Math.PI * 2,
    });
  }
}

/**
 * Bir kareyi ilerletir ve ölenleri atar.
 *
 * Dizi **yerinde** değiştiriliyor: her karede yeni dizi kurmak 60 kez/saniye
 * çöp üretmek demek.
 */
export function step(specks: Speck[]): void {
  let write = 0;

  for (let read = 0; read < specks.length; read += 1) {
    const speck = specks[read];
    speck.life -= speck.decay;
    if (speck.life <= 0) continue;

    speck.x += speck.vx;
    speck.y += speck.vy;
    /* Hafif sürtünme: zerreler savrulup gitmiyor, duruyor ve sönüyor. */
    speck.vx *= 0.96;
    speck.vy *= 0.96;
    speck.phase += 0.18;

    specks[write] = speck;
    write += 1;
  }

  specks.length = write;
}

/** Zerrenin o karedeki opaklığı — sönme ve parıltı birlikte. */
export function alphaOf(speck: Speck): number {
  const twinkle = 0.55 + Math.sin(speck.phase) * 0.45;
  return Math.max(0, speck.life * twinkle);
}
