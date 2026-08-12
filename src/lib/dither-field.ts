/**
 * Sıralı tram (Bayer) eşiği.
 *
 * ⚠️ **Burada bir zamanlar tam ekran, hareketli bir alan vardı** — nota
 * sayfasının arkasındaki `DitherBackdrop`. Sahip ekranda gördü ve kaldırttı:
 * sürekli oynayan bir zemin göz yoruyor ve sayfanın okunmasını zorlaştırıyor.
 * Alan da, onu süren `tuneField`/`fieldValue` de gitti; geriye eşiğin kendisi
 * kaldı — ömür şeridi (`note-measures.ts`) hâlâ onu kullanıyor.
 *
 * ⚠️ **Giderken bırakılan ders, bir gün yeniden tam ekran bir zemin denenirse
 * diye:** aile rengi öyle bir yüzeye **ham girmez.** Doygun renkler bütün
 * ekranı kaplayıp hareket edince göz yoruyor. O alanda renk önce kendi
 * parlaklığına doğru karıştırılıp doygunluğunun yalnız %28'i bırakılıyor, sonra
 * parlaklığı 95–155 bandına çekiliyordu; tavan aldehitli (#D8E4F0) gibi parlak
 * aileleri indiriyor, taban deri (#6B4423) gibi koyuları görünür kılıyordu.
 * Şerit, yörünge ve tepedeki ışık tam renkte kalıyor — orada renk küçük bir
 * alanda ve duruyor.
 *
 * Saf: DOM'a, canvas'a, `@/` yoluna dokunmuyor — sınamalar bu yüzden çalışıyor.
 */

/**
 * Bayer 4×4 sıralı tram matrisi.
 *
 * `NoteOrbit` ile aynı matris ve bu bilinçli: iki yüzey aynı dokuyu paylaşınca
 * sayfa tek bir elden çıkmış gibi okunuyor, ayrı iki efekt gibi değil.
 * Değerler 0–15; eşiğe çevirirken 16'ya bölünüyor.
 */
export const BAYER_4X4: readonly number[] = [
  0, 8, 2, 10,
  12, 4, 14, 6,
  3, 11, 1, 9,
  15, 7, 13, 5,
];

/**
 * Hücrenin tram eşiği, 0–1.
 *
 * Izgara **ekran pikselinde** sabit — geometriyle birlikte ölçeklenirse doku
 * dağılıyor. Bu ders `NoteOrbit`te ekranda öğrenildi ve bir kez daha
 * yapılmasın diye buraya yazıldı.
 */
export function ditherThreshold(x: number, y: number): number {
  return BAYER_4X4[(y & 3) * 4 + (x & 3)] / 16;
}
