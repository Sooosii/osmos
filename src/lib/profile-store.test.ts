import { readFileSync, readdirSync } from 'node:fs';
import { beforeAll, beforeEach, describe, expect, test } from 'vitest';
import { PERFUMES } from '@/data/perfumes';

/**
 * Profil yazma tarafı — **gerçek Postgres üzerinde** (PGlite).
 *
 * Yetki denetimi içeren kod taklitle sınandığında sınanmamış sayılır. Burada
 * göç dosyası gerçekten koşuyor, benzersizlik kısıtları gerçekten devrede ve
 * `position` çakışmaları gerçekten hata veriyor.
 */

const [a, b, c, d, e] = PERFUMES.map((perfume) => perfume.id);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let db: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let client: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let store: any;

async function makeUser(id: string, email: string) {
  await client.query(
    `insert into "user" (id, name, email, email_verified, created_at, updated_at)
     values ($1, $2, $3, true, now(), now())`,
    [id, 'Deneme', email],
  );
}

beforeAll(async () => {
  const { PGlite } = await import('@electric-sql/pglite');
  const { drizzle } = await import('drizzle-orm/pglite');
  const schema = await import('@/db/schema');
  store = await import('@/lib/profile-store');

  client = new PGlite();
  db = drizzle(client, { schema });

  /*
    ⚠️ Bütün göçler sırayla koşuyor, yalnız ilki değil: yeni bir göç dosyası
    eklendiğinde sınama onu kendiliğinden alıyor. Tek dosya adı yazılsaydı
    şema sınamada eskide kalır ve fark ancak üretimde görünürdü.
  */
  for (const file of readdirSync('drizzle').filter((f) => f.endsWith('.sql')).sort()) {
    const sql = readFileSync(`drizzle/${file}`, 'utf8');
    for (const statement of sql.split('--> statement-breakpoint')) {
      if (statement.trim()) await client.exec(statement.trim());
    }
  }
}, 60000);

beforeEach(async () => {
  await client.query('delete from composition');
  await client.query('delete from top_four');
  await client.query('delete from "user"');
});

describe('claimUsername', () => {
  test('gecerli ad yaziliyor ve normalize ediliyor', async () => {
    await makeUser('u1', 'u1@osmos.test');
    const result = await store.claimUsername(db, 'u1', '  SoOoSii ');
    expect(result).toEqual({ ok: true, username: 'sooosii' });

    const rows = await client.query(`select username from "user" where id = 'u1'`);
    expect(rows.rows[0].username).toBe('sooosii');
  });

  test('kural disi ad reddediliyor ve veriye dokunmuyor', async () => {
    await makeUser('u1', 'u1@osmos.test');
    expect((await store.claimUsername(db, 'u1', 'ab')).error).toBe('tooShort');
    expect((await store.claimUsername(db, 'u1', 'notes')).error).toBe('reserved');
    expect((await store.claimUsername(db, 'u1', 'a b')).error).toBe('charset');

    const rows = await client.query(`select username from "user" where id = 'u1'`);
    expect(rows.rows[0].username).toBeNull();
  });

  test('baskasinin adi alinamiyor — buyuk/kucuk harf dahil', async () => {
    /*
      ⚠️ Adres büyük/küçük harfe duyarsız görünüyor ama sütun duyarlı:
      `Sooosii` ile `sooosii` iki satır olabilirdi ve ikisi de aynı adrese
      denk gelirdi. Yazan taraf normalize ettiği için bu imkânsız.
    */
    await makeUser('u1', 'u1@osmos.test');
    await makeUser('u2', 'u2@osmos.test');
    await store.claimUsername(db, 'u1', 'sooosii');

    expect((await store.claimUsername(db, 'u2', 'SOOOSII')).error).toBe('taken');
  });

  test('kendi adini tekrar almak sorun degil', async () => {
    await makeUser('u1', 'u1@osmos.test');
    await store.claimUsername(db, 'u1', 'sooosii');
    expect((await store.claimUsername(db, 'u1', 'sooosii')).ok).toBe(true);
  });

  test('olmayan kullaniciya yazilmiyor', async () => {
    expect((await store.claimUsername(db, 'yok', 'birisi')).error).toBe('noSuchUser');
  });
});

