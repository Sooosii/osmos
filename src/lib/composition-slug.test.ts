import { describe, expect, test } from 'vitest';
import { SLUG_MAX, slugify, uniqueSlug } from '@/lib/composition-slug';

describe('slugify', () => {
  test('bosluklar tireye, harfler kucuge', () => {
    expect(slugify('Gece Inciri')).toBe('gece-inciri');
  });

  test('Turkce harfler ESLENIYOR, atilmiyor', () => {
    /*
      ⚠️ `toLowerCase` Türkçe harfleri olduğu gibi bırakıyor ve adreste
      yüzde-kaçışa dönüşüyorlar — okunmaz, paylaşılamaz bir bağlantı.
      Eşleme tablosu bu yüzden var.
    */
    expect(slugify('Gece İnciri')).toBe('gece-inciri');
    expect(slugify('Çiğdem Öğle Şurubu')).toBe('cigdem-ogle-surubu');
    expect(slugify('ISSIZ')).toBe('issiz');
  });

  test('aksanli latin sadelesiyor', () => {
    expect(slugify('Café Noir')).toBe('cafe-noir');
  });

  test('noktalama ve fazladan tireler temizleniyor', () => {
    expect(slugify('  ---Oud & Gül!!!  ')).toBe('oud-gul');
  });

  test('uzunluk sinirlaniyor ve sonda tire kalmiyor', () => {
    const long = slugify('a'.repeat(200));
    expect(long.length).toBeLessThanOrEqual(SLUG_MAX);
    expect(long.endsWith('-')).toBe(false);
  });

  test('harfsiz ad bos donuyor', () => {
    expect(slugify('🌿✨')).toBe('');
  });
});

describe('uniqueSlug', () => {
  test('bos degilse oldugu gibi', () => {
    expect(uniqueSlug('Gece Inciri', [])).toBe('gece-inciri');
  });

  test('cakisirsa sayi ekleniyor', () => {
    expect(uniqueSlug('Gece', ['gece'])).toBe('gece-2');
    expect(uniqueSlug('Gece', ['gece', 'gece-2'])).toBe('gece-3');
  });

  test('harfsiz ada karsilik uretiliyor', () => {
    /*
      Aksi hâlde adres `/k/` olurdu. Yedek İngilizce: değer adreste görünüyor
      ve sitenin birincil dili İngilizce.
    */
    expect(uniqueSlug('🌿', [])).toBe('composition');
    expect(uniqueSlug('🌿', ['composition'])).toBe('composition-2');
  });
});
