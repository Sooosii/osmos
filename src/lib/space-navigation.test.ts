import { describe, expect, test } from 'vitest';
import {
  WARP_DURATION_MS,
  adjacentSpaceId,
  resolveSpaceId,
  searchForPerfume,
  searchForSpace,
  warpFrame,
} from './space-navigation';

const spaces = [
  { id: 1, marks: [{ id: 'one-a' }, { id: 'one-b' }] },
  { id: 2, marks: [{ id: 'two-a' }] },
  { id: 3, marks: [{ id: 'three-a' }] },
] as const;

describe('uzay gezinmesi', () => {
  test('parfüm kimliği istenen uzayla çelişirse parfümün gerçek uzayını seçer', () => {
    expect(resolveSpaceId(spaces, '1', 'two-a')).toBe(2);
  });

  test('geçerli uzayı seçer, geçersiz değeri ilk uzaya düşürür', () => {
    expect(resolveSpaceId(spaces, '3', null)).toBe(3);
    expect(resolveSpaceId(spaces, '99', null)).toBe(1);
    expect(resolveSpaceId(spaces, 'not-a-number', null)).toBe(1);
  });

  test('yalnız var olan komşu uzaya gider', () => {
    expect(adjacentSpaceId(spaces, 1, -1)).toBeNull();
    expect(adjacentSpaceId(spaces, 1, 1)).toBe(2);
    expect(adjacentSpaceId(spaces, 2, -1)).toBe(1);
    expect(adjacentSpaceId(spaces, 3, 1)).toBeNull();
  });

  test('ok geçişinde seçim ve filtreyi temizler, diğer parametreleri korur', () => {
    const current = new URLSearchParams('space=1&mark=one-a&feel=0.8,,0.2&ref=mail');

    expect(searchForSpace(current, 2)).toBe('?space=2&ref=mail');
    expect(searchForSpace(new URLSearchParams('space=2&mark=two-a'), 1)).toBe('');
  });

  test('ışınlanma hedef buluta tam yarıda geçer ve sürenin sonunda biter', () => {
    expect(WARP_DURATION_MS).toBe(450);
    expect(warpFrame(224)).toMatchObject({ showTarget: false, done: false });
    expect(warpFrame(225)).toMatchObject({ showTarget: true, done: false });
    expect(warpFrame(450)).toEqual({ progress: 1, showTarget: true, done: true });
  });
});

describe('perfume space return address', () => {
  test('includes its non-default space', () => {
    expect(searchForPerfume(1, 'legacy-one')).toBe('?mark=legacy-one');
    expect(searchForPerfume(2, 'new-one')).toBe('?space=2&mark=new-one');
  });
});
