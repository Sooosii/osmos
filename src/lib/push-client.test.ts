import { describe, expect, test } from 'vitest';
import { vapidKeyBytes } from '@/lib/push-client';

describe('vapidKeyBytes', () => {
  test('bilinen vektor: AQID → 1 2 3', () => {
    expect([...vapidKeyBytes('AQID')]).toEqual([1, 2, 3]);
  });

  test('base64url karakterleri ve dolgusuz uzunluk cozuluyor', () => {
    /* '-' ile '_' base64url'e özgü; dolgu eklemeyi çevirinin kendisi yapıyor. */
    expect([...vapidKeyBytes('-_8')]).toEqual([251, 255]);
  });
});
