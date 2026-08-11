import { beforeEach, describe, expect, test, vi } from 'vitest';

/**
 * Raf ucu.
 *
 * ⚠️ Taklit edilen şey **oturum okuyucusu**, sınanan şey değil. `currentViewer`
 * kendi yerinde (gerçek Better Auth ve gerçek Postgres üzerinde) sınanıyor;
 * burada denetlenen, ucun iki dalı ve başlığı.
 */
const viewer = vi.hoisted(() => ({ current: null as { id: string } | null }));
const shelf = vi.hoisted(() => ({ rows: [] as { perfumeId: string; kind: string }[] }));

vi.mock('@/lib/dal', () => ({
  currentViewer: async () => viewer.current,
  shelfOf: async () => shelf.rows,
}));

const { GET } = await import('@/app/api/shelf/route');

/** Uç artık isteği okuyor (hız sınırı için IP); sınamalarda boş bir istek yeter. */
const req = (ip = '10.0.0.1') =>
  new Request('https://osmos.me/api/shelf', { headers: { 'x-real-ip': ip } });

beforeEach(() => {
  viewer.current = null;
  shelf.rows = [];
});

describe('GET /api/shelf', () => {
  test('girissizde bos liste — hata degil', async () => {
    /*
      Uç uzayın açılışında da çağrılıyor ve ziyaretçilerin çoğu girişsiz.
      401 dönseydi her ziyarette konsol kırmızı yanar, gerçek arıza o
      gürültünün içinde kaybolurdu.
    */
    const response = await GET(req());
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ entries: [] });
  });

  test('girisliye kendi rafi donuyor', async () => {
    viewer.current = { id: 'u1' };
    shelf.rows = [{ perfumeId: 'a', kind: 'owned' }];

    expect(await (await GET(req())).json()).toEqual({ entries: [{ perfumeId: 'a', kind: 'owned' }] });
  });

  test('cevap paylasimli onbellege GIRMIYOR', async () => {
    /*
      ⚠️ Kişiye özel veri. Ara bir vekil bu cevabı tutsaydı birinin rafını
      başkasına servis ederdi — sessiz ve gerçek bir sızıntı.
    */
    const header = (await GET(req())).headers.get('cache-control') ?? '';
    expect(header).toContain('no-store');
    expect(header).toContain('private');
  });
});
