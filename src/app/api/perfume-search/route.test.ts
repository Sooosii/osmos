import { describe, expect, test } from 'vitest';
import { PERFUMES } from '@/data/perfumes';
import { GET, dynamic } from './route';

describe('statik parfüm arama dizini', () => {
  test('zorla statik üretilir ve her parfümü hafif bir belge olarak döndürür', async () => {
    expect(dynamic).toBe('force-static');

    const response = await GET();
    const documents = await response.json();

    expect(response.status).toBe(200);
    expect(documents).toHaveLength(PERFUMES.length);
    expect(documents[0]).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        name: expect.any(String),
        brand: expect.any(String),
        aliases: expect.any(Array),
        notes: expect.any(Array),
      }),
    );
    expect(documents[0]).not.toHaveProperty('line');
    expect(documents[0]).not.toHaveProperty('year');
    expect(documents[0]?.notes[0]).toEqual(
      expect.objectContaining({ id: expect.any(String), en: expect.any(String), tr: expect.any(String) }),
    );
    expect(documents[0]?.notes[0]).not.toHaveProperty('weight');
  });

  test('kullanıcının verdiği arama takma adlarını taşır', async () => {
    const documents = await (await GET()).json();
    const douceur = documents.find((document: { id: string }) => document.id === 'kyse-douceur-brulee');

    expect(douceur.aliases).toContain('Douceur de Vanille');
  });
});