describe('saveProfile', () => {
  test('satir kaydediliyor, bosluklar tekleniyor', async () => {
    await makeUser('u1', 'u1@osmos.test');
    await store.saveProfile(db, 'u1', { bio: '  oud   ve   duman \n ikinci satir ' });
    const rows = await client.query(`select bio from "user" where id = 'u1'`);
    expect(rows.rows[0].bio).toBe('oud ve duman ikinci satir');
  });

  test('bos satir null oluyor', async () => {
    await makeUser('u1', 'u1@osmos.test');
    await store.saveProfile(db, 'u1', { bio: '   ' });
    const rows = await client.query(`select bio from "user" where id = 'u1'`);
    expect(rows.rows[0].bio).toBeNull();
  });

  test('uzun satir reddediliyor', async () => {
    await makeUser('u1', 'u1@osmos.test');
    const result = await store.saveProfile(db, 'u1', { bio: 'x'.repeat(200) });
    expect(result.error).toBe('bioTooLong');
  });

  test('gizleme ve e-posta onayi yaziliyor', async () => {
    await makeUser('u1', 'u1@osmos.test');
    await store.saveProfile(db, 'u1', { hidden: true, emailOptIn: true });
    const rows = await client.query(`select hidden, email_opt_in from "user" where id = 'u1'`);
    expect(rows.rows[0]).toEqual({ hidden: true, email_opt_in: true });
  });
});

describe('top four yazma', () => {
  test('yuvalar sirasiyla yaziliyor ve sirali okunuyor', async () => {
    await makeUser('u1', 'u1@osmos.test');
    await store.writeSlot(db, 'u1', 0, a);
    await store.writeSlot(db, 'u1', 1, b);
    expect(await store.readTopFour(db, 'u1')).toEqual([a, b]);
  });

  test('bosaltinca arkasi kayiyor ve position bosluk birakmiyor', async () => {
    /*
      ⚠️ Bütün liste yeniden yazılıyor; tek satır güncellenseydi `position`
      benzersizlik kısıtına çarpan yarım bir durum doğardı.
    */
    await makeUser('u1', 'u1@osmos.test');
    for (const [i, id] of [a, b, c].entries()) await store.writeSlot(db, 'u1', i, id);

    await store.writeSlot(db, 'u1', 1, null);
    expect(await store.readTopFour(db, 'u1')).toEqual([a, c]);

    const rows = await client.query(`select position from top_four where user_id = 'u1' order by position`);
    expect(rows.rows.map((r: { position: number }) => r.position)).toEqual([0, 1]);
  });

  test('ayni parfum ikinci yuvaya TASINIYOR', async () => {
    await makeUser('u1', 'u1@osmos.test');
    for (const [i, id] of [a, b, c].entries()) await store.writeSlot(db, 'u1', i, id);
    const result = await store.writeSlot(db, 'u1', 0, c);
    expect(result.ids).toEqual([c, b]);
  });

  test('uydurma kimlik yazilmiyor', async () => {
    await makeUser('u1', 'u1@osmos.test');
    const result = await store.writeSlot(db, 'u1', 0, 'yok-boyle-bir-parfum');
    expect(result.ok).toBe(true);
    /* `setSlot` bilinmeyeni zaten reddediyor; liste boş kalıyor. */
    expect(await store.readTopFour(db, 'u1')).toEqual([]);
  });

  test('appendToTopFour: ilk bos yuvaya ekliyor', async () => {
    await makeUser('u1', 'u1@osmos.test');
    await store.appendToTopFour(db, 'u1', a);
    await store.appendToTopFour(db, 'u1', b);
    expect(await store.readTopFour(db, 'u1')).toEqual([a, b]);
  });

  test('appendToTopFour: yinelenen ve dortten fazlasi reddediliyor', async () => {
    await makeUser('u1', 'u1@osmos.test');
    for (const id of [a, b, c, d]) await store.appendToTopFour(db, 'u1', id);

    expect((await store.appendToTopFour(db, 'u1', a)).error).toBe('duplicate');
    expect((await store.appendToTopFour(db, 'u1', e)).error).toBe('tooMany');
    expect(await store.readTopFour(db, 'u1')).toEqual([a, b, c, d]);
  });

  test('iki kullanicinin listeleri birbirine karismiyor', async () => {
    await makeUser('u1', 'u1@osmos.test');
    await makeUser('u2', 'u2@osmos.test');
    await store.appendToTopFour(db, 'u1', a);
    await store.appendToTopFour(db, 'u2', b);

    expect(await store.readTopFour(db, 'u1')).toEqual([a]);
    expect(await store.readTopFour(db, 'u2')).toEqual([b]);
  });

  test('ayni parfum farkli kullanicilarda olabiliyor', async () => {
    /* Benzersizlik kısıtı `(userId, perfumeId)`; parfüm tek başına değil. */
    await makeUser('u1', 'u1@osmos.test');
    await makeUser('u2', 'u2@osmos.test');
    await store.appendToTopFour(db, 'u1', a);
    expect((await store.appendToTopFour(db, 'u2', a)).ok).toBe(true);
  });
});

