import { describe, expect, test } from 'vitest';
import { PERFUMES, getPerfume } from '@/data/perfumes';
import { similarity } from '@/lib/similarity';
import { SHARED_NOTE_LIMIT, SIMILAR_COUNT, sharedNotes, similarTo } from '@/lib/similar';

const anchor = PERFUMES[0];

describe('sharedNotes', () => {
  test('parfumun kendisiyle ortagi kendi notalari', () => {
    const shared = sharedNotes(anchor, anchor);
    const ids = new Set(shared.map((entry) => entry.noteId));
    for (const id of ids) {
      expect(anchor.notes.some((note) => note.noteId === id)).toBe(true);
    }
    expect(shared.length).toBeGreaterThan(0);
  });

  test('paylasilan miktar ASGARI — ortalama ya da toplam degil', () => {
    /*
      ⚠️ Kararın kalbi. Bir parfümde 1.0, ötekinde 0.1 duran bir nota "ortak"
      diye güçlü gösterilseydi liste yalan söylerdi. Asgari, gerçekten
      paylaşılanı veriyor.
    */
    const a = { ...anchor, notes: [{ noteId: 'oud', tier: 'base' as const, weight: 1.0 }] };
    const b = { ...anchor, notes: [{ noteId: 'oud', tier: 'base' as const, weight: 0.1 }] };
    expect(sharedNotes(a, b)).toEqual([{ noteId: 'oud', shared: 0.1 }]);
  });

  test('cok paylasilandan aza sirali', () => {
    for (const perfume of PERFUMES.slice(0, 8)) {
      const shared = sharedNotes(anchor, perfume).map((entry) => entry.shared);
      expect([...shared].sort((x, y) => y - x)).toEqual(shared);
    }
  });

  test('ust sinir asilmiyor', () => {
    expect(sharedNotes(anchor, anchor).length).toBeLessThanOrEqual(SHARED_NOTE_LIMIT);
  });

  test('ortak notasi olmayan cift bos donuyor', () => {
    const a = { ...anchor, notes: [{ noteId: 'oud', tier: 'base' as const, weight: 1 }] };
    const b = { ...anchor, notes: [{ noteId: 'vanilla', tier: 'base' as const, weight: 1 }] };
    expect(sharedNotes(a, b)).toEqual([]);
  });
});

describe('similarTo', () => {
  const list = similarTo(anchor.id);

  test('parfumun KENDISI listede yok', () => {
    expect(list.some((entry) => entry.perfumeId === anchor.id)).toBe(false);
  });

  test('benzerlikten zayifa sirali', () => {
    const scores = list.map((entry) => entry.score);
    expect([...scores].sort((a, b) => b - a)).toEqual(scores);
  });

  test('kunyedeki bes komsudan FAZLASINI veriyor — sayfanin var olma sebebi', () => {
    /*
      ⚠️ Aynı beş komşuyu ikinci bir adreste tekrar yayınlamak ince bir kapı
      sayfası olurdu. Bu sayfa hem daha uzun bir liste hem paylaşılan notalar
      veriyor; ikisi de künyede yok.
    */
    expect(SIMILAR_COUNT).toBeGreaterThan(5);
    expect(list).toHaveLength(SIMILAR_COUNT);
  });

  test('ilk sirada gercekten en benzeyen var', () => {
    const best = [...PERFUMES]
      .filter((perfume) => perfume.id !== anchor.id)
      .sort((a, b) => similarity(anchor, b) - similarity(anchor, a))[0];
    expect(list[0].perfumeId).toBe(best.id);
  });

  test('ortak notasi olmayan komsu LISTEDEN DUSMUYOR', () => {
    /*
      Benzerlik üç kanaldan geliyor; iki parfüm tek bir malzemeyi paylaşmadan
      da benzeyebilir. Onu gizlemek haritanın nasıl çalıştığını yanlış
      anlatmak olurdu — ekran "ortak notası yok" diyecek.
    */
    const tek = similarTo('juliette-has-a-gun-not-a-perfume');
    expect(tek).toHaveLength(SIMILAR_COUNT);
  });

  test('her kimlik veride gercekten var', () => {
    for (const entry of list) expect(() => getPerfume(entry.perfumeId)).not.toThrow();
  });

  test('kararli — ayni girdi ayni liste', () => {
    expect(similarTo(anchor.id)).toEqual(list);
  });
});
