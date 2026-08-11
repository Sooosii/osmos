# Hesaplar + Top 4 — uygulama planı

> Spec: `docs/superpowers/specs/2026-08-11-hesaplar-ve-top4-design.md`
> Dal: `feat/hesaplar-ve-top4` · **master'a merge ayrı izinle**
> Her görev: önce sınama (kırmızı görülür), sonra uygulama, sonra commit.

**Sıra bilinçli:** hesap gerektirmeyen işler önce. Sahip Neon ve Google OAuth
kurarken saf modüller ve şema bitmiş olacak.

## A — Hesap gerektirmeyen (hemen)

**A1. Kullanıcı adı kuralları** — `src/lib/username.ts` + test
`normalizeUsername` (küçüğe indir, kırp) ve `usernameError(value)`:
3–20 karakter, `a-z0-9_`, rakamla başlamaz, rezerve listede değil
(`signin`, `settings`, `api`, `u`, `admin`, `osmos`, `en`, `tr`, `notes`,
`note`, `perfume`, `space`, `evolution`, `feed`). Hata **anahtar** döner,
cümle değil — metin sözlükte.

**A2. Burun imzası** — `src/lib/nose-signature.ts` + test
`signatureOf(perfumeIds)` → deterministik çizim tarifi (halka sayısı, açı,
yarıçap, aile renkleri). Aynı girdi hep aynı çıktı; sıra değişince desen
değişir; boş girdi → `null`. Renk zinciri mevcut kaynaktan
(`dominantFamily` → `getFamily().color`), ikinci kaynak açılmaz.

**A3. İmzanın çizimi** — `src/components/NoseSignature.tsx`
Saf SVG, sunucu bileşeni. ⚠️ Canvas DEĞİL: paylaşım kartında da kullanılacak
ve `next/og` (Satori) tuval tanımıyor — bu sınır paylaşım katı turunda
ölçülmüştü.

**A4. Top 4 kuralları** — `src/lib/top-four.ts` + test
`validateTopFour(ids)`: en fazla 4, yineleme yok, hepsi gerçek parfüm
(`PERFUMES` ile doğrulanır — uydurma kimlik veriye giremez), sıra korunur.

**A5. Proxy önek desteği** — `src/proxy.ts` + `sinirlar.test.ts`
`ROOT_PREFIXES = ['/api/']`; önek eşleşen adres yeniden yazılmıyor.
⚠️ Eşleyiciye `api` EKLENMEYECEK — gerekçe spec ⑥'da (kapatılmış bir delik).
`/api/push` de bu yoldan geçmeye devam ediyor.

**A6. Sözlük** — `en.ts` + `tr.ts`: `account` bölümü (giriş, kayıt,
kullanıcı adı, cümle, Top 4, ayarlar, silme, hata metinleri). Noktalı büyük
İ yok. `Dict` tipi TR'yi zorluyor.

## B — Veritabanı (şema hesapsız yazılır, bağlanmak hesap ister)

**B1. Bağımlılıklar:** `better-auth`, `drizzle-orm`, `@neondatabase/serverless`,
`drizzle-kit` (dev). `zod` girdi doğrulaması için.

**B2. Şema** — `src/db/schema.ts`
Better Auth'un dört tablosu (`user`, `session`, `account`, `verification`)
+ bizim alanlarımız:
- `user.username` (benzersiz, küçük harf), `user.bio` (≤80), `user.hidden`
  (boolean, varsayılan false), `user.emailOptIn` (boolean)
- `topFour`: `userId`, `perfumeId`, `position` (0–3), `(userId, position)`
  benzersiz — ⚠️ sıra veride, dizinin sırasına güvenilmiyor.
Şema `npx @better-auth/cli generate` çıktısıyla karşılaştırılıp elle
sadeleştirilir; bir sınama dört tablonun varlığını tutar.

**B3. Bağlantı** — `src/db/index.ts`: Neon HTTP sürücüsü + Drizzle.
Env yoksa **üretimde hata**, geliştirmede anlaşılır uyarı.

**B4. Auth kurulumu** — `src/lib/auth.ts`
Better Auth + `drizzleAdapter(db, { provider: 'pg' })`, Google + e-posta/şifre
(`requireEmailVerification: true`, `minPasswordLength: 8`), `rateLimit` açık,
`trustedOrigins` site adresinden, `user.additionalFields` yukarıdaki dördü.
`src/app/api/auth/[...all]/route.ts` → `toNextJsHandler(auth)`.

