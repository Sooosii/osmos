import { describe, expect, it } from 'vitest';
import { spaceIdentity } from './space-identity';
import { PERFUMES, PERFUME_SPACES } from '@/data/perfumes';

const universe = PERFUMES.map((perfume) => perfume.id);
const identityOf = (spaceId: number) =>
  spaceIdentity(
    PERFUME_SPACES.find((space) => space.id === spaceId)!.perfumes.map((p) => p.id),
    universe,
  );

describe('uzayın kimliği', () => {
  it('aynı katalog aynı rengi veriyor — deterministik', () => {
    expect(identityOf(1)).toEqual(identityOf(1));
  });

  /*
    ⚠️ **Bu sınamanın varlık sebebi bir ölçüm.** İlk tasarım rengi BASKIN
    aileden alıyordu ve üç uzayda da `gourmand` çıkıyordu: üç renk de aynı.
    Ayırt eden aileye geçilme sebebi bu; kapı da onu koruyor. Renkler bir gün
    yeniden çakışırsa iş sessizce anlamsızlaşır — harita üç ayrı uzay gösterir
    ama üçü de aynı renktedir.
  */
  it('üç uzayın rengi birbirinden FARKLI', () => {
    const renkler = PERFUME_SPACES.map((space) => identityOf(space.id).color);
    expect(new Set(renkler).size).toBe(renkler.length);
  });

  /*
    ⚠️ **Kırıldığında sınamayı güncelleme — ekrana bak.** Fazlalık farkları
    küçük (bugün 1.7–1.9 puan), yani eklenen bir parfüm bir uzayın kimliğini
    değiştirebilir. Bu yasak değil: veri değişince kimlik de değişir. Yasak
    olan SESSİZCE değişmesi — kimliğin rengi bir tasarım kararı ve sahibin
    ekranda onayladığı bir şey.
  */
  it('bugünkü kimlikler — kaydığında haber versin', () => {
    expect(PERFUME_SPACES.map((space) => identityOf(space.id).family)).toEqual([
      'mineral',
      'fruity',
      'citrus',
    ]);
  });

  it('renk hex ve ailenin kendi rengi', () => {
    for (const space of PERFUME_SPACES) {
      expect(identityOf(space.id).color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });

  it('boş katalogda patlıyor, renk uydurmuyor', () => {
    expect(() => spaceIdentity([], universe)).toThrow(/katalog boş/);
  });

  /*
    Ayırt etme ölçüsü büyüklükten bağımsız olmak zorunda: uzayların parfüm
    sayısı farklı (52/49/49) ve ham toplam kullanılsaydı fark ölçüsü uzayın
    boyutunu ölçmeye dönerdi. Aynı katalog iki kez verilince fazlalık sıfırlanır
    ve kazanan `FAMILIES` sırasının ilki olur — ölçünün pay üzerinden çalıştığının
    kanıtı.
  */
  it('uzay ile evren aynıysa fazlalık yok', () => {
    expect(spaceIdentity(universe, universe).family).toBe('citrus');
  });
});
