/**
 * Hareketli imzanın kayıt biçimi.
 *
 * Tarayıcılar aynı biçimleri desteklemiyor: Chromium webm/VP9 veriyor,
 * Safari yalnızca mp4. Sıra bilerek **mp4 ile başlıyor**: klip telefona
 * indirilip Instagram hikâyesine ya da TikTok'a atılacak ve o uygulamaların
 * hepsi mp4'ü sorunsuz alıyor; webm'i bazıları hiç kabul etmiyor. Yani
 * "hangisi daha iyi sıkıştırır" değil, "hangisi paylaşılabilir" sorusu.
 *
 * Saf tutuluyor ki sıra ve yedekler sınanabilsin; `MediaRecorder` dışarıdan
 * veriliyor, tarayıcı olmayan yerde de çağrılabiliyor.
 */
export const CLIP_TYPES: readonly string[] = [
  'video/mp4;codecs=avc1',
  'video/mp4',
  'video/webm;codecs=vp9',
  'video/webm;codecs=vp8',
  'video/webm',
];

export interface TypeChecker {
  isTypeSupported(type: string): boolean;
}

/** Desteklenen ilk biçim, hiçbiri yoksa `null`. */
export function pickClipType(checker: TypeChecker | undefined): string | null {
  if (!checker) return null;
  return CLIP_TYPES.find((type) => checker.isTypeSupported(type)) ?? null;
}

/** Dosya adı — biçimden uzantı türetiliyor. */
export function clipFileName(username: string, type: string | null): string {
  const extension = type?.startsWith('video/mp4') ? 'mp4' : 'webm';
  return `${username || 'osmos'}-signature.${extension}`;
}
