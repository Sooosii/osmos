import { describe, expect, test } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  ACILIS_SEEN_KEY,
  type SessionLike,
  acilisiIsaretle,
  acilistanGecildi,
  oturumOku,
  oturumYaz,
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

describe('genel depo yardimcilari', () => {
  test('okuma ve yazma herhangi bir anahtarla calisiyor', () => {
    const depo = sahteDepo();
    oturumYaz(depo, 'osmos:deneme', 'x');
    expect(oturumOku(depo, 'osmos:deneme')).toBe('x');
    expect(oturumOku(depo, 'olmayan')).toBe(null);
  });

  test('firlatan depo yutuluyor', () => {
    expect(oturumOku(firlatanDepo(), 'osmos:deneme')).toBe(null);
    expect(() => oturumYaz(firlatanDepo(), 'osmos:deneme', 'x')).not.toThrow();
  });
});

/** Bir ağaçtaki bütün kaynak dosyalar. */
function kaynaklar(dir: string): string[] {
  const found: string[] = [];

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) found.push(...kaynaklar(path));
    else if (path.endsWith('.ts') || path.endsWith('.tsx')) found.push(path);
  }

  return found;
}

test('hicbir yerde ciplak sessionStorage cagrisi yok', () => {
  /*
   * ⚠️ **Uykudaki bir Safari tuzağının nöbetçisi.** Safari "bütün çerezleri
   * engelle" açıkken `window.sessionStorage`a **erişmek bile** `SecurityError`
   * fırlatıyor. Orası sitenin giriş kapısı. Erişimin tek güvenli yolu `oturumDeposu()` +
   * `oturumOku`/`oturumYaz`.
   */
  const offenders: string[] = [];

  for (const file of kaynaklar('src')) {
    if (file.endsWith('acilis-oturum.ts') || file.endsWith('acilis-oturum.test.ts')) continue;

    readFileSync(file, 'utf8')
      .split('\n')
      .forEach((line, index) => {
        const trimmed = line.trimStart();
        const yorum = trimmed.startsWith('*') || trimmed.startsWith('//') || trimmed.startsWith('/*');
        if (!yorum && line.includes('sessionStorage')) {
          offenders.push(`${file}:${index + 1}`);
        }
      });
  }

  expect(offenders).toEqual([]);
});