**B5. Erişim katmanı** — `src/lib/dal.ts`
`currentUser()` = `auth.api.getSession({ headers: await headers() })`,
`React.cache` ile tekilleştirilmiş. **DTO**: dışarı yalnız
`{ id, username, bio, hidden }` çıkar — e-posta ve oturum kimliği asla.
⚠️ Düzende oturum denetimi YOK (gezinmede yeniden çizilmiyor);
⚠️ proxy'de veritabanı denetimi YOK (her rotada çalışıyor).

## C — Ekranlar

**C1. Giriş** — `/[lang]/signin`: Google düğmesi + e-posta/şifre formu.
Sitenin kendi dilinde; hazır üçüncü taraf penceresi yok.

**C2. Kullanıcı adı seçimi** — ilk girişten sonra zorunlu tek adım.
Server Action; A1'in kuralları + benzersizlik.

**C3. Profil** — `/[lang]/u/[username]`
Kullanıcı adı · cümle · imza · Top 4 kartları. Gizliyse `notFound()`.
Kendi profilindeysen "düzenle" bağlantısı.

**C4. Ayarlar** — `/[lang]/settings`: cümle, gizleme anahtarı, e-posta onayı,
çıkış, **hesabı sil** (onaylı, geri dönüşsüz — Top 4 ve oturumlar da gider).

**C5. Top 4 düzenleme** — profil düzenlemede arama (52 parfüm, istemcide
süzme), sürükleme yok; yuva seç + parfüm seç.

**C6. Parfüm sayfasındaki düğme** — `src/components/AddToTopFour.tsx`
⚠️ İstemci bileşeni; oturumu **tarayıcıda** okuyor. Sayfa statik kalıyor —
sunucuda okunsaydı 52×2 sayfa dinamiğe düşerdi.
Girişsizde düğme **hiç çizilmiyor** (bugünkü sayfa aynen).

**C7. Köşede giriş bağlantısı** — `ScreenFrame` meta kümesi + uzay köşesi;
`NotifyControl`ün yanı. Girişliyse kullanıcı adı, değilse sönük "sign in".

**C8. Paylaşım kartı** — `/[lang]/u/[username]/opengraph-image`
İmza + Top 4 renkleri. ⚠️ Satori: flexbox ve CSS'in alt kümesi, tuval yok.

**C9. Gizlilik sayfası** — `/[lang]/privacy`: ne saklanıyor, ne kadar,
nasıl silinir. ⚠️ README'nin "çerez yok" cümlesi **"girişsiz gezinti
çerezsiz"e** düzeltilir — oturum çerezi bu sözü değiştiriyor.

## D — Bitiş

**D1.** Server Action'ların hepsi kendi yetkisini denetliyor mu — tek tek
gözden geçir. "Düğme görünmüyor" koruma değil.
**D2.** Girişsiz gezinti bire bir aynı mı: 394 sayfa statik, çerez yok,
düğme yok. Üretim derlemesinde ölç.
**D3.** Uçtan uca iki dilde: kayıt → giriş → ad → Top 4 → cümle → paylaş →
gizle (404) → sil.
**D4. Güvenlik turu** (spec ⑦'nin listesi) — master'a girmeden.
**D5.** `npm test` + lint + derleme; README + `.env.example` güncel.

## Sahibin kurulum işleri (C'den önce gerekli)

| İş | Nerede | Ne alacağız |
|---|---|---|
| Neon Postgres | Vercel → Marketplace → Neon (ücretsiz) | `DATABASE_URL` kendiliğinden iner |
| Google OAuth | console.cloud.google.com → APIs & Services → Credentials → OAuth client ID (Web) | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` |
| Auth gizli anahtarı | `openssl rand -base64 32` (ya da ben üretirim) | `BETTER_AUTH_SECRET` |
| E-posta gönderimi (doğrulama + şifre sıfırlama) | Resend ücretsiz kademe | `RESEND_API_KEY` |

⚠️ Google OAuth'ta **yönlendirme adresi** tam olarak
`https://<alan-adı>/api/auth/callback/google` olmalı; yerel için
`http://localhost:3000/api/auth/callback/google` de eklenir. Yanlışsa giriş
"redirect_uri_mismatch" ile düşer.

## Doğrulama

Spec'in "Doğrulama" bölümü aynen geçerli.
