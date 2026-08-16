/**
 * Bağlantı bilgisi çıkarımı — yalnız KAMUYA AÇIK İŞ adresleri.
 *
 * ⚠️ Sahibin kısıtı: kişisel veri toplanmayacak. Kod bunu iyi niyete
 * bırakmıyor, ölçüyor: dükkânın kendi alan adındaki ya da rol tabanlı
 * (info@, sales@) adresler "iş" sayılıyor; kişi adı taşıyan serbest posta
 * kutuları (ahmet.yilmaz@gmail.com) ayrı işaretlenip **seçilmiyor**.
 */
import { naziceGetir, type Cevap } from '../net/fetch.ts';

/** Gezilecek iletişim sayfaları — Shopify, WooCommerce ve Türk kalıpları. */
const ILETISIM_YOLLARI = [
  '/pages/contact', '/pages/contact-us', '/contact', '/contact-us',
  '/iletisim', '/pages/iletisim', '/about', '/pages/about-us',
];

/**
 * Serbest posta sağlayıcıları.
 *
 * ⚠️ Ölçülmüş bir yanlış-pozitifin karşılığı: `argosfragrances.com` için
 * `info@stagheaddesigns.com` seçilmişti — tema geliştiricisinin adresi,
 * dükkânın değil. Rol kutusu olması yetmiyor; BAŞKA bir şirketin alan
 * adındaki `info@` o şirketin masası. Kendi alan adı dışında yalnız
 * serbest posta kutuları kabul ediliyor, çünkü küçük dükkânlar gerçekten
 * gmail kullanıyor.
 */
const SERBEST_POSTA = new Set([
  'gmail.com', 'googlemail.com', 'hotmail.com', 'outlook.com', 'live.com',
  'yahoo.com', 'yandex.com', 'yandex.ru', 'icloud.com', 'proton.me',
  'protonmail.com', 'mail.ru', 'gmx.com', 'web.de', 'aol.com',
]);

/** Rol tabanlı kutular: bir kişiyi değil, bir masayı gösterirler. */
const ROL_KUTULARI = new Set([
  'info', 'contact', 'hello', 'hi', 'sales', 'support', 'orders', 'shop',
  'help', 'team', 'office', 'admin', 'destek', 'iletisim', 'satis', 'bilgi',
]);

/** Adres değil de dosya adı ya da altyapı gürültüsü olanlar. */
const GURULTU = /(\.(png|jpe?g|gif|svg|webp|css|js)$|sentry|wixpress|example\.(com|org)|@2x|\.wpengine|noreply|no-reply|donotreply)/i;

const EPOSTA = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi;
const INSTAGRAM = /instagram\.com\/([A-Za-z0-9._]{2,30})/gi;
/** Kullanıcı adı değil, gezinti yolu olanlar. */
const IG_YOL = new Set(['p', 'reel', 'reels', 'explore', 'accounts', 'stories', 'tv', 'direct', 'about', 'legal']);

export interface BaglantiOlcumu {
  readonly email: string | null;
  readonly instagram: string | null;
  /** Bulunan ama kişisel göründüğü için seçilmeyenler — sayısı rapora giriyor. */
  readonly elenenKisisel: number;
  readonly kanit: readonly { kind: string; url: string; snippet: string; status: number | null }[];
}

function epostaTopla(metin: string): readonly string[] {
  return [...new Set((metin.match(EPOSTA) ?? []).map((e) => e.toLowerCase()))]
    .filter((e) => !GURULTU.test(e));
}

/** Adres iş adresi mi: kendi alan adında ya da rol tabanlı. */
export function isAdresiMi(eposta: string, domain: string): boolean {
  const [kutu, host] = eposta.split('@');
  if (kutu === undefined || host === undefined) return false;
  if (host === domain || host.endsWith(`.${domain}`)) return true;
  return SERBEST_POSTA.has(host) && rolKutusuMu(kutu);
}

