import { describe, expect, it } from 'vitest';
import { deriveTenantCatalog } from './derive';
import { NISCHENGOLD_CATALOG } from './nischengold/catalog';
import type { Perfume } from '../types';

const parfum = (id: string): Perfume => ({
  id,
  name: id,
  brand: 'Ev',
  year: 2020,
  curated: true,
  notes: [{ noteId: 'rose', tier: 'heart', weight: 1 }],
  retailers: [
    { name: 'Luckyscent', url: 'https://www.luckyscent.com/products/x' },
    { name: 'Scent Split', url: 'https://scentsplit.com/products/y' },
  ],
});

describe('kiracı katalogu türetme', () => {
  it('miras satıcı bağlantılarını kesiyor', () => {
    const [sonuc] = deriveTenantCatalog([parfum('a')]);
    expect(sonuc?.retailers).toBeUndefined();
  });

  /*
    ⚠️ Kesmek yetmiyordu ve bu bir ürün eksiğiydi: bağlantılar kesildikten
    sonra yerine hiçbir şey konmuyordu, yani kiracı sitesi ÇIKMAZ SOKAKTI —
    güzel bir harita, satın almaya giden yol yok. Satılan değerin tamamı
    "kendi dükkânına açılan keşif katmanı" olduğu için o yol ürünün kendisi.
  */
  it('müşterinin kendi ürün adresini koyuyor', () => {
    const [sonuc] = deriveTenantCatalog(
      [parfum('a')],
      { a: 'https://musteri.com/products/a' },
      'Müşteri',
    );
    expect(sonuc?.retailers).toEqual([{ name: 'Müşteri', url: 'https://musteri.com/products/a' }]);
  });

  it('adresi olmayan parfüm bağlantısız kalıyor — miras bağlantı geri gelmiyor', () => {
    const [sonuc] = deriveTenantCatalog([parfum('a')], { baska: 'https://musteri.com/x' }, 'Müşteri');
    expect(sonuc?.retailers).toBeUndefined();
  });

  it('dükkân adı verilmezse bağlantı yazılmıyor', () => {
    const [sonuc] = deriveTenantCatalog([parfum('a')], { a: 'https://musteri.com/products/a' });
    expect(sonuc?.retailers).toBeUndefined();
  });

  it('parfümün geri kalan alanları olduğu gibi taşınıyor', () => {
    const [sonuc] = deriveTenantCatalog([parfum('a')], { a: 'https://musteri.com/p' }, 'M');
    expect(sonuc?.name).toBe('a');
    expect(sonuc?.notes).toHaveLength(1);
    expect(sonuc?.year).toBe(2020);
  });
});

describe('Nischengold demosu', () => {
  it('her parfümde dönüşüm yolu var', () => {
    for (const p of NISCHENGOLD_CATALOG) {
      expect(p.retailers, `${p.id} bağlantısız`).toHaveLength(1);
    }
  });

  /*
    ⚠️ Bu sınamanın tuttuğu hata sessiz olurdu: sayfa çalışır, harita güzel
    görünür, tek fark ziyaretçinin BAŞKA bir dükkândan alışveriş yapmasıdır.
  */
  it('hiçbir bağlantı müşterinin alan adı dışına çıkmıyor', () => {
    for (const p of NISCHENGOLD_CATALOG) {
      for (const r of p.retailers ?? []) {
        expect(r.url, `${p.id} rakibe bağlanıyor`).toContain('nischengold.com');
      }
    }
  });

  /*
    ⚠️ Dükkân çoğu parfümün hem temel hem `Extrait` sürümünü satıyor ve bizim
    kayıtlarımız temel sürüm. Otomatik eşleştirici ilk denemede beşinde de
    Extrait'i seçmişti — ziyaretçi başka bir ürüne düşerdi.
  */
  it('temel sürüm kayıtları Extrait sayfasına bağlanmıyor', () => {
    const temelSurumler = [
      'matiere-premiere-radical-rose',
      'matiere-premiere-encens-suave',
      'matiere-premiere-crystal-saffron',
      'matiere-premiere-santal-austral',
      'marc-antoine-barrois-ganymede',
    ];
    for (const id of temelSurumler) {
      const p = NISCHENGOLD_CATALOG.find((x) => x.id === id);
      expect(p, `${id} seçkide yok`).toBeDefined();
      expect(p?.retailers?.[0]?.url, `${id} Extrait sayfasına bağlanmış`).not.toContain('extrait');
    }
  });
});
