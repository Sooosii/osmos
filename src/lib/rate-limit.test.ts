import { afterEach, describe, expect, test, vi } from 'vitest';
import {
  __clearRateMemory,
  allow,
  clientIp,
  secondsLeft,
  verdictOf,
  windowSlot,
} from '@/lib/rate-limit';

afterEach(() => {
  __clearRateMemory();
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

describe('pencere matematigi', () => {
  test('ayni pencerede ayni dilim, sonrakinde farkli', () => {
    /*
      ⚠️ Taban pencere başına HİZALI seçiliyor. Sabit pencerenin sınırı mutlak
      zamana göre, ilk isteğe göre değil: hizasız bir damgadan 59 saniye
      sonrası pekâlâ bir sonraki dilime düşebilir. Bu, sabit pencerenin
      bilinen bedeli (sınırda iki katlık patlama) ve sınama onu yansıtmalı.
    */
    const t = Math.floor(1_000_000_000_000 / 60_000) * 60_000;
    expect(windowSlot(t, 60)).toBe(windowSlot(t + 59_000, 60));
    expect(windowSlot(t, 60)).not.toBe(windowSlot(t + 61_000, 60));
  });

  test('kalan sure hep 1 ile pencere arasinda', () => {
    for (const offset of [0, 1, 30, 59, 60, 61, 3599]) {
      const left = secondsLeft(1_000_000_000_000 + offset * 1000, 60);
      expect(left).toBeGreaterThanOrEqual(1);
      expect(left).toBeLessThanOrEqual(60);
    }
  });
});

describe('verdictOf', () => {
  test('sinira KADAR geciyor, ustunde durduruyor', () => {
    /* Sınır 3 ise üçüncü istek de geçmeli; dördüncü durmalı. */
    const now = 1_000_000_000_000;
    expect(verdictOf(1, 3, now, 60).ok).toBe(true);
    expect(verdictOf(3, 3, now, 60).ok).toBe(true);
    expect(verdictOf(4, 3, now, 60).ok).toBe(false);
  });

  test('durdururken ne kadar bekleneceğini soyluyor', () => {
    const v = verdictOf(99, 3, 1_000_000_000_000, 60);
    expect(v.retryAfter).toBeGreaterThan(0);
    expect(v.retryAfter).toBeLessThanOrEqual(60);
  });
});

describe('clientIp', () => {
  test('once x-real-ip — Vercelin bastigi, istemcinin uyduramadigi baslik', () => {
    const h = new Headers({ 'x-real-ip': '3.3.3.3', 'x-forwarded-for': '1.1.1.1, 2.2.2.2' });
    expect(clientIp(h)).toBe('3.3.3.3');
  });

  test('yedek olarak x-forwarded-for ilk giris', () => {
    expect(clientIp(new Headers({ 'x-forwarded-for': '1.1.1.1, 2.2.2.2' }))).toBe('1.1.1.1');
  });

  test('hicbiri yoksa tek kova — yerelde olan bu', () => {
    expect(clientIp(new Headers())).toBe('bilinmeyen');
  });
});

describe('allow — bellek yolu', () => {
  test('sinira kadar geciyor, sonra durduruyor', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    for (let i = 0; i < 3; i += 1) {
      expect((await allow('deneme', 'a', 3, 60)).ok).toBe(true);
    }
    const blocked = await allow('deneme', 'a', 3, 60);
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfter).toBeGreaterThan(0);
  });

  test('KIMLIKLER birbirini etkilemiyor', async () => {
    /* Bir botun kilitlenmesi başka ziyaretçiyi kilitlememeli. */
    vi.stubEnv('NODE_ENV', 'development');
    for (let i = 0; i < 4; i += 1) await allow('deneme', 'bot', 3, 60);
    expect((await allow('deneme', 'insan', 3, 60)).ok).toBe(true);
  });

  test('KOVALAR birbirini etkilemiyor', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    for (let i = 0; i < 4; i += 1) await allow('nearest', 'a', 3, 60);
    expect((await allow('shelf', 'a', 3, 60)).ok).toBe(true);
  });

  test('pencere kapaninca sayac sifirlaniyor', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-12T00:00:00Z'));

    for (let i = 0; i < 4; i += 1) await allow('deneme', 'a', 3, 60);
    expect((await allow('deneme', 'a', 3, 60)).ok).toBe(false);

    vi.setSystemTime(new Date('2026-08-12T00:01:30Z'));
    expect((await allow('deneme', 'a', 3, 60)).ok).toBe(true);
  });

  test('URETIMDE Redis yoksa GECIRIYOR — sinir sessizce uygulanmiyor', async () => {
    /*
      ⚠️ Bilinçli: sayaç tutulamıyorken reddetmek, bir yapılandırma
      eksikliğini site kesintisine çevirirdi. Sınır bir koruma, güvenlik
      sınırı değil — yetkiyi Server Action'lardaki oturum denetimi veriyor.
    */
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('KV_REST_API_URL', '');
    vi.stubEnv('KV_REST_API_TOKEN', '');
    vi.stubEnv('UPSTASH_REDIS_REST_URL', '');
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '');

    for (let i = 0; i < 10; i += 1) {
      expect((await allow('deneme', 'a', 3, 60)).ok).toBe(true);
    }
  });
});
