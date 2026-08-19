import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { adresAdaylari, katalogTaslagi, kiraciKimligi, type DukkanUrunu } from './taslak.ts';
import type { KatalogParfumu } from './markalar.ts';

/**
 * Adres önerisinin kapısı.
 *
 * ⚠️ **Buradaki tek kural ölçümle kondu, tahminle değil:** "en kısa başlık
 * kazanır". Nischengold'un ELLE doğrulanmış 13 adresi üzerinde denendi ve
 * **13'ünü de birebir** üretti — beş `Extrait` tuzağının beşi dahil. Aşağıdaki
 * düzenek o tuzağı ağa çıkmadan tekrarlıyor.
 *
 * ⚠️ Kural değişirse (ör. "ilk eşleşme kazanır") bu sınama düşer. Düşmesi
 * gerekiyor: Nischengold'da ilk otomatik eşleştirici beşinde de Extrait'i
 * seçmişti ve o demo "sizin kataloğunuzdan kurdum" diyemezdi.
 */

const urun = (handle: string, baslik: string): DukkanUrunu => ({ handle, baslik });

const DUKKAN: readonly DukkanUrunu[] = [
  /* ⚠️ Aksanli yazim BILEREK: dukkan 'Matière Première' yazarken bizim kayit
     aksansiz. Iki normallestirici ayrisirsa bu satir sessizce eslesmiyordu. */
  urun('radical-rose', 'Matière Première Radical Rose - Unisex Parfum'),
  urun('radical-rose-extrait', 'Matière Première Radical Rose Extrait - Unisex Parfum'),
  urun('baraonda', 'Nasomatto Baraonda'),
  urun('neroli-oranger', 'Matière Première Neroli Oranger'),
  urun('alakart', 'Bilinmeyen Ev Alakart'),
];

const BIZIMKILER: readonly KatalogParfumu[] = [
  { id: 'matiere-premiere-radical-rose', ad: 'Radical Rose', marka: 'MATIERE PREMIERE' },
  { id: 'nasomatto-baraonda', ad: 'Baraonda', marka: 'Nasomatto' },
  { id: 'profumum-roma-neroli', ad: 'Neroli', marka: 'Profumum Roma' },
];

describe('adres adayları', () => {
  const sonuc = adresAdaylari(DUKKAN, BIZIMKILER);

  it('yalniz gercekten satilan parfumler cikiyor', () => {
    assert.deepEqual(sonuc.map((a) => a.id).sort(), [
      'matiere-premiere-radical-rose',
      'nasomatto-baraonda',
    ]);
  });

  /*
    ⚠️ Asıl kapı. `profumum-roma-neroli` dükkânın Matière Première "Neroli
    Oranger"ıyla eşleşiyordu — aynı kelime, başka ev, başka parfüm. Marka şartı
    olmasa bu satır demoya girerdi ve dükkânın satmadığı bir parfümü içeren bir
    demo "sizin kataloğunuzdan kurdum" diyemezdi.
  */
  it('marka tutmayan ad eslesmesi ELENIYOR', () => {
    assert.ok(
      !sonuc.map((a) => a.id).includes('profumum-roma-neroli'),
      'baska evin ayni adli parfumu secime girdi',
    );
  });

  it('Extrait tuzagi: temel surum seciliyor, oteki aday kayboluyor DEGIL', () => {
    const gul = sonuc.find((a) => a.id === 'matiere-premiere-radical-rose');
    assert.equal(gul?.secim.handle, 'radical-rose');
    assert.equal(gul?.adaylar.length, 2);
    assert.ok(
      (gul?.adaylar ?? []).map((x) => x.handle).includes('radical-rose-extrait'),
      'oteki aday listeden dusmus — gozle bakan kisi tuzagi goremez',
    );
  });

  it('tek adayli parfumde de secim dogru', () => {
    assert.equal(sonuc.find((a) => a.id === 'nasomatto-baraonda')?.secim.handle, 'baraonda');
  });
});

