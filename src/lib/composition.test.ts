import { describe, expect, test } from 'vitest';
import { NOTES } from '@/data/notes';
import { PERFUMES } from '@/data/perfumes';
import { MAX_COMPOSITION_NOTES, MIN_COMPOSITION_NOTES, asPerfume, compositionError } from '@/lib/composition';
import { nearestToComposition } from '@/lib/composition-nearest';

const note = (id: string, weight = 0.6, tier: 'top' | 'heart' | 'base' = 'heart') => ({
  noteId: id,
  tier,
  weight,
});

/** Philosykos'un kendi notaları — kopyası kendisine en yakın çıkmalı. */
const philosykos = PERFUMES.find((p) => p.id === 'diptyque-philosykos')!;

describe('compositionError', () => {
  test('gecerli kompozisyon hata vermiyor', () => {
    expect(compositionError([note('oud'), note('iris'), note('bergamot')])).toBeNull();
  });

  test('cok az nota reddediliyor', () => {
    /* Tek notalık bir "parfüm" bir kompozisyon değil; eğri de anlamsız çıkar. */
    expect(compositionError([note('oud')])).toBe('tooFew');
    expect(compositionError([])).toBe('tooFew');
  });

  test('cok fazla nota reddediliyor', () => {
    const many = NOTES.slice(0, MAX_COMPOSITION_NOTES + 1).map((n) => note(n.id));
    expect(compositionError(many)).toBe('tooMany');
  });

  test('ayni nota iki kez olamaz', () => {
    expect(compositionError([note('oud'), note('oud'), note('iris')])).toBe('duplicate');
  });

  test('bilinmeyen nota reddediliyor', () => {
    expect(compositionError([note('yok-boyle-nota'), note('iris')])).toBe('unknown');
  });

  test('agirlik araligin disinda olamaz', () => {
    expect(compositionError([note('oud', 0), note('iris')])).toBe('weight');
    expect(compositionError([note('oud', 1.5), note('iris')])).toBe('weight');
  });
});

describe('asPerfume', () => {
  test('motorun bekledigi sekle donuyor', () => {
    /*
      ⚠️ Kompozisyonun bütün değeri bu satırda: taslak `Perfume` şeklini
      aldığı an benzerlik, evrim ve uzay hesabı OLDUĞU GİBİ çalışıyor.
      Yeni bir motor yazılmadı.
    */
    const draft = asPerfume([note('oud'), note('iris')], 'Gece');
    expect(draft.name).toBe('Gece');
    expect(draft.notes).toHaveLength(2);
    expect(draft.curated).toBe(false);
    expect(typeof draft.year).toBe('number');
  });

  test('bilinmeyen nota sekle girmiyor', () => {
    expect(asPerfume([note('oud'), note('yok-boyle-nota')], 'X').notes).toHaveLength(1);
  });
});

describe('nearestToComposition', () => {
  test('bir parfumun kopyasi kendisini buluyor', () => {
    /*
      En sağlam doğrulama: var olan bir parfümün notaları girilirse en yakın
      sonuç o parfümün kendisi olmalı. Motor doğru bağlanmadıysa burası kırılır.
    */
    const copy = philosykos.notes.map((n) => ({ ...n }));
    const near = nearestToComposition(copy, 3);
    expect(near[0]?.perfumeId).toBe('diptyque-philosykos');
    expect(near[0]?.score).toBeGreaterThan(0.9);
  });

  test('sonuclar guclüden zayifa sirali ve sinirli', () => {
    const near = nearestToComposition([note('oud'), note('rose'), note('saffron')], 5);
    expect(near).toHaveLength(5);
    const scores = near.map((n) => n.score);
    expect([...scores].sort((a, b) => b - a)).toEqual(scores);
  });

  test('gecersiz kompozisyon bos donuyor, cokmuyor', () => {
    expect(nearestToComposition([], 5)).toEqual([]);
    expect(nearestToComposition([note('yok')], 5)).toEqual([]);
  });

  test('secilecek nota sayisinin alt siniri makul', () => {
    expect(MIN_COMPOSITION_NOTES).toBeGreaterThanOrEqual(2);
    expect(MAX_COMPOSITION_NOTES).toBeLessThanOrEqual(NOTES.length);
  });
});