describe('kompozisyonlar', () => {
  const note = (id: string, weight = 0.6) => ({ noteId: id, tier: 'heart' as const, weight });
  const three = [note('oud'), note('iris'), note('bergamot')];
  const four = [...three, note('vanilla')];

  test('patron olmayan uce kadar kaydedebiliyor', async () => {
    await makeUser('u1', 'u1@osmos.test');
    const result = await store.saveComposition(db, 'u1', { name: 'Gece Inciri', notes: three });
    expect(result).toEqual({ ok: true, slug: 'gece-inciri' });
  });

  test('⚠️ PATRON OLMAYAN DORDUNCU NOTAYI SUNUCUDA DA GECEMIYOR', async () => {
    /*
      Bu sınama işin kilidi. Ekrandaki sayaç bir kolaylık; Server Action'lar
      herkese açık uçlardır ve istemci kodunu okuyan biri doğrudan çağırabilir.
      Kapı burada olmazsa ücretli katman hiç yok demektir.
    */
    await makeUser('u1', 'u1@osmos.test');
    const result = await store.saveComposition(db, 'u1', { name: 'Kacak', notes: four });
    expect(result).toEqual({ ok: false, error: 'needsPatron' });

    const rows = await client.query(`select count(*)::int as n from composition`);
    expect(rows.rows[0].n).toBe(0);
  });

  test('patron dorduncuyu gecebiliyor', async () => {
    await makeUser('u1', 'u1@osmos.test');
    await client.query(`update "user" set patron = true where id = 'u1'`);
    expect((await store.saveComposition(db, 'u1', { name: 'Dort', notes: four })).ok).toBe(true);
  });

  test('adsiz kompozisyon kaydedilmiyor', async () => {
    await makeUser('u1', 'u1@osmos.test');
    expect((await store.saveComposition(db, 'u1', { name: '   ', notes: three })).error).toBe(
      'noName',
    );
  });

  test('gecersiz kompozisyon kaydedilmiyor', async () => {
    await makeUser('u1', 'u1@osmos.test');
    expect((await store.saveComposition(db, 'u1', { name: 'Tek', notes: [note('oud')] })).error)
      .toBe('tooFew');
    expect(
      (await store.saveComposition(db, 'u1', { name: 'Yok', notes: [note('yok'), note('iris')] }))
        .error,
    ).toBe('unknown');
  });

  test('ayni ad ikinci kez cakismiyor', async () => {
    await makeUser('u1', 'u1@osmos.test');
    await store.saveComposition(db, 'u1', { name: 'Gece', notes: three });
    const second = await store.saveComposition(db, 'u1', { name: 'Gece', notes: three });
    expect(second).toEqual({ ok: true, slug: 'gece-2' });
  });

  test('listeleme yeniden eskiye, silme calisiyor', async () => {
    await makeUser('u1', 'u1@osmos.test');
    await store.saveComposition(db, 'u1', { name: 'Bir', notes: three });
    await client.query(`update composition set created_at = now() - interval '1 hour'`);
    await store.saveComposition(db, 'u1', { name: 'Iki', notes: three });

    const list = await store.listCompositions(db, 'u1');
    expect(list.map((c: { name: string }) => c.name)).toEqual(['Iki', 'Bir']);

    await store.deleteComposition(db, 'u1', 'bir');
    expect((await store.listCompositions(db, 'u1')).map((c: { slug: string }) => c.slug)).toEqual([
      'iki',
    ]);
  });

  test('bozuk kayit listede sayfayi cokertmiyor, atlanıyor', async () => {
    /* Veriden bir nota çıkarsa eski kompozisyon sessizce düşüyor. */
    await makeUser('u1', 'u1@osmos.test');
    await client.query(
      `insert into composition (id, user_id, slug, name, notes) values ($1,$2,$3,$4,$5)`,
      ['bozuk', 'u1', 'bozuk', 'Bozuk', JSON.stringify([{ noteId: 'yok', tier: 'heart', weight: 1 }])],
    );
    expect(await store.listCompositions(db, 'u1')).toEqual([]);
  });

  test('hesap silinince kompozisyonlar da gidiyor', async () => {
    await makeUser('u1', 'u1@osmos.test');
    await store.saveComposition(db, 'u1', { name: 'Gece', notes: three });
    await client.query(`delete from "user" where id = 'u1'`);
    const rows = await client.query(`select count(*)::int as n from composition`);
    expect(rows.rows[0].n).toBe(0);
  });
});
