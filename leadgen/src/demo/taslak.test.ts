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
