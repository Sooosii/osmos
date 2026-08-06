/**
 * Yörüngedeki adların yerleşimi.
 *
 * Modül saf: React, DOM, canvas bilmiyor. Yazı genişliği bile dışarıdan geliyor
 * (`measure`) — ölçen şey tuvalin bağlamı, karar veren şey burası.
 *
 * ## Neden ayrı bir modül
 *
 * Yerleşim `NoteOrbit.tsx`in çizim döngüsünün içindeydi ve sınanamıyordu. Orada
 * **öndeki parfümün adı hiç görünmüyordu**: ad noktanın üstüne yazılıyor, öndeki
 * nokta ise ekranda merkezdeki nota diskinin altında duruyor, dolayısıyla adı tam
 * diskin üstüne düşüyor ve baştan rezerve edilmiş merkez kutusuna çarpıp
 * atlanıyordu. Susturulan şey her seferinde en büyük, en parlak, öne dönmüş
 * olandı — sahip ekranda gördü: "arkadakinin adı gözüküyor öndekinin gözükmüyor".
 *
 * Geometri deposunun kuralı: elle ölçülmüş bir sayı varsa onu bir sınama
 * denetler (`note-orbit.ts`). Yerleşim de bir geometri kararı; artık denetleniyor.
 *
 * ## Kural
 *
 * Adlar **öne çıkma sırasına** göre yerleşiyor: en öndeki ilk, arkadakiler ancak
 * yer kalırsa. Yer bulma üç adımlı:
 *
 *   ① noktanın üstü
 *   ② orası doluysa altı — tuvalin dışına taşmamak şartıyla
 *   ③ ikisi de doluysa yine üstü, bu kez merkez diskini engel saymadan
 *
 * **Merkez diski bir duvar değil, bir tercih.** ③ olmadan tek taşıyıcılı notalar
 * ekranda yanıp sönüyordu: `mango`nun tek parfümü diskin hizasından geçerken hem
 * üstü hem altı diskin kutusuna düşüyor ve sayfadaki TEK ad turun yarısında
 * kayboluyordu (ölçüldü: %48).
 *
 * Diskin üstüne yazmak zaten bir tutarsızlık üretmiyor: adlar ayrı bir geçişte,
 * her şeyin üstüne yazılıyor — disk hiçbir zaman gerçek bir örtücü değildi. ③'ün
 * son çare olması ise bilerek: ① veya ② boştayken kimse merkezin üstüne yazmıyor.
 *
 * Yazılmış bir ad her adımda engel. Adlar birbirine hiçbir koşulda binmiyor.
 */

/** Ekranda yer kaplayan bir dikdörtgen. Hepsi EKRAN pikselinde. */
export interface LabelBox {
  readonly x0: number;
  readonly y0: number;
  readonly x1: number;
  readonly y1: number;
}

/** Adı yazılmayı bekleyen bir nokta. */
export interface LabelCandidate {
  readonly id: string;
  readonly text: string;
  /** Noktanın merkezi — ad burada ortalanıyor. */
  readonly cx: number;
  readonly cy: number;
  /** Diskin yarıçapı; ad diskin dışından başlıyor. */
  readonly discRadius: number;
  /** Öne çıkma katsayısı, 0–1. Sıralama buna göre. */
  readonly fade: number;
}

export interface LabelLayout {
  readonly fontSize: number;
  /** Adın diskten ne kadar uzağa yazıldığı. */
  readonly rise: number;
  /** Kutulara nefes payı: harfler değmese de iki ad bitişikken tek kelime okunuyor. */
  readonly padding: number;
  /** Tuvalin alt kenarı. Altına taşan ad yazılmıyor. */
  readonly bottom: number;
  /** Elden geldiğince kaçınılan alanlar — merkezdeki nota diski. Duvar değil. */
  readonly reserved: readonly LabelBox[];
  readonly measure: (text: string) => number;
}

/** Yerleşmiş bir ad. `y` yazının taban çizgisi. */
export interface PlacedLabel {
  readonly id: string;
  readonly text: string;
  readonly x: number;
  readonly y: number;
  /** Ad noktanın altına mı düştü — yukarısı kapalıydı demek. */
  readonly below: boolean;
}

function overlaps(a: LabelBox, b: LabelBox): boolean {
  return a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0;
}

/**
 * Adları çakışmayacak şekilde yerleştirir.
 *
 * Dönen liste çizim sırası: önce yerleşen önce yazılıyor. Hiçbir kutu bir
 * diğeriyle veya rezerve alanlarla kesişmiyor — sınama bunu denetliyor.
 */
export function placeLabels(
  candidates: readonly LabelCandidate[],
  layout: LabelLayout,
): readonly PlacedLabel[] {
  const { fontSize, rise, padding, bottom, reserved, measure } = layout;

  const taken: LabelBox[] = [];
  const placed: PlacedLabel[] = [];

  const order = [...candidates].sort((a, b) => b.fade - a.fade);

  for (const candidate of order) {
    const half = measure(candidate.text) / 2;
    const boxAt = (baseline: number): LabelBox => ({
      x0: candidate.cx - half - padding,
      y0: baseline - fontSize,
      x1: candidate.cx + half + padding,
      y1: baseline + fontSize * 0.35,
    });

    /** Yazılmış adlar herkesi engelliyor; merkez diski yalnızca ① ve ②'yi. */
    const free = (box: LabelBox, avoidReserved: boolean): boolean =>
      !taken.some((other) => overlaps(box, other)) &&
      (!avoidReserved || !reserved.some((other) => overlaps(box, other)));

    const above = candidate.cy - candidate.discRadius - rise;
    const below = candidate.cy + candidate.discRadius + rise + fontSize;

    let baseline: number;
    let isBelow = false;

    if (free(boxAt(above), true)) {
      baseline = above;
    } else if (boxAt(below).y1 <= bottom && free(boxAt(below), true)) {
      baseline = below;
      isBelow = true;
    } else if (free(boxAt(above), false)) {
      baseline = above;
    } else {
      continue;
    }

    taken.push(boxAt(baseline));
    placed.push({ id: candidate.id, text: candidate.text, x: candidate.cx, y: baseline, below: isBelow });
  }

  return placed;
}
