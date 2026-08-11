import { describe, expect, test } from 'vitest';
import { hostOf, shouldMoveToCanonical } from '@/lib/canonical-host';

const PROD = 'production';

describe('shouldMoveToCanonical', () => {
  test('uretimde eski vercel adresi kanonige tasiniyor', () => {
    expect(shouldMoveToCanonical('osmos-three.vercel.app', 'osmos.me', PROD)).toBe(true);
  });

  test('kanonik adresin kendisi yonlendirilmiyor', () => {
    expect(shouldMoveToCanonical('osmos.me', 'osmos.me', PROD)).toBe(false);
  });

  test('ONIZLEMELER dokunulmaz', () => {
    /*
      ⚠️ Önizleme adresleri de `*.vercel.app`. Yönlendirilseydi her önizleme
      canlı siteye atlar, yani bir değişiklik yayına çıkmadan hiç görülemezdi.
    */
    expect(shouldMoveToCanonical('osmos-git-dal-sooosii.vercel.app', 'osmos.me', 'preview')).toBe(
      false,
    );
    expect(shouldMoveToCanonical('localhost:3000', 'osmos.me', 'development')).toBe(false);
  });

  test('kanonik adres kurulu degilken hicbir sey yapmiyor', () => {
    /* Kod ayardan ÖNCE yayına çıkabilsin diye; arada kırık durum olmuyor. */
    expect(shouldMoveToCanonical('osmos-three.vercel.app', null, PROD)).toBe(false);
    expect(shouldMoveToCanonical('osmos-three.vercel.app', '', PROD)).toBe(false);
  });

  test('kural YALNIZCA vercel.app adreslerine — www/apex dongusu imkansiz', () => {
    /*
      ⚠️ Kararın kalbi. Genel "kanonik olmayan her ana bilgisayarı yönlendir"
      kuralı, Vercel panelinde asıl adres `www` bırakılırsa sonsuz döngü
      üretir ve site tamamen erişilemez olur.
    */
    expect(shouldMoveToCanonical('www.osmos.me', 'osmos.me', PROD)).toBe(false);
    expect(shouldMoveToCanonical('osmos.me', 'www.osmos.me', PROD)).toBe(false);
    expect(shouldMoveToCanonical('baska-bir-yer.com', 'osmos.me', PROD)).toBe(false);
  });

  test('kanonik hala vercel.app iken yonlendirme yok', () => {
    /* Alan adı alınmadan önceki hâl: iki taraf da vercel, taşınacak yer yok. */
    expect(
      shouldMoveToCanonical('osmos-three.vercel.app', 'osmos-baska.vercel.app', PROD),
    ).toBe(false);
  });
});

describe('hostOf', () => {
  test('adresten ana bilgisayari cikariyor', () => {
    expect(hostOf('https://osmos.me')).toBe('osmos.me');
    expect(hostOf('https://osmos.me/')).toBe('osmos.me');
    expect(hostOf('  https://www.osmos.me  ')).toBe('www.osmos.me');
  });

  test('bozuk ya da bos adres null', () => {
    /* Bozuk bir değişken yüzünden site yönlendirme döngüsüne girmemeli. */
    expect(hostOf(undefined)).toBeNull();
    expect(hostOf('')).toBeNull();
    expect(hostOf('osmos.me')).toBeNull();
    expect(hostOf('bu bir adres degil')).toBeNull();
  });
});
