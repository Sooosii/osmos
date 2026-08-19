import { afterEach, describe, expect, test, vi } from 'vitest';
import { POST } from '@/app/api/tiklama/route';
import { __clearMemoryStore, ayDilimi, ayinTiklamalari } from '@/lib/tiklama-store';

/**
 * Turnikenin kapısı.
 *
 * ⚠️ Sayılan şey müşteriye rakam olarak söyleniyor ve yıllık ücretin dayanağı
 * oluyor. Bu yüzden sınamanın ağırlığı "sayıyor mu"da değil, **"sayılmaması
 * gerekeni saymıyor mu"**da: uydurma parfüm, o parfümde olmayan satıcı,
 * serbest metin. Şişmiş bir sayaç, boş sayaçtan daha pahalıya patlar.
 *
 * Depo sınama ortamında bellek yolunda (env yok), yani yaz-oku döngüsü
 * uçtan uca burada dönüyor.
 */

/* Katalogdan gerçek kayıt — bu depoda veri uydurulmaz. */
const PERFUME = 'nasomatto-baraonda';
const RETAILER = 'Luckyscent';

function post(body: string): Promise<Response> {
  return POST(new Request('https://osmos.example/api/tiklama', { method: 'POST', body }));
}

function tiklama(perfume: string, retailer: string): Promise<Response> {
  return post(JSON.stringify({ perfume, retailer }));
}

async function buAyinSatirlari() {
  return ayinTiklamalari('osmos', ayDilimi(new Date()));
}

afterEach(() => {
  vi.unstubAllEnvs();
  __clearMemoryStore();
});

describe('POST /api/tiklama', () => {
  test('gecerli tiklama 204 ve sayac artiyor', async () => {
    const response = await tiklama(PERFUME, RETAILER);
    expect(response.status).toBe(204);
    expect(await buAyinSatirlari()).toEqual([
      { perfumeId: PERFUME, retailer: RETAILER, sayi: 1 },
    ]);
  });

  test('ayni cift iki kez tiklaninca sayac 2', async () => {
    await tiklama(PERFUME, RETAILER);
    await tiklama(PERFUME, RETAILER);
    expect(await buAyinSatirlari()).toEqual([
      { perfumeId: PERFUME, retailer: RETAILER, sayi: 2 },
    ]);
  });

  test('rapor coktan aza sirali — en cok goturen ust satirda', async () => {
    await tiklama(PERFUME, 'Nasomatto');
    await tiklama(PERFUME, RETAILER);
    await tiklama(PERFUME, RETAILER);

    const satirlar = await buAyinSatirlari();
    expect(satirlar.map((s) => [s.retailer, s.sayi])).toEqual([
      [RETAILER, 2],
      ['Nasomatto', 1],
    ]);
  });

  test('bozuk json 400', async () => {
    expect((await post('{bozuk')).status).toBe(400);
  });

  test('eksik alan 400', async () => {
    expect((await post(JSON.stringify({ perfume: PERFUME }))).status).toBe(400);
  });

  test('bilinmeyen parfum 400 — 500 DEGIL, hatali olan istek', async () => {
    const response = await tiklama('boyle-bir-parfum-yok', RETAILER);
    expect(response.status).toBe(400);
    expect(await buAyinSatirlari()).toHaveLength(0);
  });

  test('o parfumde olmayan satici 400 — uydurma satir rapora giremez', async () => {
    /* Gerçek bir satıcı adı, ama bu parfümün künyesinde yok. */
    const response = await tiklama('diptyque-philosykos', RETAILER);
    expect(response.status).toBe(400);
    expect(await buAyinSatirlari()).toHaveLength(0);
  });

  test('serbest metin satici 400 — anahtar evreni katalogla sinirli', async () => {
    const response = await tiklama(PERFUME, 'Uydurma Dukkan');
    expect(response.status).toBe(400);
    expect(await buAyinSatirlari()).toHaveLength(0);
  });

  test('sisik govde 413', async () => {
    const response = await post(JSON.stringify({ perfume: PERFUME, retailer: 'x'.repeat(1000) }));
    expect(response.status).toBe(413);
  });

  test('uretimde depo yoksa 503 — yarim soz verilmez', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    expect((await tiklama(PERFUME, RETAILER)).status).toBe(503);
  });
});
