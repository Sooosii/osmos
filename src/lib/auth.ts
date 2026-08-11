import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { getDb, schema } from '@/db';
import { sendVerificationEmail, sendResetPasswordEmail } from './mail';
import { siteUrl } from './site-url';

/**
 * Giriş sistemi — sitenin ilk kimlik katmanı.
 *
 * Better Auth seçildi: Next'in kendi kimlik doğrulama kılavuzunda listeli,
 * kendi sunucumuzda çalışıyor ve üçüncü tarafa hiçbir şey göndermiyor.
 * Barındırılan bir kimlik servisi (Clerk, Auth0) sitenin "dışarıya istek
 * atmaz" ilkesini çalışma anında bozardı.
 *
 * ⚠️ **Bu modül yalnızca sunucuda.** İçeri alan her dosya sunucu tarafında
 * kalmak zorunda; istemci bileşenleri `better-auth/react` istemcisini
 * kullanıyor.
 *
 * ⚠️ Bağlantı **çağrı anında** çözülüyor (`getDb()`), modül yüklenirken
 * değil: 394 statik sayfa bu dosyayı dolaylı olarak içeri alabilir ve
 * hiçbiri veritabanına dokunmamalı.
 */

/** Profildeki tek satırın sınırı — şemayla aynı sayı. */
export const BIO_MAX = 80;

/**
 * ⚠️ **Tembel tekil — `export const auth = betterAuth(...)` YAZILMAYACAK.**
 *
 * İlk yazışı öyleydi ve sessiz bir tuzaktı: `drizzleAdapter(getDb(), …)`
 * modül yüklenir yüklenmez `getDb()`yi çağırıyor, yani bu dosyayı dolaylı
 * olarak içeri alan HER ŞEY `DATABASE_URL` istemeye başlıyordu — derleme
 * makinesi, 394 statik sayfanın üretimi ve sınamalar dahil. Hiçbiri
 * veritabanına dokunmuyor ve dokunmamalı.
 *
 * Şimdi bağlantı ilk gerçek çağrıda kuruluyor ve bir kez saklanıyor.
 */
let cached: ReturnType<typeof buildAuth> | null = null;

export function getAuth(): ReturnType<typeof buildAuth> {
  /*
    Yerel değişkene alınıyor: modül düzeyindeki `let`i doğrudan döndürmek
    "null olabilir" diye tip hatası veriyor — derleyici bir `let`in araya
    girip değişmediğini garanti edemiyor.
  */
  const instance = cached ?? buildAuth(getDb());
  cached = instance;
  return instance;
}

/**
 * Veritabanı **dışarıdan** veriliyor ve tek sebebi sınanabilirlik.
 *
 * Üretimde `getAuth()` Neon'u geçiyor; sınamalar aynı kurulumu PGlite'a
 * (Postgres'in WASM sürümü) bağlayıp kayıt ve giriş akışını **gerçek SQL
 * üzerinde** koşturuyor. Taklit bir veritabanıyla sınanan kimlik kodu,
 * sınanmamış kimlik kodudur: hatalar tam da şemayla kütüphanenin
 * anlaşamadığı yerde çıkıyor.
 */
export function buildAuth(db: Parameters<typeof drizzleAdapter>[0]) {
  return betterAuth({
    /*
      Çerezi imzalayan anahtar. Değişirse bütün oturumlar düşer — kullanıcılar
      çıkış yapmış olur. Bu yüzden bir kez üretilip sabit kalıyor.
    */
    secret: process.env.BETTER_AUTH_SECRET,
    baseURL: siteUrl(),

    database: drizzleAdapter(db, {
      provider: 'pg',
      schema: {
        user: schema.user,
        session: schema.session,
        account: schema.account,
        verification: schema.verification,
      },
    }),

    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
      /*
        ⚠️ Doğrulama ZORUNLU. Kapalıyken herkes başkasının e-postasıyla hesap
        açabilir ve o adresin sahibi durumu ancak profilini birinin aldığını
        görünce anlar. Açıkken doğrulanmamış hesap giriş yapamıyor.
      */
      requireEmailVerification: true,
      sendResetPassword: async ({ user, url }) => {
        await sendResetPasswordEmail(user.email, url);
      },
    },

    emailVerification: {
      sendOnSignUp: true,
      autoSignInAfterVerification: true,
      sendVerificationEmail: async ({ user, url }) => {
        await sendVerificationEmail(user.email, url);
      },
    },

    socialProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID ?? '',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
        /*
          ⚠️ Google'ın gönderdiği profil fotoğrafı BİLEREK alınmıyor. Sahip
          profil fotoğrafını reddetti ("sitede hiç fotoğraf yok" sözü README'de
          ve duyuru metinlerinde yazılı); kimlik işareti Top 4'ten türetilen
          imza. Eşleme açılırsa fotoğraf sessizce veriye girer.
        */
        mapProfileToUser: (profile) => ({
          name: profile.name,
          email: profile.email,
        }),
      },
    },

    user: {
      /*
        ⚠️ Bu dört alan `db/schema.ts` ile birebir aynı olmak zorunda. Ayrışırsa
        Better Auth alanı görmez, kayıt sessizce yarım kalır ve hata da vermez.
        Bir sınama ikisini birlikte tutuyor.
      */
      additionalFields: {
        /*
          ⚠️ Üçü `input: false`: kayıt isteğinden ASLA doldurulamazlar. Açık
          olsaydı biri kayıt olurken kendine hazır bir kullanıcı adı yazmayı
          deneyebilirdi; ad seçimi kendi denetiminden geçmek zorunda.
        */
        username: { type: 'string', required: false, input: false },
        bio: { type: 'string', required: false, input: false },
        hidden: { type: 'boolean', required: false, defaultValue: false, input: false },
        /*
          ⚠️ Bu ise `input: true` ve gerekçesi ayrı: onay kutusu KAYIT
          ekranında duruyor ve orada henüz oturum yok — kaydedilebilmesinin
          tek yolu kayıt isteğiyle birlikte gelmesi. Kötüye kullanımı yok,
          kişi yalnızca kendi tercihini yazıyor. Kutu bir süre ekranda durup
          hiçbir şey yapmıyordu: yarım bir söz vermektense ya çalışmalı ya
          kalkmalıydı.
        */
        emailOptIn: { type: 'boolean', required: false, defaultValue: false, input: true },
        /*
          ⚠️ `input: false` — ücretli üyelik istemciden ASLA açılamaz. Bugün
          elle, yarın Lemon Squeezy webhook'uyla çevriliyor.
        */
        patron: { type: 'boolean', required: false, defaultValue: false, input: false },
      },
      deleteUser: {
        /* Hesap silme kullanıcının kendi hakkı; şema cascade ile Top 4'ü de siliyor. */
        enabled: true,
      },
    },

    /*
      ⚠️ Hız sınırı AÇIK. Giriş uçları herkese açık ve şifre denemesi ucuz;
      sınırsız bırakmak kaba kuvvet denemesine davetiye. Better Auth kendi
      sayaçlarını tutuyor.
    */
    rateLimit: {
      enabled: true,
      window: 60,
      max: 30,
    },

    /*
      ⚠️ Yalnızca kendi adresimizden gelen istekler. Liste boş bırakılırsa
      CSRF koruması gevşer. Yerel geliştirme adresi de burada, çünkü Google
      yönlendirmesi orada da sınanıyor.
    */
    trustedOrigins: [siteUrl(), 'http://localhost:3000'],
  });
}

/** Kurulum eksikse uçlar 503 dönebilsin diye. */
export function authReady(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim() && process.env.BETTER_AUTH_SECRET?.trim());
}
