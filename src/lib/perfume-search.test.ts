import { describe, expect, test } from 'vitest';
import type { PerfumeSearchDocument } from './perfume-search';
import { normalizeSearchText, searchPerfumes } from './perfume-search';

const DOCS: readonly PerfumeSearchDocument[] = [
  {
    id: 'tubereuse-imperiale',
    name: 'Tubéreuse Impériale',
    brand: 'BDK Parfums',
    aliases: [],
    notes: [
      { id: 'tuberose', en: 'Tuberose', tr: 'Sümbülteber' },
      { id: 'sandalwood', en: 'Sandalwood', tr: 'Sandal ağacı' },
    ],
  },
  {
    id: 'kyse-serenade',
    name: 'Sérénade aux Fraises',
    brand: 'Kyse Perfumes',
    aliases: ['Sérénade'],
    notes: [{ id: 'strawberry', en: 'Strawberry', tr: 'Çilek' }],
  },
  {
    id: 'peau-de-peche',
    name: 'Peau de Pêche',
    brand: 'Keiko Mecheri',
    aliases: ['Peau de Peche'],
    notes: [{ id: 'peach', en: 'Peach', tr: 'Şeftali' }],
  },
  {
    id: 'brand-only',
    name: 'Nocturne',
    brand: 'Sandal İstanbul',
    aliases: [],
    notes: [{ id: 'rose', en: 'Rose', tr: 'Gül' }],
  },
];

describe('parfüm araması', () => {
  test('aksanları, noktalama işaretlerini ve Türkçe noktasız ı harfini normalize eder', () => {
    expect(normalizeSearchText("  PÊCHE—İSTANBUL / ışıK  ")).toBe('peche istanbul isik');
  });

  test('kanonik ad ve kullanıcı takma adını aksansız bulur', () => {
    expect(searchPerfumes(DOCS, 'tubereuse imperiale', 'en')[0]?.id).toBe('tubereuse-imperiale');
    expect(searchPerfumes(DOCS, 'serenade', 'en')[0]?.id).toBe('kyse-serenade');
    expect(searchPerfumes(DOCS, 'peche', 'en')[0]?.id).toBe('peau-de-peche');
  });

  test('bütün sorgu sözcüklerinin aynı belgede bulunmasını ister', () => {
    expect(searchPerfumes(DOCS, 'kyse fraises', 'en').map((result) => result.id)).toEqual([
      'kyse-serenade',
    ]);
    expect(searchPerfumes(DOCS, 'kyse tubereuse', 'en')).toEqual([]);
  });

  test('ad eşleşmesini markadan, markayı nota eşleşmesinden önce sıralar', () => {
    const docs: readonly PerfumeSearchDocument[] = [
      { id: 'note', name: 'Quiet', brand: 'Elsewhere', aliases: [], notes: [{ id: 'rose', en: 'Rose', tr: 'Gül' }] },
      { id: 'brand', name: 'Quiet Two', brand: 'Rose House', aliases: [], notes: [] },
      { id: 'name', name: 'Rose Silence', brand: 'Miller Harris', aliases: [], notes: [] },
    ];

    expect(searchPerfumes(docs, 'rose', 'en').map((result) => result.id)).toEqual([
      'name',
      'brand',
      'note',
    ]);
  });

  test('iki dilde nota arar, eşleşen notaları geçerli dilde ve en fazla iki tane döndürür', () => {
    const doc: PerfumeSearchDocument = {
      id: 'many-notes', name: 'Many', brand: 'Test', aliases: [],
      notes: [
        { id: 'rose-one', en: 'Rose', tr: 'Gül' },
        { id: 'rose-two', en: 'Rosewood', tr: 'Gül ağacı' },
        { id: 'rose-three', en: 'Wild rose', tr: 'Yabani gül' },
      ],
    };

    expect(searchPerfumes([doc], 'rose', 'tr')[0]?.matchingNotes).toEqual(['Gül', 'Gül ağacı']);
    expect(searchPerfumes(DOCS, 'sumbulteber', 'tr')[0]?.matchingNotes).toEqual(['Sümbülteber']);
  });

  test('sonuçları sekiz kayıtla sınırlar', () => {
    const docs = Array.from({ length: 10 }, (_, index): PerfumeSearchDocument => ({
      id: `rose-${index}`,
      name: `Rose ${index}`,
      brand: 'Test',
      aliases: [],
      notes: [],
    }));

    expect(searchPerfumes(docs, 'rose', 'en')).toHaveLength(8);
  });
});
