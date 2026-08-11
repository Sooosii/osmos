import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest';

/**
 * Giriş sisteminin entegrasyon sınaması — **gerçek Postgres üzerinde**.
 *
 * PGlite, Postgres'in WASM sürümü: göç dosyası (`drizzle/0000_*.sql`) burada
 * gerçekten koşuyor ve kayıt/giriş akışı gerçek SQL üretiyor. Taklit bir
 * veritabanıyla sınanan kimlik kodu sınanmamış sayılır — hatalar tam da
 * şemayla kütüphanenin anlaşamadığı yerde çıkıyor ve taklit orayı göremez.
 *
 * Yayında sürücü Neon (HTTP), burada PGlite; ikisi de Postgres ve aynı DDL'i
 * koşuyor. Kapsanmayan tek şey sürücünün kendisi.
 *
 * ⚠️ Google girişi burada sınanamaz (gerçek OAuth sağlayıcısı gerekiyor);
 * kapsanan e-posta/şifre yolu ve oturum.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let auth: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let client: any;

beforeAll(async () => {
  vi.stubEnv('BETTER_AUTH_SECRET', 'sinama-icin-sabit-anahtar-0123456789');
  vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'http://localhost:3000');
  /* Anahtar yokken mektup konsola yazılıyor; sınamada sessiz kalsın. */
  vi.spyOn(console, 'info').mockImplementation(() => {});

  const { PGlite } = await import('@electric-sql/pglite');
  const { drizzle } = await import('drizzle-orm/pglite');
  const schema = await import('@/db/schema');
  const { buildAuth } = await import('@/lib/auth');

  client = new PGlite();
  const db = drizzle(client, { schema });

  /* Göç dosyası aynen koşuyor — şema sınamada uydurulmuyor. */
  const sql = readFileSync('drizzle/0000_young_hellion.sql', 'utf8');
  for (const statement of sql.split('--> statement-breakpoint')) {
    const trimmed = statement.trim();
    if (trimmed) await client.exec(trimmed);
  }

  auth = buildAuth(db);
}, 60000);

afterAll(async () => {
  await client?.close();
  vi.unstubAllEnvs();
});

describe('e-posta ile kayit', () => {
  test('hesap aciliyor ve dogrulanmamis basliyor', async () => {
    const result = await auth.api.signUpEmail({
      body: { name: 'Deneme', email: 'deneme@osmos.test', password: 'cok-guclu-sifre' },
    });

    expect(result.user.email).toBe('deneme@osmos.test');
    expect(result.user.emailVerified).toBe(false);
  });

  test('ek alanlar varsayilanlariyla yaziliyor', async () => {
    /*
      ⚠️ Bu sınama, şema ile `additionalFields` arasındaki ayrışmayı yakalıyor
      — ayrışırlarsa Better Auth alanı görmez ve kayıt SESSIZCE yarım kalır.
    */
    const rows = await client.query(
      `select username, bio, hidden, email_opt_in from "user" where email = $1`,
      ['deneme@osmos.test'],
    );
    expect(rows.rows[0]).toEqual({
      username: null,
      bio: null,
      hidden: false,
      email_opt_in: false,
    });
  });

  test('ayni e-postayla ikinci hesap acilmiyor — ve hata da vermiyor', async () => {
    /*
      ⚠️ **Bu davranış ölçüldü ve doğru olan bu; "hata dönmüyor" diye
      düzeltilmeye kalkışılmasın.**
      İlk sınama `rejects.toThrow()` bekliyordu ve kırıldı. Sebebi araştırıldı:
      Better Auth yinelenen kayıtta bilerek **sahte bir başarı** dönüyor —
      **e-posta sızdırmasını** engellemek için. Reddetseydi, uç bir adresin
      kayıtlı olup olmadığını herkese söyleyen bir sorgu hâline gelirdi.

      Ölçülenler (PGlite üzerinde, gerçek SQL):
        · veritabanında hâlâ TEK satır ve gerçek kullanıcının verisi el değmemiş
        · dönen nesne saldırganın KENDİ girdisi (uydurma id, gönderdiği ad,
          `bio: null`) — gerçek kullanıcıdan hiçbir şey sızmıyor
        · `token: null` — oturum açılmıyor
        · saldırganın şifresiyle giriş denendi: **çalışmıyor**

      Bedeli bir kullanım pürüzü: hesabı olduğunu unutan kişi "gelen kutuna
      bak" görür ve mektup gelmez. Karşılığı giriş ekranındaki "zaten hesabım
      var" ve şifre sıfırlama bağlantısı (`account.haveAccount`).
    */
    const before = await client.query(`select count(*)::int as n from "user"`);

    const second = await auth.api.signUpEmail({
      body: { name: 'Ikinci', email: 'deneme@osmos.test', password: 'baska-bir-sifre' },
    });

    const after = await client.query(`select count(*)::int as n from "user"`);

    expect(after.rows[0].n).toBe(before.rows[0].n);
    expect(second.token).toBeNull();
  });

  test('ikinci sifre gercek hesabi ele geciremiyor', async () => {
    /* Yukarıdaki sahte cevabın gerçekten zararsız olduğunun kanıtı. */
    await client.query(`update "user" set email_verified = true where email = $1`, [
      'deneme@osmos.test',
    ]);
    await expect(
      auth.api.signInEmail({
        body: { email: 'deneme@osmos.test', password: 'baska-bir-sifre' },
      }),
    ).rejects.toThrow();
    /* Sonraki sınamalar doğrulanmamış hâli bekliyor; geri alınıyor. */
    await client.query(`update "user" set email_verified = false where email = $1`, [
      'deneme@osmos.test',
    ]);
  });

  test('kisa sifre reddediliyor', async () => {
    await expect(
      auth.api.signUpEmail({
        body: { name: 'Kisa', email: 'kisa@osmos.test', password: 'abc' },
      }),
    ).rejects.toThrow();
  });
});

