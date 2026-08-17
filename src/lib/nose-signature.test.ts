import { describe, expect, test } from 'vitest';
import { PERFUMES, perfumesOf } from '@/data/perfumes';
import { signatureOf, SIGNATURE_SIZE } from '@/lib/nose-signature';

/*
  ⚠️ Sınama artık PARFÜM geçiyor, kimlik değil: `signatureOf` katalogu kendisi
  aramayı bıraktı (gerekçesi fonksiyonun başında — kimlik alan sürüm bütün
  katalogu istemci paketine çekiyordu).
*/
const [a, b, c, d, e] = PERFUMES;

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

  /*
    ⚠️ "Bilinmeyen kimlik sessizce atlanıyor" kuralı buradan `perfumesOf`a
    TAŞINDI (`data/perfumes.ts`), çünkü çözüm artık sunucuda yapılıyor. Kural
    kaybolmadı, aşağıdaki iki sınama onu kimlik ucunda tutuyor; burada kalan
    tek şey boş listenin imzasız olması.
  */
  test('bos liste imza uretmiyor', () => {
    expect(signatureOf(perfumesOf(['yok-boyle-bir-parfum']))).toBeNull();
  });

  test('bilinmeyen kimlik sessizce atlaniyor — cozum sunucuda', () => {
    /*
      Veri silinmiş ya da yeniden adlandırılmış bir parfüm profili çökertmemeli;
      imza kalanla çizilir.
    */
    expect(perfumesOf(['yok-boyle-bir-parfum'])).toEqual([]);
    expect(signatureOf(perfumesOf([a.id, 'yok-boyle-bir-parfum']))!.arcs).toHaveLength(1);
  });

  test('perfumesOf sirayi koruyor', () => {
    /* Sıra imzanın anlamı: "birinci parfümüm" iddiası buradan geçiyor. */
    expect(perfumesOf([b.id, a.id]).map((p) => p.id)).toEqual([b.id, a.id]);
  });

  test('dortten fazlasi alinmiyor', () => {
    expect(signatureOf([a, b, c, d, e])!.arcs).toHaveLength(4);
  });
});
