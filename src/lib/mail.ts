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

const FROM = process.env.MAIL_FROM?.trim() || 'OSMOS <onboarding@resend.dev>';

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
    body: JSON.stringify({ from: FROM, to, subject, text }),
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
