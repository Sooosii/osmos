import 'server-only';

/**
 * Giden e-posta — yalnızca iki mektup.
 *
 * Site kimseye bülten atmıyor; bu modülün tek işi girişin çalışması için
 * zorunlu olan iki mektup: adres doğrulama ve şifre sıfırlama. İkisi de
 * kullanıcının kendi eylemine cevap; kendiliğinden hiçbir şey gitmiyor.
 *
 * Resend SDK'sı **kullanılmıyor**, REST'e düz `fetch` atılıyor — push
 * deposunda verilen kararın aynısı: iki uç için bir bağımlılık taşımak
 * gereksiz.
 *
 * ⚠️ **Anahtar yokken mektup ekrana yazılıyor** (yalnızca geliştirmede).
 * Sessizce yutulsaydı yerel kayıt akışı "doğrulama bekleniyor" ekranında
 * sonsuza kadar takılırdı ve sebebi görünmezdi. Üretimde anahtar yoksa
 * hata fırlatılıyor: kayıt olan biri mektubu beklerken bizim haberimiz
 * olmaması, sessiz veri kaybının ta kendisi.
 */

/**
 * Gönderen.
 *
 * ⚠️ **Yedek adres (`onboarding@resend.dev`) Resend'in PAYLAŞIMLI deneme
 * adresi ve mektubun spam'e düşmesinin birinci sebebi.** Binlerce hesap aynı
 * adresten atıyor, dolayısıyla itibarı düşük; üstelik gönderen alan adı
 * sitenin alan adıyla hizalı olmadığı için DMARC'ın doğrulayacağı bir şey de
 * yok. Ölçüldü: mektup gidiyor, gelen kutusuna değil spam'e düşüyor.
 *
 * Kod tarafında kapatılabilecek bir açık değil — çözümü **kendi alan adı**:
 * Resend'de doğrulanıp DNS'e SPF/DKIM kayıtları girildiğinde bu değişken
 * `OSMOS <merhaba@kendi-alan-adin>` olur ve mesele biter. Adımlar
 * `docs/posta-teslimat.md`te.
 */
const FROM = process.env.MAIL_FROM?.trim() || 'OSMOS <onboarding@resend.dev>';

/**
 * Cevap adresi — isteğe bağlı.
 *
 * Cevaplanamayan bir adresten gelen mektup hem filtreler hem insanlar için
 * zayıf bir işaret. Tanımlıysa ekleniyor; yokken alan hiç gönderilmiyor
 * (boş bir `reply_to` göndermek, olmayan bir adresi varmış gibi göstermek olurdu).
 */
const REPLY_TO = process.env.MAIL_REPLY_TO?.trim();

/**
 * ⚠️ **Tehlikeli bileşim: davet açık ama gönderen hâlâ deneme adresi.**
 *
 * Bu ikisi bir arada, kayıt olan yabancının kilitlenmesi demek — mektup ya
 * hiç gitmiyor (Resend sahibi olmayan adrese 403 veriyor) ya da spam'e
 * düşüyor; kişi giriş yapamıyor, tekrar kayıt olamıyor. Davetin ayrı bir
 * bayrağa bağlanmasının sebebi buydu (`SignInLink`), ama bayrak açıldığında
 * `MAIL_FROM`u kurmayı unutmak mümkün ve sessiz.
 *
 * Bu yüzden sessiz kalmıyor: üretim günlüğüne bir kez yazıyor. Fırlatmıyor —
 * bugün sahibin kendi adresine posta ÇALIŞIYOR ve onu kırmak, düzeltmeye
 * çalıştığımız şeyden daha kötü olurdu.
 */
if (
  process.env.NODE_ENV === 'production' &&
  process.env.NEXT_PUBLIC_ACCOUNTS_ENABLED &&
  !process.env.MAIL_FROM?.trim()
) {
  console.warn(
    'MAIL_FROM kurulu degil: davet acikken paylasimli deneme adresinden posta gidiyor, ' +
      'yabancilar kilitlenir. docs/posta-teslimat.md',
  );
}

async function send(to: string, subject: string, text: string): Promise<void> {
  const key = process.env.RESEND_API_KEY?.trim();

  if (!key) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('RESEND_API_KEY tanımlı değil — e-posta gönderilemiyor');
    }
    console.info(`\n[posta → ${to}] ${subject}\n${text}\n`);
    return;
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM,
      to,
      subject,
      text,
      ...(REPLY_TO ? { reply_to: REPLY_TO } : {}),
    }),
  });

  if (!response.ok) {
    /* Gövde loglanmıyor: içinde adres ve bağlantı var. */
    throw new Error(`Resend ${response.status}`);
  }
}

/*
  Metinler bilerek İngilizce ve **sözlükten gelmiyor**: mektup ekran değil,
  ve alıcının dilini kayıt anında güvenilir biçimde bilmiyoruz (Google'dan
  gelen kişide hiç sormuyoruz). Tek dil, kısa cümle, tek bağlantı.
*/
export async function sendVerificationEmail(to: string, url: string): Promise<void> {
  await send(
    to,
    'Confirm your email — OSMOS',
    `Someone (hopefully you) created an OSMOS account with this address.\n\nConfirm it here:\n${url}\n\nIf it wasn't you, ignore this message; nothing happens without the link.`,
  );
}

export async function sendResetPasswordEmail(to: string, url: string): Promise<void> {
  await send(
    to,
    'Reset your password — OSMOS',
    `You asked to reset the password on your OSMOS account.\n\nSet a new one here:\n${url}\n\nIf it wasn't you, ignore this message; your current password still works.`,
  );
}