describe('katalog taslağı', () => {
  const metin = katalogTaslagi(
    'ornek',
    'Örnek',
    'ornek.com',
    adresAdaylari(DUKKAN, BIZIMKILER),
  );

  /*
    ⚠️ Işaret pazarlık dışı: onu üretmeyen bir taslak, doğrulanmamış adresleri
    sessizce yayına taşırdı. Ana depodaki `dogrulama.test.ts` bu işareti bekliyor.
  */
  it('HER adres DOGRULANMADI isaretiyle cikiyor', () => {
    const adresSayisi = metin.split("'https://ornek.com/products/").length - 1;
    const isaretSayisi = metin.split('DOGRULANMADI').length - 1;
    assert.equal(adresSayisi, 2);
    /* Her adresin işareti + dosya başındaki açıklamada iki geçiş. */
    assert.ok(
      isaretSayisi >= adresSayisi,
      `${adresSayisi} adres var ama ${isaretSayisi} isaret — isaretsiz adres yayina gider`,
    );
  });

  it('birden cok adayli satirda otekiler de yaziyor', () => {
    assert.ok(metin.includes('radical-rose-extrait'));
  });

  it('derlenebilir bicimde: secki ve adresler ayni kimlikleri tasiyor', () => {
    assert.ok(metin.includes("'matiere-premiere-radical-rose',"));
    assert.ok(metin.includes("'matiere-premiere-radical-rose': 'https://ornek.com/products/radical-rose'"));
    assert.ok(metin.includes('ORNEK_CATALOG'));
  });
});

describe('kiracı kimliği', () => {
  it('alan adindan kimlik cikariyor', () => {
    assert.equal(kiraciKimligi('nischengold.com'), 'nischengold');
    assert.equal(kiraciKimligi('www.fragrance-lord.co.uk'), 'fragrance-lord');
  });
});

/**
 * Biçim şüphesi.
 *
 * ⚠️ **Gerçek bir olaydan doğdu (2026-08-19, Scentitude taslağı).** Araç
 * `bdk-creme-de-cuir` için `creme-de-cuir-hair-perfume-50ml` önerdi ve hiç
 * işaretlemedi — çünkü tek adaydı ve "birden çok aday" kuralı bunu görmüyor.
 * Dükkân o kokunun yalnız **saç parfümü** sürümünü satıyor.
 *
 * Tek başına hata değil (koku gerçekten o rafta) ama **karar olmalı, kaza
 * değil.** Daha kötü hâli açık: aynı adı taşıyan bir MUM ya da sabun sessizce
 * haritaya girerdi ve "sizin kataloğunuzdan kurdum" diyen bir demo bunu
 * kaldıramaz.
 */
describe('biçim şüphesi', () => {
  const bizim: readonly KatalogParfumu[] = [
    { id: 'bdk-creme-de-cuir', ad: 'Creme de Cuir', marka: 'BDK' },
    { id: 'nasomatto-baraonda', ad: 'Baraonda', marka: 'Nasomatto' },
  ];

  it('sac parfumu ISARETLENIYOR', () => {
    const s = adresAdaylari([urun('cdc-hair', 'BDK Crème de Cuir Hair perfume 50ML')], bizim);
    assert.equal(s[0]?.bicimSupheli, true);
  });

  it('mum ve sabun da isaretleniyor', () => {
    for (const b of ['BDK Creme de Cuir Candle', 'BDK Creme de Cuir Soap Bar']) {
      assert.equal(adresAdaylari([urun('x', b)], bizim)[0]?.bicimSupheli, true, b);
    }
  });

  /*
    ⚠️ Işaret DAR tutulmak zorunda: `edp`, `parfum`, `ml` normal kelimeler ve
    işaretlenselerdi her satır şüpheli olurdu — o zaman işaret hiçbir şey
    söylemez ve gözle bakan kişi hepsini geçer.
  */
  it('normal parfum sisesi isaretlenmiyor', () => {
    for (const b of ['Nasomatto Baraonda 30ml', 'Nasomatto Baraonda EDP', 'Nasomatto Baraonda Extrait']) {
      assert.equal(adresAdaylari([urun('x', b)], bizim)[0]?.bicimSupheli, false, b);
    }
  });
});
