import { describe, expect, test } from 'vitest';
import { PERFUMES } from '@/data/perfumes';
import { MAX_TOP_FOUR, cleanTopFour, setSlot, topFourError } from '@/lib/top-four';

const [a, b, c, d, e] = PERFUMES.map((perfume) => perfume.id);

describe('topFourError', () => {
  test('gecerli secimler hata vermiyor', () => {
    expect(topFourError([])).toBeNull();
    expect(topFourError([a])).toBeNull();
    expect(topFourError([a, b, c, d])).toBeNull();
  });

  test('dortten fazlasi hata', () => {
    expect(topFourError([a, b, c, d, e])).toBe('tooMany');
  });

  test('ayni parfum iki yuvada olamaz', () => {
    expect(topFourError([a, b, a])).toBe('duplicate');
  });

  test('uydurma kimlik veriye giremez', () => {
    /*
      ⚠️ Uç herkese açık: kimlik listesi istemciden geliyor ve doğrulanmadan
      yazılırsa profilde var olmayan bir parfüm durur — imza da onu atlar,
      yani kullanıcı yuvasını kaybettiğini fark etmez.
    */
    expect(topFourError(['yok-boyle-bir-parfum'])).toBe('unknown');
    expect(topFourError([a, 'yok-boyle-bir-parfum'])).toBe('unknown');
  });
});

describe('cleanTopFour', () => {
  test('sirayi koruyor', () => {
    expect(cleanTopFour([c, a, b])).toEqual([c, a, b]);
  });

  test('yinelenenleri ilk gorunume indiriyor', () => {
    expect(cleanTopFour([a, b, a, c])).toEqual([a, b, c]);
  });

  test('bilinmeyeni atiyor ve dortte kesiyor', () => {
    expect(cleanTopFour([a, 'yok', b, c, d, e])).toEqual([a, b, c, d]);
  });
});

describe('setSlot', () => {
  test('bos yuvaya ekliyor', () => {
    expect(setSlot([a], 1, b)).toEqual([a, b]);
  });

  test('dolu yuvanin uzerine yaziyor', () => {
    expect(setSlot([a, b, c], 1, d)).toEqual([a, d, c]);
  });

  test('yuvayi bosaltiyor ve arkasi kayiyor', () => {
    /* Boşluk bırakmıyoruz: üçüncüsünü silen kişi iki parfümlü bir Top 4 görür. */
    expect(setSlot([a, b, c], 1, null)).toEqual([a, c]);
  });

  test('zaten listede olan parfum eski yuvasindan kalkiyor', () => {
    /*
      Aynı parfümü ikinci bir yuvaya koymak "taşımak" demek; iki kopya
      bırakmak `duplicate` hatasına düşerdi ve kullanıcı sebebini anlamazdı.
    */
    expect(setSlot([a, b, c], 0, c)).toEqual([c, b]);
  });

  test('araliktan disari yuva yok sayiliyor', () => {
    expect(setSlot([a], -1, b)).toEqual([a]);
    expect(setSlot([a], MAX_TOP_FOUR, b)).toEqual([a]);
  });

  test('bilinmeyen parfum eklenmiyor', () => {
    expect(setSlot([a], 1, 'yok-boyle-bir-parfum')).toEqual([a]);
  });
});
