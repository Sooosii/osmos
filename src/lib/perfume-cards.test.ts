import { describe, expect, test } from 'vitest';
import { PERFUMES } from '@/data/perfumes';
import { allCards, cardsFor } from '@/lib/perfume-cards';

const [a, b, c] = PERFUMES.map((perfume) => perfume.id);

describe('cardsFor', () => {
  test('sirayi koruyor', () => {
    expect(cardsFor([c, a, b]).map((card) => card.id)).toEqual([c, a, b]);
  });

  test('bilinmeyeni atliyor, cokmuyor', () => {
    expect(cardsFor([a, 'yok-boyle-bir-parfum']).map((card) => card.id)).toEqual([a]);
    expect(cardsFor([])).toEqual([]);
  });

  test('renk aile zincirinden ve gecerli', () => {
    for (const card of cardsFor([a, b, c])) {
      expect(card.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });

  test('noktalar agirdan hafife sirali ve en fazla sekiz', () => {
    for (const card of allCards()) {
      expect(card.dots.length).toBeLessThanOrEqual(8);
      expect(card.dots.length).toBeGreaterThan(0);
      expect([...card.dots].sort((x, y) => y - x)).toEqual([...card.dots]);
    }
  });

  test('istemciye inen kart yalniz cizim alanlarini tasiyor', () => {
    /*
      ⚠️ Kart istemciye gidiyor. Yeni bir alan eklemek "biraz daha veri"
      değil, benzerlik motorunun ya da nota veritabanının pakete sızması
      demek olabilir — bu sınama kapıyı tutuyor.
    */
    const card = cardsFor([a])[0];
    expect(Object.keys(card).sort()).toEqual(['brand', 'color', 'dots', 'id', 'name', 'search']);
  });
});

describe('allCards', () => {
  test('52 parfumun hepsi ve benzersiz', () => {
    const cards = allCards();
    expect(cards).toHaveLength(PERFUMES.length);
    expect(new Set(cards.map((card) => card.id)).size).toBe(PERFUMES.length);
  });

  test('marka ve ada gore sirali', () => {
    const labels = allCards().map((card) => `${card.brand} ${card.name}`);
    expect([...labels].sort((x, y) => x.localeCompare(y))).toEqual(labels);
  });

  test('arama metni kucuk harfli ve ad ile markayi kapsiyor', () => {
    for (const card of allCards()) {
      expect(card.search).toBe(card.search.toLowerCase());
      expect(card.search).toContain(card.name.toLowerCase());
      expect(card.search).toContain(card.brand.toLowerCase());
    }
  });
});
