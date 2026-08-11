import { describe, expect, test } from 'vitest';
import { SHELF_KINDS, groupShelf, isShelfKind, type ShelfEntry } from '@/lib/shelf';

describe('isShelfKind', () => {
  test('uc raf kabul ediliyor', () => {
    for (const kind of SHELF_KINDS) {
      expect(isShelfKind(kind)).toBe(true);
    }
  });

  test('baska her sey reddediliyor', () => {
    /*
      ⚠️ Sütun `text`; veritabanı "owned mı wishlist mi" diye sormuyor. Kapı
      burası ve uç herkese açık — `kind` istemciden geliyor.
    */
    for (const value of ['', 'OWNED', 'sahibim', 'have', null, undefined, 3, {}]) {
      expect(isShelfKind(value)).toBe(false);
    }
  });
});

describe('groupShelf', () => {
  const entries: readonly ShelfEntry[] = [
    { perfumeId: 'a', kind: 'owned' },
    { perfumeId: 'b', kind: 'wishlist' },
    { perfumeId: 'c', kind: 'owned' },
    { perfumeId: 'd', kind: 'tried' },
  ];

  test('uc rafa ayiriyor', () => {
    expect(groupShelf(entries)).toEqual({
      owned: ['a', 'c'],
      tried: ['d'],
      wishlist: ['b'],
    });
  });

  test('bos girdide uc raf da bos dizi — eksik anahtar yok', () => {
    /* Ekran üç bölümü de okuyor; `undefined` gelen bir raf sayfayı çökertirdi. */
    expect(groupShelf([])).toEqual({ owned: [], tried: [], wishlist: [] });
  });

  test('taninmayan raf sessizce eleniyor', () => {
    /*
      Okuma tarafı affedici (`cleanTopFour`in gerekçesi): sütun `text` olduğu
      için bir gün elle yazılmış ya da eskimiş bir satır gelebilir; profil
      onun yüzünden çökmemeli.
    */
    const dirty = [
      { perfumeId: 'a', kind: 'owned' },
      { perfumeId: 'x', kind: 'sahibim' },
    ] as readonly ShelfEntry[];

    expect(groupShelf(dirty).owned).toEqual(['a']);
  });

  test('sira korunuyor', () => {
    const many: readonly ShelfEntry[] = [
      { perfumeId: 'c', kind: 'owned' },
      { perfumeId: 'a', kind: 'owned' },
      { perfumeId: 'b', kind: 'owned' },
    ];
    expect(groupShelf(many).owned).toEqual(['c', 'a', 'b']);
  });
});