function rolKutusuMu(kutu: string): boolean {
  return ROL_KUTULARI.has(kutu.toLowerCase());
}

/**
 * En iyi adresi seçer.
 *
 * Sıra bilerek: kendi alan adındaki rol kutusu (info@dukkan.com) en
 * güvenilir, sonra kendi alan adındaki herhangi bir kutu, sonra serbest
 * postadaki rol kutusu. Kişi adı taşıyanlar hiç seçilmiyor.
 */
export function enIyiEposta(adaylar: readonly string[], domain: string): { secilen: string | null; elenen: number } {
  const kendiAlan = adaylar.filter((e) => {
    const h = e.split('@')[1];
    return h === domain || h?.endsWith(`.${domain}`) === true;
  });
  const rol = (liste: readonly string[]): readonly string[] =>
    liste.filter((e) => rolKutusuMu(e.split('@')[0] ?? ''));
  const serbestRol = adaylar.filter((e) => SERBEST_POSTA.has(e.split('@')[1] ?? '') && rolKutusuMu(e.split('@')[0] ?? ''));

  const secilen = rol(kendiAlan)[0] ?? kendiAlan[0] ?? serbestRol[0] ?? null;
  const elenen = adaylar.filter((e) => !isAdresiMi(e, domain)).length;
  return { secilen, elenen };
}

export function instagramSec(metin: string): string | null {
  const bulunanlar = [...metin.matchAll(INSTAGRAM)]
    .map((m) => (m[1] ?? '').toLowerCase())
    .filter((k) => k !== '' && !IG_YOL.has(k) && !k.endsWith('.'));
  return bulunanlar[0] ?? null;
}

export async function olcBaglanti(
  origin: string,
  domain: string,
  anaSayfa: Cevap,
  izinliMi: (yol: string) => boolean,
): Promise<BaglantiOlcumu> {
  const kanit: { kind: string; url: string; snippet: string; status: number | null }[] = [];
  const havuz: string[] = [...epostaTopla(anaSayfa.body)];
  let instagram = instagramSec(anaSayfa.body);
  if (anaSayfa.ok) {
    kanit.push({ kind: 'ana-sayfa', url: anaSayfa.finalUrl, snippet: baslikCek(anaSayfa.body), status: anaSayfa.status });
  }

  for (const yol of ILETISIM_YOLLARI) {
    /*
      Yeterince bilgi bulunduysa daha fazla istek atılmıyor — hem nezaket
      hem hız. E-posta ve Instagram ikisi de eldeyse aramaya devam etmenin
      getirisi yok.
    */
    if (havuz.length > 0 && instagram !== null) break;
    if (!izinliMi(yol)) continue;
    const c = await naziceGetir(`${origin}${yol}`);
    if (!c.ok) continue;
    const bulunan = epostaTopla(c.body);
    if (bulunan.length > 0) {
      havuz.push(...bulunan);
      kanit.push({ kind: 'iletisim', url: c.finalUrl, snippet: bulunan.slice(0, 4).join(', '), status: c.status });
    }
    instagram ??= instagramSec(c.body);
  }

  const { secilen, elenen } = enIyiEposta([...new Set(havuz)], domain);
  if (secilen !== null) {
    kanit.push({ kind: 'eposta', url: origin, snippet: secilen, status: 200 });
  }
  if (instagram !== null) {
    kanit.push({ kind: 'instagram', url: `https://instagram.com/${instagram}`, snippet: `@${instagram}`, status: null });
  }
  return { email: secilen, instagram, elenenKisisel: elenen, kanit };
}

/** Sayfa başlığı — dükkân adının en ucuz kaynağı. */
export function baslikCek(html: string): string {
  const m = /<title[^>]*>([\s\S]{0,300}?)<\/title>/i.exec(html);
  return (m?.[1] ?? '').replace(/\s+/g, ' ').trim();
}
