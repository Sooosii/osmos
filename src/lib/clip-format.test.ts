import { describe, expect, test } from 'vitest';
import { CLIP_TYPES, clipFileName, pickClipType } from '@/lib/clip-format';

const only = (...supported: string[]) => ({
  isTypeSupported: (type: string) => supported.includes(type),
});

describe('pickClipType', () => {
  test('mp4 varken mp4 seciliyor', () => {
    /*
      ⚠️ Sıra "hangisi daha iyi sıkıştırır" değil, "hangisi paylaşılabilir":
      klip Instagram hikâyesine ya da TikTok'a atılacak ve webm'i bazıları
      hiç kabul etmiyor.
    */
    expect(pickClipType(only('video/mp4;codecs=avc1', 'video/webm;codecs=vp9'))).toBe(
      'video/mp4;codecs=avc1',
    );
  });

  test('mp4 yoksa webm e dusuyor', () => {
    expect(pickClipType(only('video/webm;codecs=vp9'))).toBe('video/webm;codecs=vp9');
  });

  test('hicbiri yoksa null — dugme hic cizilmiyor', () => {
    expect(pickClipType(only())).toBeNull();
  });

  test('MediaRecorder olmayan tarayicida null', () => {
    expect(pickClipType(undefined)).toBeNull();
  });

  test('aday listesi bos degil ve hepsi video', () => {
    expect(CLIP_TYPES.length).toBeGreaterThan(0);
    for (const type of CLIP_TYPES) expect(type.startsWith('video/')).toBe(true);
  });
});

describe('clipFileName', () => {
  test('uzanti bicimden geliyor', () => {
    expect(clipFileName('sooosii', 'video/mp4;codecs=avc1')).toBe('sooosii-signature.mp4');
    expect(clipFileName('sooosii', 'video/webm;codecs=vp9')).toBe('sooosii-signature.webm');
  });

  test('adsizda da gecerli bir dosya adi', () => {
    expect(clipFileName('', null)).toBe('osmos-signature.webm');
  });
});
