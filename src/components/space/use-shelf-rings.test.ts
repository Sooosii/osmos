import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';

/**
 * Girişsiz ziyaretçinin boşuna sormaması.
 *
 * Bu kanca `/api/shelf`i koşulsuz çağırıyordu ve belirtisi yoktu: sayfa
 * doğru çiziliyor, konsol susuyor, sınamalar geçiyordu. Görünen tek yer ağ
 * sekmesiydi — ana sayfayı açan **her** insan boş bir cevap için bir sunucu
 * çağrısı ve bir hız-sınırı sorgusu harcıyordu. Giriş daveti bugün kapalı,
 * yani "her insan" gerçekten herkes demek.
 *
 * Denetim silinirse hata aynen geri gelir ve yine hiçbir şey söylemez.
 */

describe('raf halkalari', () => {
  const source = readFileSync('src/components/space/use-shelf-rings.ts', 'utf8');

  test('oturum yoksa istek hic gitmiyor', () => {
    /*
      ⚠️ Denetim `fetch`ten ÖNCE ve `useEffect`in içinde olmak zorunda.
      `isPending` de şart: oturum çözülmeden "girişsiz" saymak, girişli
      kişinin halkalarını hiç çizmemek olurdu.
    */
    expect(source).toContain("import { useSession } from '@/lib/auth-client'");
    expect(source).toMatch(/if \(isPending \|\| !signedIn\) return;/);

    const guard = source.indexOf('if (isPending || !signedIn) return;');
    const call = source.indexOf("fetch('/api/shelf')");

    expect(guard).toBeGreaterThan(-1);
    expect(call).toBeGreaterThan(guard);
  });

  test('oturum bagimliliklari efektte yazili', () => {
    /* Eksik olsalar lint yakalardı; burada olmaları davranışın kendisi:
       kişi giriş yaptığı an halkalar geliyor, sayfa yenilenmeden. */
    expect(source).toMatch(/\}, \[shelvedRef, requestDraw, isPending, signedIn\]\);/);
  });
});