describe('giris', () => {
  test('dogrulanmamis adres giris yapamiyor', async () => {
    /*
      ⚠️ `requireEmailVerification` açık. Kapalı olsaydı herkes başkasının
      e-postasıyla hesap açabilir, adresin sahibi durumu ancak profilini
      birinin aldığını görünce anlardı.
    */
    await expect(
      auth.api.signInEmail({
        body: { email: 'deneme@osmos.test', password: 'cok-guclu-sifre' },
      }),
    ).rejects.toThrow();
  });

  test('yanlis sifre reddediliyor', async () => {
    await expect(
      auth.api.signInEmail({
        body: { email: 'deneme@osmos.test', password: 'yanlis-sifre-bu' },
      }),
    ).rejects.toThrow();
  });

  test('dogrulanmis adres girebiliyor ve oturum aciliyor', async () => {
    await client.query(`update "user" set email_verified = true where email = $1`, [
      'deneme@osmos.test',
    ]);

    const result = await auth.api.signInEmail({
      body: { email: 'deneme@osmos.test', password: 'cok-guclu-sifre' },
      asResponse: true,
    });

    expect(result.status).toBe(200);
    /* Oturum çerezi gerçekten set ediliyor mu — sitenin ilk çerezi. */
    expect(result.headers.get('set-cookie')).toContain('better-auth');
  });
});

describe('hesap silme cascade', () => {
  test('kullanici gidince top four ve oturumlari da gidiyor', async () => {
    /*
      ⚠️ Şemadaki `onDelete: 'cascade'` gerçekten çalışıyor mu — yetim bir
      oturum satırı, silinmiş bir hesabın hâlâ girişte kalması demek.
    */
    const user = await client.query(`select id from "user" where email = $1`, [
      'deneme@osmos.test',
    ]);
    const userId = user.rows[0].id;

    await client.query(
      `insert into top_four (id, user_id, perfume_id, position) values ($1, $2, $3, $4)`,
      ['tf1', userId, 'dior-oud-ispahan', 0],
    );

    await client.query(`delete from "user" where id = $1`, [userId]);

    const left = await client.query(`select count(*)::int as n from top_four where user_id = $1`, [
      userId,
    ]);
    const sessions = await client.query(
      `select count(*)::int as n from session where user_id = $1`,
      [userId],
    );
    expect(left.rows[0].n).toBe(0);
    expect(sessions.rows[0].n).toBe(0);
  });
});
