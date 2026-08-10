import { describe, expect, test } from 'vitest';
import { PERFUMES } from '@/data/perfumes';

/*
 * Satıcı bağlantılarının kapısı.
 *
 * Bağlantılar elle giriliyor ve kırık bağlantı sessizce kırık kalır: derleme
 * geçer, lint susar, sayfa çizilir — yalnızca tıklayan ziyaretçi kaybolur ve
 * komisyon hiç doğmaz. Şemayı tip tutamıyor (dizenin içini görmüyor), o
 * yüzden kapı burada.
 */
describe('satici baglantilari', () => {
  test('her baglanti https ve adli', () => {
    for (const perfume of PERFUMES) {
      for (const retailer of perfume.retailers ?? []) {
        const where = `${perfume.id} → ${retailer.name}`;
        expect(retailer.name.trim().length, `${where}: ad boş`).toBeGreaterThan(0);
        expect(retailer.url.startsWith('https://'), `${where}: https değil`).toBe(true);
        expect(() => new URL(retailer.url), `${where}: adres bozuk`).not.toThrow();
      }
    }
  });

  test('ayni sayfada ayni satici iki kez yok', () => {
    for (const perfume of PERFUMES) {
      const names = (perfume.retailers ?? []).map((retailer) => retailer.name);
      expect(new Set(names).size, `${perfume.id}: satıcı adı yinelenmiş`).toBe(names.length);
    }
  });
});
