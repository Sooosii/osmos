import { describe, expect, test } from 'vitest';
import { parseEndpoint, parseSubscription } from '@/lib/push-subscription';

/** Tarayıcının `PushSubscription.toJSON()` çıktısının gerçekçi bir örneği. */
const VALID = {
  endpoint: 'https://fcm.googleapis.com/fcm/send/dFx3P0aBc12',
  keys: {
    p256dh: 'BPusYd-2yQuVqIIZ3PdCEzZgnMyJdBTTijqOroMDT0Cy_DiBLuBBEUBaeUXeBcQDIALYFB6vGBn0T6DZC1s2Ceo',
    auth: 'sEcReT-auth_123',
  },
  lang: 'tr',
};

describe('parseSubscription', () => {
  test('gecerli kayit oldugu gibi gecer', () => {
    const sub = parseSubscription(VALID);
    expect(sub).toEqual(VALID);
  });

  test('nesne olmayan girdiler dusuyor', () => {
    for (const junk of [null, undefined, 42, 'metin', [VALID]]) {
      expect(parseSubscription(junk), String(junk)).toBeNull();
    }
  });

  test('https disinda endpoint dusuyor', () => {
    expect(parseSubscription({ ...VALID, endpoint: 'http://fcm.example/x' })).toBeNull();
    expect(parseSubscription({ ...VALID, endpoint: 'javascript:alert(1)' })).toBeNull();
    expect(parseSubscription({ ...VALID, endpoint: 'bozuk adres' })).toBeNull();
  });

  test('asiri uzun endpoint dusuyor', () => {
    const endpoint = `https://fcm.example/${'a'.repeat(2000)}`;
    expect(parseSubscription({ ...VALID, endpoint })).toBeNull();
  });

  test('anahtarlar base64url olmak zorunda', () => {
    expect(parseSubscription({ ...VALID, keys: { p256dh: 'içinde boşluk', auth: 'x' } })).toBeNull();
    expect(parseSubscription({ ...VALID, keys: { p256dh: 'a+b/c', auth: 'x' } })).toBeNull();
    expect(parseSubscription({ ...VALID, keys: { p256dh: '', auth: 'x' } })).toBeNull();
    expect(parseSubscription({ ...VALID, keys: { p256dh: 'x'.repeat(513), auth: 'x' } })).toBeNull();
    expect(parseSubscription({ ...VALID, keys: undefined })).toBeNull();
  });

  test('taninmayan dil dusuyor', () => {
    expect(parseSubscription({ ...VALID, lang: 'de' })).toBeNull();
    expect(parseSubscription({ ...VALID, lang: undefined })).toBeNull();
  });
});

describe('parseEndpoint', () => {
  test('silme govdesi ayni endpoint sinirlarindan gecer', () => {
    expect(parseEndpoint({ endpoint: VALID.endpoint })).toBe(VALID.endpoint);
    expect(parseEndpoint({ endpoint: 'http://fcm.example/x' })).toBeNull();
    expect(parseEndpoint({})).toBeNull();
    expect(parseEndpoint('metin')).toBeNull();
  });
});
