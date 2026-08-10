import { describe, expect, test } from 'vitest';
import {
  ACILIS_SEEN_KEY,
  type SessionLike,
  acilisiIsaretle,
  acilistanGecildi,
} from './acilis-oturum';

function sahteDepo(baslangic: Record<string, string> = {}): SessionLike {
  const store = { ...baslangic };
  return {
    getItem: (key) => store[key] ?? null,
    setItem: (key, value) => {
      store[key] = value;
    },
  };
}

/** Gizli pencere taklidi: hem okuma hem yazma fırlatıyor. */
function firlatanDepo(): SessionLike {
  return {
    getItem: () => {
      throw new Error('erişim yok');
    },
    setItem: () => {
      throw new Error('erişim yok');
    },
  };
}

describe('kapıdan geçildi mi', () => {
  test('boş oturumda kapı görünür', () => {
    expect(acilistanGecildi(sahteDepo())).toBe(false);
  });

  test('işaretlendikten sonra kapı atlanıyor', () => {
    const depo = sahteDepo();
    acilisiIsaretle(depo);
    expect(acilistanGecildi(depo)).toBe(true);
  });

  test('işaret tam olarak beklenen anahtar ve değerle yazılıyor', () => {
    const depo = sahteDepo();
    acilisiIsaretle(depo);
    expect(depo.getItem(ACILIS_SEEN_KEY)).toBe('1');
  });

  test('başka bir değer geçmiş sayılmıyor — anahtar başkasınca kirletilirse', () => {
    expect(acilistanGecildi(sahteDepo({ [ACILIS_SEEN_KEY]: 'evet' }))).toBe(false);
  });
});

describe('depo yoksa ya da fırlatıyorsa', () => {
  /*
   * Bu üç sınamanın tek bir sözü var: erişilemeyen depo, kapının GÖRÜNMESİ
   * demek. Ters tercih (hata yaymak) açılışı tamamen kırardı.
   */
  test('sunucuda (depo null) kapı görünür ve çağrı patlamıyor', () => {
    expect(acilistanGecildi(null)).toBe(false);
    expect(() => acilisiIsaretle(null)).not.toThrow();
  });

  test('okuma fırlatırsa kapı görünür', () => {
    expect(acilistanGecildi(firlatanDepo())).toBe(false);
  });

  test('yazma fırlatırsa çağrı sessizce dönüyor', () => {
    expect(() => acilisiIsaretle(firlatanDepo())).not.toThrow();
  });
});
