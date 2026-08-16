/**
 * robots.txt ayrıştırıcı — yalnız `User-agent: *` grubunu okur.
 *
 * Tam bir REP uygulaması değil ve olmaya çalışmıyor: bu boru hattı yalnız
 * birkaç sabit yolu (`/`, `/products.json`, iletişim sayfaları) istiyor.
 * Gerekli olan tek karar "bu yola gidebilir miyim".
 *
 * ⚠️ robots.txt yoksa ya da çekilemezse **serbest** sayılıyor (standardın
 * söylediği bu). Ama 401/403 dönerse **yasak** sayılıyor: dosyayı bizden
 * saklayan bir sunucu izin vermiş sayılmaz.
 */
import { naziceGetir } from './fetch.ts';

export interface RobotsKurallari {
  readonly izinliMi: (yol: string) => boolean;
  readonly kaynak: 'yok' | 'okundu' | 'kapali';
}

const HEPSI_SERBEST: RobotsKurallari = { izinliMi: () => true, kaynak: 'yok' };
const HEPSI_YASAK: RobotsKurallari = { izinliMi: () => false, kaynak: 'kapali' };

/** `/pages/*.json` gibi joker içeren kalıpları düz önek karşılaştırmasına indirir. */
function kalipEsler(yol: string, kalip: string): boolean {
  if (kalip === '') return false;
  const sonaSabit = kalip.endsWith('$');
  const govde = sonaSabit ? kalip.slice(0, -1) : kalip;
  const parcalar = govde.split('*');

  let konum = 0;
  for (let i = 0; i < parcalar.length; i += 1) {
    const p = parcalar[i] as string;
    if (p === '') continue;
    const bulundu = i === 0 ? (yol.startsWith(p) ? 0 : -1) : yol.indexOf(p, konum);
    if (bulundu < 0) return false;
    konum = bulundu + p.length;
  }
  return sonaSabit ? konum === yol.length : true;
}

export function ayristirRobots(metin: string): RobotsKurallari {
  const izin: string[] = [];
  const yasak: string[] = [];
  let yildizGrubunda = false;

  for (const hamSatir of metin.split(/\r?\n/)) {
    const satir = hamSatir.split('#')[0]?.trim() ?? '';
    if (satir === '') continue;
    const ayrac = satir.indexOf(':');
    if (ayrac < 0) continue;
    const anahtar = satir.slice(0, ayrac).trim().toLowerCase();
    const deger = satir.slice(ayrac + 1).trim();

    if (anahtar === 'user-agent') {
      yildizGrubunda = deger === '*';
    } else if (yildizGrubunda && anahtar === 'disallow') {
      if (deger !== '') yasak.push(deger);
    } else if (yildizGrubunda && anahtar === 'allow') {
      if (deger !== '') izin.push(deger);
    }
  }

  return {
    kaynak: 'okundu',
    /*
      En uzun eşleşen kural kazanır — standardın kuralı. Kısa `Disallow: /`
      ile uzun `Allow: /products.json` yan yana duruyorsa ikincisi geçerli.
    */
    izinliMi: (yol: string): boolean => {
      const enUzun = (liste: readonly string[]): number =>
        liste.filter((k) => kalipEsler(yol, k)).reduce((en, k) => Math.max(en, k.length), -1);
      return enUzun(izin) >= enUzun(yasak);
    },
  };
}

export async function robotsGetir(origin: string): Promise<RobotsKurallari> {
  const c = await naziceGetir(`${origin}/robots.txt`);
  if (c.status === 401 || c.status === 403) return HEPSI_YASAK;
  if (!c.ok || c.body.trim() === '') return HEPSI_SERBEST;
  return ayristirRobots(c.body);
}
