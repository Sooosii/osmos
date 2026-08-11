import { describe, expect, test } from 'vitest';
import { readFileSync } from 'node:fs';
import { BIO_MAX, account, session, topFour, user, verification } from '@/db/schema';

/**
 * Şemanın kapıları.
 *
 * Tablolar veritabanı olmadan sınanamaz ama **şeklin** kendisi sınanabilir:
 * hangi tablolar var, hangi sütunlar zorunlu, hangi kısıtlar konmuş. Buradaki
 * her sınama, sessizce kaybolabilecek bir kararı tutuyor.
 */

function read(path: string): string {
  return readFileSync(path, 'utf8');
}

describe('better auth tablolari', () => {
  test('dordu de yerinde', () => {
    /*
      ⚠️ Adlar Better Auth'un sözleşmesi, keyfi değil. Biri yeniden
      adlandırılırsa kütüphane tabloyu bulamaz ve hata çalışma anında,
      ilk giriş denemesinde çıkar.
    */
    for (const [name, table] of Object.entries({ user, session, account, verification })) {
      expect(table, name).toBeDefined();
    }
  });

  test('oturum ve hesap kullaniciya cascade bagli', () => {
    /*
      Hesap silinince oturumları ve sağlayıcı bağlantıları da gitmeli. Yetim
      bir oturum satırı, silinmiş bir hesabın hâlâ girişte kalması demek.
    */
    const source = read('src/db/schema.ts');
    const cascades = source.match(/onDelete: 'cascade'/g) ?? [];
    expect(cascades.length).toBeGreaterThanOrEqual(3);
  });
});

describe('kullanici alanlari', () => {
  test('dort ek alan sema ile auth kurulumunda ayni', () => {
    /*
      ⚠️ Bu iki liste ayrışırsa Better Auth alanı görmez: kayıt sessizce
      yarım kalır, hata da vermez. Sınama ikisini birlikte tutuyor.
    */
    const schema = read('src/db/schema.ts');
    for (const field of ['username', 'bio', 'hidden', 'emailOptIn']) {
      expect(schema, `şema: ${field}`).toContain(field);
    }
  });

  test('kullanici adi benzersiz', () => {
    expect(read('src/db/schema.ts')).toMatch(/username: text\('username'\)\.unique\(\)/);
  });

  test('gizlilik ve e-posta onayi varsayilan olarak kapali', () => {
    /*
      ⚠️ Varsayılanlar bir karar: profil açık doğuyor (`hidden` false) ama
      e-posta onayı KAPALI doğuyor. İkincisi yasal — kimse istemeden listeye
      girmez.
    */
    const source = read('src/db/schema.ts');
    expect(source).toMatch(/hidden.*\.default\(false\)/s);
    expect(source).toMatch(/email_opt_in.*\.default\(false\)/s);
  });
});

describe('top four tablosu', () => {
  test('tablo ve sira sutunu var', () => {
    expect(topFour).toBeDefined();
    expect(read('src/db/schema.ts')).toContain("position: integer('position')");
  });

  test('ayni yuvada iki parfum, ayni parfum iki yuvada olamaz', () => {
    /*
      ⚠️ İki kısıt da veritabanı düzeyinde. Uygulama katmanı (`top-four.ts`)
      zaten engelliyor ama uç herkese açık ve eşzamanlı iki istek uygulama
      denetimini atlayabilir; son kapı burada.
    */
    const source = read('src/db/schema.ts');
    expect(source).toContain("unique('top_four_user_position')");
    expect(source).toContain("unique('top_four_user_perfume')");
  });

  test('perfumeId yabanci anahtar DEGIL', () => {
    /*
      Parfümler kodda yaşıyor (`src/data/`), veritabanında değil. Yabancı
      anahtar kurmak, 52 parfümü veritabanına kopyalamak ve iki kaynağı
      senkron tutmak demekti — doğrulama `lib/top-four.ts`te.
    */
    const source = read('src/db/schema.ts');
    const topFourBlock = source.slice(source.indexOf('export const topFour'));
    expect(topFourBlock).not.toMatch(/perfumeId[\s\S]{0,120}references\(/);
  });
});

describe('sinirlar', () => {
  test('tek satirin uzunluk siniri tanimli', () => {
    expect(BIO_MAX).toBeGreaterThan(0);
    expect(BIO_MAX).toBeLessThanOrEqual(200);
  });
});
