import { describe, expect, test } from 'vitest';
import type { Perfume } from './types';
import {
  SPACE_CAPACITY,
  buildPerfumeSpaces,
  findPerfumeSpaceId,
} from './perfume-spaces';
import { PERFUMES, PERFUME_SPACES } from './perfumes';

function perfume(id: string): Perfume {
  return {
    id,
    name: id,
    brand: 'Test',
    year: 2026,
    notes: [],
    curated: true,
  };
}

describe('parfüm uzayları', () => {
  test('yayındaki katalog üç dengeli uzaya ayrılır', () => {
    expect(PERFUMES).toHaveLength(150);
    expect(PERFUME_SPACES.map((space) => space.perfumes.length)).toEqual([52, 49, 49]);
    expect(findPerfumeSpaceId(PERFUME_SPACES, 'min-new-york-long-board')).toBe(1);
    expect(findPerfumeSpaceId(PERFUME_SPACES, 'penhaligons-savoy-steam-edp')).toBe(2);
    expect(findPerfumeSpaceId(PERFUME_SPACES, 'goldfield-banks-bohemian-lime')).toBe(2);
    expect(findPerfumeSpaceId(PERFUME_SPACES, 'parle-moi-de-parfum-une-tonne-de-roses-8')).toBe(3);
    expect(findPerfumeSpaceId(PERFUME_SPACES, 'miller-et-bertaux-shanti-shanti')).toBe(3);
  });

  test('genişleme uzaylarının yayın verisi tam ve nota kimlikleri parfüm içinde benzersizdir', () => {
    for (const perfume of PERFUME_SPACES.slice(1).flatMap((space) => space.perfumes)) {
      expect(perfume.notes.length, `${perfume.id}: nota yok`).toBeGreaterThan(0);
      expect(new Set(perfume.notes.map((note) => note.noteId)).size, `${perfume.id}: yinelenen nota`).toBe(
        perfume.notes.length,
      );
      expect(perfume.line?.en.trim().length, `${perfume.id}: İngilizce cümle yok`).toBeGreaterThan(0);
      expect(perfume.line?.tr.trim().length, `${perfume.id}: Türkçe cümle yok`).toBeGreaterThan(0);
    }
  });

  test('kullanıcının kısa ve birleşik yazımları arama takma adlarında korunur', () => {
    expect(PERFUMES.find((perfume) => perfume.id === 'kyse-douceur-brulee')?.aliases).toContain(
      'Douceur de Vanille',
    );
    expect(PERFUMES.find((perfume) => perfume.id === 'kyse-serenade-aux-fraises')?.aliases).toContain(
      'Sérénade',
    );
    expect(PERFUMES.find((perfume) => perfume.id === 'milano-fragranze-naviglio')?.aliases).toContain(
      'Naviglio Milano Fragranze',
    );
    expect(PERFUMES.find((perfume) => perfume.id === 'keiko-mecheri-bois-satin')?.aliases).toContain(
      'Peau de Satin',
    );
  });

  test('ilk 52 kaydı dondurur ve genişlemeyi kapasiteyi aşmadan dengeler', () => {
    const legacy = Array.from({ length: SPACE_CAPACITY }, (_, index) =>
      perfume(`legacy-${index + 1}`),
    );
    const expansion = Array.from({ length: SPACE_CAPACITY + 1 }, (_, index) =>
      perfume(`new-${index + 1}`),
    );

    const spaces = buildPerfumeSpaces(legacy, expansion);

    expect(spaces.map((space) => space.id)).toEqual([1, 2, 3]);
    expect(spaces.map((space) => space.perfumes.length)).toEqual([52, 27, 26]);
    expect(spaces[0].perfumes[0].id).toBe('legacy-1');
    expect(spaces[1].perfumes[0].id).toBe('new-1');
    expect(spaces[2].perfumes[0].id).toBe('new-28');
  });

  test('parfümün gerçek uzayını bulur ve bilinmeyene null döner', () => {
    const legacy = Array.from({ length: SPACE_CAPACITY }, (_, index) =>
      perfume(`legacy-${index + 1}`),
    );
    const spaces = buildPerfumeSpaces(legacy, [perfume('new-1')]);

    expect(findPerfumeSpaceId(spaces, 'legacy-52')).toBe(1);
    expect(findPerfumeSpaceId(spaces, 'new-1')).toBe(2);
    expect(findPerfumeSpaceId(spaces, 'missing')).toBeNull();
  });

  test('aynı kimliğin iki uzaya girmesini reddeder', () => {
    const legacy = Array.from({ length: SPACE_CAPACITY }, (_, index) =>
      perfume(index === 0 ? 'duplicate' : `legacy-${index + 1}`),
    );

    expect(() => buildPerfumeSpaces(legacy, [perfume('duplicate')])).toThrow(
      'Parfüm kimliği iki uzayda birden tanımlanmış: duplicate',
    );
  });

  test('donmuş ilk uzayın kapasite dışında kurulmasını reddeder', () => {
    expect(() => buildPerfumeSpaces([perfume('only-one')], [])).toThrow(
      'Uzay 1 tam 52 parfüm içermeli; alınan: 1',
    );
  });
});
