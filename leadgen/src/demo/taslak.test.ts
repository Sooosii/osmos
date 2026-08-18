import { describe, expect, it } from 'vitest';
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
    expect(sonuc.map((a) => a.id).sort()).toEqual([
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
    expect(sonuc.map((a) => a.id)).not.toContain('profumum-roma-neroli');
  });

  it('Extrait tuzagi: temel surum seciliyor, oteki aday kayboluyor DEGIL', () => {
    const gul = sonuc.find((a) => a.id === 'matiere-premiere-radical-rose');
    expect(gul?.secim.handle).toBe('radical-rose');
    expect(gul?.adaylar).toHaveLength(2);
    expect(gul?.adaylar.map((x) => x.handle)).toContain('radical-rose-extrait');
  });

  it('tek adayli parfumde de secim dogru', () => {
    expect(sonuc.find((a) => a.id === 'nasomatto-baraonda')?.secim.handle).toBe('baraonda');
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
    expect(adresSayisi).toBe(2);
    /* Her adresin işareti + dosya başındaki açıklamada iki geçiş. */
    expect(isaretSayisi).toBeGreaterThanOrEqual(adresSayisi);
  });

  it('birden cok adayli satirda otekiler de yaziyor', () => {
    expect(metin).toContain('radical-rose-extrait');
  });

  it('derlenebilir bicimde: secki ve adresler ayni kimlikleri tasiyor', () => {
    expect(metin).toContain("'matiere-premiere-radical-rose',");
    expect(metin).toContain("'matiere-premiere-radical-rose': 'https://ornek.com/products/radical-rose'");
    expect(metin).toContain('ORNEK_CATALOG');
  });
});

describe('kiracı kimliği', () => {
  it('alan adindan kimlik cikariyor', () => {
    expect(kiraciKimligi('nischengold.com')).toBe('nischengold');
    expect(kiraciKimligi('www.fragrance-lord.co.uk')).toBe('fragrance-lord');
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
    expect(s[0]?.bicimSupheli).toBe(true);
  });

  it('mum ve sabun da isaretleniyor', () => {
    for (const b of ['BDK Creme de Cuir Candle', 'BDK Creme de Cuir Soap Bar']) {
      expect(adresAdaylari([urun('x', b)], bizim)[0]?.bicimSupheli, b).toBe(true);
    }
  });

  /*
    ⚠️ Işaret DAR tutulmak zorunda: `edp`, `parfum`, `ml` normal kelimeler ve
    işaretlenselerdi her satır şüpheli olurdu — o zaman işaret hiçbir şey
    söylemez ve gözle bakan kişi hepsini geçer.
  */
  it('normal parfum sisesi isaretlenmiyor', () => {
    for (const b of ['Nasomatto Baraonda 30ml', 'Nasomatto Baraonda EDP', 'Nasomatto Baraonda Extrait']) {
      expect(adresAdaylari([urun('x', b)], bizim)[0]?.bicimSupheli, b).toBe(false);
    }
  });
});
