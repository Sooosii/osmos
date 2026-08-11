import { describe, expect, test } from 'vitest';
import { PERFUMES } from '@/data/perfumes';
import { LOCALES } from '@/i18n/locale';
import { pushMessage } from '@/lib/push-payload';

describe('pushMessage', () => {
  test('iki dilde metin ve dile gore yol', () => {
    const perfume = PERFUMES[0];

    const en = pushMessage(perfume, 'en');
    expect(en.title).toBe('OSMOS');
    expect(en.body).toContain(perfume.name);
    expect(en.body).toContain(perfume.brand);
    expect(en.url).toBe(`/perfume/${perfume.id}`);

    const tr = pushMessage(perfume, 'tr');
    expect(tr.url).toBe(`/tr/perfume/${perfume.id}`);
    expect(tr.body).not.toBe(en.body);
  });

  test('hicbir parfumun bildiriminde noktali buyuk I yok', () => {
    /*
      Bildirim ekran metnidir: sahibin noktasız I kuralı sistem bildirimi
      için de geçerli. Sözlük ve 52 parfümün adı-markası birlikte taranıyor —
      veri tarafına İ'li bir ad girerse de burada yakalanır.
    */
    for (const perfume of PERFUMES) {
      for (const locale of LOCALES) {
        const message = pushMessage(perfume, locale);
        expect(`${message.title} ${message.body}`, `${perfume.id} (${locale})`).not.toMatch(/İ/);
      }
    }
  });
});
