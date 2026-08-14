import { describe, expect, test } from 'vitest';
import { PERFUMES } from '@/data/perfumes';
import { LOCALES } from '@/i18n/locale';
import { pushDigestMessage, pushMessage } from '@/lib/push-payload';

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

describe('pushDigestMessage', () => {
  test('tek parfümde eski ayrıntılı mesajı korur', () => {
    expect(pushDigestMessage([PERFUMES[0]], 'en')).toEqual(pushMessage(PERFUMES[0], 'en'));
  });

  test('toplu eklemede abone başına üç uzayı söyleyen tek yerel özet kurar', () => {
    const fresh = PERFUMES.slice(0, 4);

    const en = pushDigestMessage(fresh, 'en');
    expect(en.body).toContain('4');
    expect(en.body).toContain('three scent spaces');
    expect(en.url).toBe('/');

    const tr = pushDigestMessage(fresh, 'tr');
    expect(tr.body).toContain('4');
    expect(tr.body).toContain('üç koku uzayına');
    expect(tr.url).toBe('/tr');
  });

  test('boş toplu mesajı reddeder', () => {
    expect(() => pushDigestMessage([], 'en')).toThrow('En az bir parfüm');
  });
});
