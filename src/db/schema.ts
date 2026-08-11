import { boolean, integer, jsonb, pgTable, text, timestamp, unique } from 'drizzle-orm/pg-core';

/**
 * Veritabanı şeması — sitenin ilk kalıcı hafızası.
 *
 * İlk dört tablo Better Auth'un sözleşmesi (`user`, `session`, `account`,
 * `verification`); adları ve alanları kütüphane tarafından bekleniyor, keyfî
 * değil. `npx @better-auth/cli generate` aynısını üretiyor — burada elle
 * duruyor ki alanların NEDEN öyle olduğu yazılabilsin.
 *
 * ⚠️ **`user` tablosuna eklenen dört alan** (`username`, `bio`, `hidden`,
 * `emailOptIn`) `lib/auth.ts`teki `user.additionalFields` ile birebir aynı
 * olmak zorunda. Ayrışırlarsa Better Auth alanı görmez ve kayıt sessizce
 * yarım kalır — hata da vermez.
 */

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  /*
    Better Auth'un kendi alanı. Bizde HİÇ doldurulmuyor: sahip profil
    fotoğrafını reddetti ve Google girişinden gelen resim adresi de
    yazılmıyor (`lib/auth.ts`te eşleme kapalı). Sütun şemada duruyor çünkü
    kütüphane onu bekliyor; boş kalması bilinçli.
  */
  image: text('image'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),

  /*
    Kullanıcı adı. Kurallar `lib/username.ts`te ve tek yerde: adres segmenti
    (`/u/sooosii`) ile bu sütun aynı modülden geçiyor.

    ⚠️ **Küçük harfle yazılıyor** ve benzersizlik ona göre. Veritabanı
    büyük/küçük harfe duyarlı; `Sooosii` ile `sooosii` iki ayrı satır olurdu
    ve ikisi de aynı adrese denk gelirdi. Yazan taraf `normalizeUsername`den
    geçiriyor.

    İlk girişte boş: kullanıcı adını seçme adımı sonra geliyor.
  */
  username: text('username').unique(),
  /** Profildeki tek satır. Uzunluk sınırı uygulamada (`BIO_MAX`). */
  bio: text('bio'),
  /** Açıkken profil kimseye açılmıyor — 404 döner, "gizli" sayfası bile yok. */
  hidden: boolean('hidden').notNull().default(false),
  /** Yeni parfüm e-postası için isteğe bağlı onay; Faz 3'ün listesini besliyor. */
  emailOptIn: boolean('email_opt_in').notNull().default(false),
  /**
   * Ücretli üyelik.
   *
   * ⚠️ Bugün **elle** çevriliyor; ödeme altyapısı (Lemon Squeezy webhook'u)
   * trafik gelince aynı bayrağa bağlanacak. Sahibin kararı: sıfır ziyaretçi
   * için vergi ve webhook kurmak yerine önce ekranların görülmesi. Ekranlar
   * iki durumda da aynı kodu okuyor, o gün değişen tek şey bayrağı kimin
   * çevirdiği.
   */
  patron: boolean('patron').notNull().default(false),
});

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  /* Hesap silinince oturumları da gidiyor — yetim oturum kalmıyor. */
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
});

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  /** E-posta/şifre girişinin karması. Better Auth üretiyor; biz hiç okumuyoruz. */
  password: text('password'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

/**
 * Top 4 — üyeliğin bütün işi.
 *
 * ⚠️ **Sıra sütunda, dizinin sırasında değil.** SQL sırasız döner ve
 * "birinci parfümüm" bir iddia: sırayı veriye yazmayan bir tasarım, Top 4'ü
 * sıralamanın anlamını sessizce yok eder. `(userId, position)` benzersiz —
 * aynı yuvada iki parfüm veritabanı düzeyinde imkânsız.
 *
 * `perfumeId` bilerek **yabancı anahtar değil**: parfümler kodda yaşıyor
 * (`src/data/`), veritabanında değil. Doğrulama `lib/top-four.ts`te ve yazan
 * her yol oradan geçiyor.
 */
export const topFour = pgTable(
  'top_four',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    perfumeId: text('perfume_id').notNull(),
    /** 0–3. Yuva numarası; ekrandaki sıra bu. */
    position: integer('position').notNull(),
  },
  (table) => [
    unique('top_four_user_position').on(table.userId, table.position),
    /* Aynı parfüm iki yuvada olamaz — `setSlot` zaten taşıyor, bu son kapı. */
    unique('top_four_user_perfume').on(table.userId, table.perfumeId),
  ],
);

/**
 * Kullanıcının kendi kompozisyonu — Patron'un asıl sebebi.
 *
 * ⚠️ `notes` **jsonb** ve bu bilinçli: nota listesi kompozisyonun *kendisi*,
 * sorgulanacak bir ilişki değil. Ayrı tablo her okumada bir birleştirme ve
 * sıra derdi getirirdi. Top 4'te sıra ayrı sütunda çünkü orada sıra bir
 * **iddia** ("birinci parfümüm"); burada nota sırası kompozisyonun içi.
 *
 * ⚠️ Okurken her zaman `compositionError` ile doğrulanıyor: veriden bir nota
 * çıkarsa ya da eski bir kayıt bozuksa sayfa çökmesin.
 *
 * `(userId, slug)` benzersiz — adres `/u/ad/k/slug`.
 */
export const composition = pgTable(
  'composition',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    slug: text('slug').notNull(),
    name: text('name').notNull(),
    /** `PerfumeNote[]` — `{ noteId, tier, weight }`. */
    notes: jsonb('notes').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [unique('composition_user_slug').on(table.userId, table.slug)],
);

/** Profildeki tek satırın sınırı — sütun `text`, kapı uygulamada. */
export const BIO_MAX = 80;

/** Kompozisyon adının sınırı. */
export const COMPOSITION_NAME_MAX = 40;

/**
 * Patron olmayanın kurabileceği en fazla nota.
 *
 * ⚠️ Sahibin kararı: *"insan denemeden ödemiyor."* Üç nota gerçek bir eğri ve
 * gerçek bir konum veriyor — yani kişi aracın ne yaptığını görüyor, kilitli
 * bir kapıya bakmıyor. Sınır **sunucuda da** uygulanıyor; ekrandaki sayaç
 * kolaylık, kapı değil.
 */
export const FREE_COMPOSITION_NOTES = 3;
