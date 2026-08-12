import type { Character, Perfume } from '@/data/types';
import { characterVector } from './similarity';

/**
 * Parfümün karakteri — notalarının ağırlıklı ortalaması, adlı hâliyle.
 *
 * Hesap yeni değil ve olmamalı: `similarity.ts`in `characterVector`ı bunu
 * uzayın izdüşümü için zaten yapıyor, aynı sayılar `SpaceMark.feel`in ve burun
 * raporunun da ham maddesi. Eksik olan tek şey künyede GÖRÜNMESİydi — sahip
 * "notaların karakteri var, parfümlerin yok" diye yakaladı. Bu modül diziyi
 * `Character`ın adlı alanlarına çeviriyor, başka bir şey yapmıyor.
 *
 * ⚠️ **Cetvel notalarınkiyle aynı ve öyle kalmalı** (−1…+1). Sahip böyle seçti;
 * künyede karakter bölümünün hemen altında notaların aynı eksenleri duruyor ve
 * okur ikisini yan yana kıyaslayabiliyor. 52 parfüm ve 136 nota üzerinde
 * ölçüldü:
 *
 *   eksen      parfüm aralığı  nota aralığı   |x| ≥ 0.4 olan
 *   sıcaklık   −0.45 … 0.65    −1.00 … 0.90   12/52  ↔  89/136
 *   doku       −0.52 … 0.53    −0.90 … 1.00   10/52  ↔  78/136
 *   temizlik   −0.39 … 0.67    −1.00 … 0.90   16/52  ↔  71/136
 *   yakınlık   −0.30 … 0.56    −0.90 … 0.80    4/52  ↔  71/136
 *
 * Yani parfümün çubuğu notanınkinin kabaca yarısı kadar doluyor. Bu bir kusur
 * değil, ölçünün söylediği şeyin ta kendisi: **bir karışım hiçbir zaman
 * malzemesi kadar uçta değil.** Ayrım yine de okunuyor — Viride −0.45 soğukta,
 * Baraonda +0.59 sıcakta duruyor.
 *
 * 52'yi tam genişliğe yayan bir normalleştirme daha "okunaklı" çubuklar verirdi
 * ama ortadaki çizgi "nötr" değil "52'nin ortası" demeye başlar, notalarla
 * kıyaslanamaz olurdu ve yeni parfüm eklendikçe herkesin değeri kayardı —
 * `SpaceMark.feel`in ⚠️'si (`data/types.ts`) tam olarak bunu anlatıyor. Uzayda
 * o cetvel doğru, çünkü orada soru "bu 52'nin neresinde"; künyede bu cetvel
 * doğru, çünkü burada soru "bu nasıl bir şey".
 *
 * Saf: DOM'a, React'e, sözlüğe dokunmuyor.
 */
export function characterOf(perfume: Perfume): Character {
  const [temperature, texture, cleanliness, proximity] = characterVector(perfume);
  return { temperature, texture, cleanliness, proximity };
}
