/**
 * Yaklaşma — sitenin kapısı.
 *
 * Uzay artık doğrudan açılmıyor: çok uzaktan başlıyor ve kaydırdıkça yaklaşıyor.
 * İşi bilgi vermek değil, **eşik** olmak — uzay hemen gelmesin, kazanılsın.
 *
 * Buranın asıl fikri şu: ortada ayrı bir "açılış sahnesi" yok. Sahnede
 * kaydırmanın anlamı "yaklaş", uzayda tekerleğin anlamı da "yaklaş" — aynı
 * girdi, aynı anlam. Yani sahne, uzayın kendisi; yalnızca kamera daha uzakta.
 * Ölçek 0.14'ten 1'e çıkıyor, oradan elin altında `MAX_SCALE`'e kadar devam
 * ediyor: tek, kesintisiz bir zoom.
 *
 * Bu yüzden burada yeni bir görsel dil yok. `drawSpace` zaten her ölçekte doğru
 * çiziyor, `pixelsPerUnit` zaten bulutun sınırlarına oturuyor; bu modülün ürettiği
 * tek şey bir sayı — kameranın ölçeği.
 *
 * ⚠️ Aynı tuzağa iki kez düşmemek için: `space-entry.ts` bir girdiye ikinci anlam
 * yüklemenin nasıl battığını anlatıyor (kaydırarak giriş). Burada o sorun **yok**,
 * çünkü ikinci bir anlam yüklenmiyor — sahne bitene kadar tekerleğin tek bir
 * anlamı var, sahne bitince aynı anlam uzaya devrediliyor. İki mod arka arkaya,
 * asla aynı anda.
 *
 * React, canvas ve DOM'a bağımlılığı yok; `space-camera.ts` ile aynı sözleşme.
 */

/**
 * İlk karedeki ölçek — bulut ekranın ~%14'ü kadar.
 *
 * İki uç denendi: 0.04 gerçekten sinematik ama isimsiz bir sahneyle birleşince
 * ekran fazla boş kalıyor ("neredeyim" değil, "ne yapacağım" sorusu doğuyor).
 * 0.25 ise kümeyi ilk karede okunur yapıyor ve "uzaktan geliyorum" hissini
 * öldürüyor — sahne bir açılış animasyonuna dönüşüyor. Ortadan biraz uzak.
 */
export const START_SCALE = 0.14;

/**
 * `progress` 0'dan 1'e çıkarken harcanan toplam tekerlek yolu (deltaY birimi).
 *
 * Tipik bir fare çentiği ~100; yani yaklaşma ~5 çentik sürüyor. `ENTRY_DISTANCE`
 * (900, ~9 çentik) bilerek daha uzun: parfüme girmek geri dönülmez bir hareket,
 * kapıdan girmek değil. Eşik, duvar olmayacak kadar kısa.
 */
export const APPROACH_DISTANCE = 500;

/**
 * Uzaktayken ekranda ne dursun.
 *
 * `'mark'` — sessiz bir im; yalnızca "kaydırılabilir" diyor, başka hiçbir şey
 * söylemiyor. `'name'` — yalnızca OSMOS, harfleri aralıklı.
 *
 * Hiç yazı koymamak da denenebilirdi ama korkulan boşluk "neredeyim" sorusu
 * değil, "ne yapacağım" sorusu — ve ona bir isim de cevap vermiyor. Bu yüzden
 * varsayılan im: kimliği değil, hareketi söylüyor.
 *
 * Ekranda görülüp karara bağlanacak; o yüzden tek sabit.
 */
export const APPROACH_CUE: 'mark' | 'name' = 'mark';

/**
 * Sahne her ziyarette mi, oturumda bir kez mi?
 *
 * `false` — her seferinde: kapı hep kapı, tutarlı ve törensel.
 * `true`  — bir kez: varış hissi bir kere yaşanır, günlük kullanımda duvar olmaz.
 *
 * Bu da ekranda görülüp karara bağlanacak. Hangi tarafın doğru olduğu sahneyi
 * ikinci, üçüncü kez görmeden bilinemez.
 */
export const APPROACH_ONCE = false;

/** `APPROACH_ONCE` açıkken sahnenin görüldüğünü işaretleyen anahtar. */
export const APPROACH_SEEN_KEY = 'osmos:approached';

export interface ApproachState {
  /** 0 = en uzak, 1 = uzay yerinde. */
  readonly progress: number;
}

export const APPROACH_START: ApproachState = { progress: 0 };
export const APPROACH_DONE: ApproachState = { progress: 1 };

function clamp01(value: number): number {
  return Math.min(Math.max(value, 0), 1);
}

/**
 * Tekerlek adımını ilerlemeye çevirir.
 *
 * İşaret `space-entry.ts` ile aynı: negatif deltaY = içeri, yani yaklaşma yönü.
 *
 * Geri kaydırmak ilerlemeyi **geri sarıyor**, sıfırlamıyor. Kullanıcı hızın
 * sahibi; yarı yolda durup geri bakmak isteyene "baştan başla" demek, eşiği
 * cezaya çevirirdi.
 */
export function advance(state: ApproachState, deltaY: number): ApproachState {
  return { progress: clamp01(state.progress - deltaY / APPROACH_DISTANCE) };
}

/**
 * İlerlemeden ölçek — **üstel**, doğrusal değil.
 *
 * Yakınlaşma çarpımsal bir şey: her çentik ölçeği aynı *oranda* büyütüyor.
 * Uzayın kendi tekerleği de öyle çalışıyor (`Math.exp(-delta * WHEEL_SENSITIVITY)`).
 * Doğrusal olsaydı sahnenin sonu ile uzayın başı arasında hız birden değişir,
 * devir teslim anında gözle görülür bir kırılma olurdu — "kesintisiz zoom"
 * iddiasının düştüğü tek yer orasıydı.
 *
 * Uçlar tam oturuyor: `scaleAt(0) === START_SCALE`, `scaleAt(1) === 1`.
 */
export function scaleAt(progress: number): number {
  return START_SCALE * (1 / START_SCALE) ** progress;
}

export function isComplete(state: ApproachState): boolean {
  return state.progress >= 1;
}
