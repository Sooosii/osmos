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

  test('arama sayfasina baglanmiyor — urun sayfasi zorunlu', () => {
    /*
      ⚠️ Bu sınama ÖLÇÜLMÜŞ bir hatadan doğdu (2026-08-11). Tek örnek bağlantı
      düz bir Amazon aramasıydı ve gerçek tarayıcıda denendiğinde küratörlü
      parfümü arayan ziyaretçiyi **klonuna** gönderdiği görüldü:

        Dior Oud Ispahan → Versace Oud Noir, Lattafa
        Orto Parisi Megamare → RASASI, Jo Milano
        Bogue Maai → hiç sonuç yok

      Arama bağlantısı ucuz ve cazip — 52 parfüm tek satırla "dolar". Ama
      sitenin değeri dürüst seçki ve yanlış ürüne giden bir bağlantı, hiç
      bağlantı olmamasından kötü. Satıcı bağlantısı **ürün sayfası** olmak
      zorunda; affiliate panelleri bunu üretiyor.
    */
    const searchLike = [/[?&](k|q|s|query|search|keyword)=/i, /\/s\?/i, /\/search\b/i];

    for (const perfume of PERFUMES) {
      for (const retailer of perfume.retailers ?? []) {
        for (const pattern of searchLike) {
          expect(
            pattern.test(retailer.url),
            `${perfume.id} → ${retailer.name}: arama adresi (${retailer.url})`,
          ).toBe(false);
        }
      }
    }
  });

  test('ana sayfaya baglanmiyor — yolun kendisi urunu gostermeli', () => {
    /*
      ⚠️ 2026-08-12'de eklendi, arama kapısının kardeşi. Markanın ana sayfasına
      giden bir bağlantı arama sayfası kadar işe yaramaz: ziyaretçi parfümü
      yine kendi bulmak zorunda kalır, üstelik bu sefer sitenin "buldum" dediğine
      güvenerek tıklamıştır.

      O turda ölçülen üç tuzak bu kapıyı gerektirdi: `artisanparfumeur.com` kökü
      ülke seçimi dayatıyor, `royalcrown.it` kökü bozuk bir yönlendirmeye
      düşüyor, `micallef.fr` ise parfümle hiç ilgisi olmayan bir siteye ait.
      Üçü de "200 döndü" diye yazılabilirdi.

      Bilerek dar tutuldu: kategori/koleksiyon kalıbı aranmıyor. Shopify'ın
      `/collections/<x>/products/<y>` biçimi meşru bir ürün adresi ve bir
      "kategori" süzgeci onu yanlışlıkla reddederdi.
    */
    for (const perfume of PERFUMES) {
      for (const retailer of perfume.retailers ?? []) {
        const { pathname } = new URL(retailer.url);

        expect(
          pathname.replace(/\/+$/, ''),
          `${perfume.id} → ${retailer.name}: ana sayfa adresi (${retailer.url})`,
        ).not.toBe('');
      }
    }
  });
});
