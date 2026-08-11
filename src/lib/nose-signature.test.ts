import { describe, expect, test } from 'vitest';
import { PERFUMES } from '@/data/perfumes';
import { signatureOf, SIGNATURE_SIZE } from '@/lib/nose-signature';

const [a, b, c, d, e] = PERFUMES.map((perfume) => perfume.id);

describe('signatureOf', () => {
  test('bos secim imza uretmiyor', () => {
    /* Dört boş halka değil, hiçbir şey: imza Top 4'ten doğar. */
    expect(signatureOf([])).toBeNull();
  });

  test('tek parfumle de imza var', () => {
    const sig = signatureOf([a]);
    expect(sig).not.toBeNull();
    expect(sig!.arcs).toHaveLength(1);
  });

  test('dort parfum dort yay uretiyor', () => {
    expect(signatureOf([a, b, c, d])!.arcs).toHaveLength(4);
  });

  test('deterministik — ayni girdi ayni cikti', () => {
    expect(signatureOf([a, b, c, d])).toEqual(signatureOf([a, b, c, d]));
  });

  test('sira desen degistiriyor', () => {
    /*
      "Birinci parfümüm" bir iddia: sıra imzada görünmeli, yoksa Top 4'ü
      sıralamanın anlamı kalmaz.
    */
    expect(signatureOf([a, b, c, d])).not.toEqual(signatureOf([d, c, b, a]));
  });

  test('farkli secim farkli imza', () => {
    expect(signatureOf([a, b, c, d])).not.toEqual(signatureOf([a, b, c, e]));
  });

  test('yaylar cizim kutusunun icinde', () => {
    const sig = signatureOf([a, b, c, d])!;
    for (const arc of sig.arcs) {
      expect(arc.radius).toBeGreaterThan(0);
      expect(arc.radius).toBeLessThanOrEqual(SIGNATURE_SIZE / 2);
      expect(arc.dots.length).toBeGreaterThan(0);
      for (const dot of arc.dots) {
        expect(Math.hypot(dot.x - SIGNATURE_SIZE / 2, dot.y - SIGNATURE_SIZE / 2))
          .toBeLessThanOrEqual(SIGNATURE_SIZE / 2 + 0.001);
      }
    }
  });

  test('renk aile zincirinden geliyor', () => {
    /*
      İkinci bir renk kaynağı açılmıyor: harita, parfüm sayfası ve imza aynı
      rengi göstermek zorunda. Hepsi `#rrggbb`.
    */
    for (const arc of signatureOf([a, b, c, d])!.arcs) {
      expect(arc.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });

  test('bilinmeyen kimlik sessizce atlaniyor', () => {
    /*
      Veri silinmiş ya da yeniden adlandırılmış bir parfüm profili çökertmemeli;
      imza kalanla çizilir. Hepsi bilinmiyorsa imza yok.
    */
    expect(signatureOf(['yok-boyle-bir-parfum'])).toBeNull();
    expect(signatureOf([a, 'yok-boyle-bir-parfum'])!.arcs).toHaveLength(1);
  });

  test('dortten fazlasi alinmiyor', () => {
    expect(signatureOf([a, b, c, d, e])!.arcs).toHaveLength(4);
  });
});
