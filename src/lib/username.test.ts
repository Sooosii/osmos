import { describe, expect, test } from 'vitest';
import { RESERVED_USERNAMES, normalizeUsername, usernameError } from '@/lib/username';

describe('normalizeUsername', () => {
  test('kucuge indiriyor ve kirpiyor', () => {
    expect(normalizeUsername('  SoOoSii  ')).toBe('sooosii');
  });

  test('zaten temiz olani degistirmiyor', () => {
    expect(normalizeUsername('oud_lover')).toBe('oud_lover');
  });
});

describe('usernameError', () => {
  test('gecerli adlar hata vermiyor', () => {
    for (const ok of ['sooosii', 'oud_lover', 'abc', 'a'.repeat(20), 'a_1']) {
      expect(usernameError(ok), ok).toBeNull();
    }
  });

  test('uzunluk siniri', () => {
    expect(usernameError('ab')).toBe('tooShort');
    expect(usernameError('a'.repeat(21))).toBe('tooLong');
  });

  test('yalnizca a-z 0-9 alt tire', () => {
    for (const bad of ['Ali Veli', 'ödül', 'a-b', 'a.b', 'a/b', 'a@b', 'çiçek']) {
      expect(usernameError(bad), bad).toBe('charset');
    }
  });

  test('rakamla baslamiyor', () => {
    /* `/u/404` gibi adresler sayfa mı kullanıcı mı belirsiz görünüyor. */
    expect(usernameError('1abc')).toBe('startsWithDigit');
    expect(usernameError('_abc')).toBe('startsWithDigit');
  });

  test('rezerve adlar alinmiyor', () => {
    for (const taken of ['signin', 'settings', 'api', 'osmos', 'notes', 'perfume']) {
      expect(usernameError(taken), taken).toBe('reserved');
    }
  });

  test('kisa rezerve adlar da alinmiyor — uzunluktan takiliyorlar', () => {
    /*
      `en` ve `tr` listede ama uzunluk denetimi önce çalışıyor, o yüzden
      `tooShort` dönüyorlar. Davranış doğru — ikisi de reddediliyor — ve
      mesaj daha yardımcı. Listedeki karşılıkları ölü değil: alt sınır bir
      gün düşürülürse kapıyı onlar tutacak.
    */
    for (const taken of ['tr', 'en']) {
      expect(usernameError(taken), taken).not.toBeNull();
    }
  });

  test('rezerve liste sitenin gercek yollarini kapsiyor', () => {
    /*
      ⚠️ Yeni bir kök yol eklenirse buraya da yazılmalı: aksi hâlde biri o adı
      kullanıcı adı olarak alır ve `/u/<ad>` ile `/<ad>` iki ayrı şey olsa da
      insan gözünde karışır — daha kötüsü, ileride o ad bir sayfaya dönüşürse
      kullanıcının profili sessizce gölgelenir.
    */
    for (const path of ['notes', 'note', 'perfume', 'space', 'evolution', 'feed', 'u']) {
      expect(RESERVED_USERNAMES.has(path), path).toBe(true);
    }
  });

  test('buyuk harfli girdi once normalize edilmis sayiliyor', () => {
    /* Denetim küçük harf bekliyor; çağıran `normalizeUsername`den geçirir. */
    expect(usernameError(normalizeUsername('SOOOSII'))).toBeNull();
  });
});
