/**
 * `ilk-tur.md` — ilk günün işi, iki kanalda da en güçlü adaylar.
 *
 * ⚠️ Neden ayrı bir dosya: `dm-listesi.md` 239 hesap ve `outreach.csv` 497
 * satır. Bir listeye ilk kez bakan kişi 239 satır görünce başlamıyor. Bu
 * dosya tek oturumda bitirilebilecek kadar küçük ve en yüksek cevap
 * olasılığı olanları taşıyor.
 *
 * ⚠️ Sıralama puana göre DEĞİL: önce "öneri bloğu YOK" olanlar geliyor.
 * Sebep satış: o dükkânlara söylenecek somut bir eksik var ve cümle
 * doğrulanabilir. Bloğu zaten olan bir dükkâna aynı mektup gitmiyor —
 * ona söylenecek şey farklı ("var ama genel, bizimki kokuya göre") ve o
 * metin henüz yazılmadı.
 */
import type { DatabaseSync } from 'node:sqlite';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { kanitlar, temasKurulanlar, tumLeadler } from '../db.ts';
import { acilisCumlesi, dilSec, dmTaslagi, kanalSec, mektupGovdesi, sayfaMetni, temizAd } from './outreach.ts';
import type { Dil } from './outreach.ts';
import type { Lead } from '../types.ts';

/** Bir oturumda bitirilebilecek iş — kanal başına. */
export const TUR_BOYU = 15;

export interface IlkTurOzeti {
  readonly dm: number;
  readonly mail: number;
  readonly turkiye: number;
}

/**
 * En güçlü adaylar: önce kanıtlı eksiği olanlar, sonra puana göre.
 *
 * ⚠️ Kanıtsız satırlar hiç girmiyor. İlk turda somut bir ayrıntı
 * söyleyemeyeceğin bir mesaj atmak, en iyi adayları ısıtmadan harcamak olur.
 */
export function enGucluler(
  hepsi: readonly Lead[],
  kanal: 'dm' | 'mail',
  gorulen: ReadonlySet<string>,
  sayi: number,
): readonly Lead[] {
  return hepsi
    .filter((l) => kanalSec(l) === kanal && !gorulen.has(l.domain))
    .sort((a, b) => {
      const hedef = (l: Lead): number => (l.has_similar_feature === false ? 0 : 1);
      return hedef(a) - hedef(b) || b.score - a.score;
    })
    .slice(0, sayi);
}

function dmBlok(lead: Lead, sira: number, metin: string, kanitUrl: string | null): string {
  return [
    `#### ${sira}. ${temizAd(lead.shop_name) ?? lead.domain} · @${lead.instagram ?? ''}`,
    '',
    `- instagram.com/${lead.instagram ?? ''} · ${lead.domain} · skor ${lead.score}`,
    kanitUrl === null ? '- kanıt yok' : `- **önce aç:** ${kanitUrl}`,
    '',
    '```',
    metin,
    '```',
    '',
  ].join('\n');
}

function mailBlok(lead: Lead, sira: number, konu: string, govde: string, kanitUrl: string | null): string {
  return [
    `#### ${sira}. ${temizAd(lead.shop_name) ?? lead.domain}`,
    '',
    `- **kime:** ${lead.email ?? ''} · ${lead.domain} · skor ${lead.score}`
    + `${lead.country === 'TR' ? ' · ⚠️ TURKIYE — once IYS kaydi' : ''}`,
    kanitUrl === null ? '- kanıt yok' : `- **önce aç:** ${kanitUrl}`,
    `- **konu:** ${konu}`,
    '',
    '```',
    govde,
    '```',
    '',
  ].join('\n');
}

const KONU: Record<Dil, string> = {
  tr: 'benzer parfüm önerisi — 2 haftalık ücretsiz pilot',
  de: 'Duftempfehlungen nach Geruch — ein kostenloser Pilot für zwei Wochen',
  en: 'similar-fragrance recommendations — a free two-week pilot',
} as const;

export function yazIlkTur(db: DatabaseSync, yol: string, parfumSayisi: number): IlkTurOzeti {
  const gorulen = temasKurulanlar(db);
  const hepsi = tumLeadler(db);
  const dmler = enGucluler(hepsi, 'dm', gorulen, TUR_BOYU);
  const mailler = enGucluler(hepsi, 'mail', gorulen, TUR_BOYU);

  const dmBloklari = dmler.map((l, i) => {
    const dil = dilSec(l.country, sayfaMetni(l, kanitlar(db, l.id as number)));
    const a = acilisCumlesi(l, kanitlar(db, l.id as number), dil);
    return dmBlok(l, i + 1, dmTaslagi(l, a, dil), a?.kaynakUrl ?? null);
  });
  const mailBloklari = mailler.map((l, i) => {
    const dil = dilSec(l.country, sayfaMetni(l, kanitlar(db, l.id as number)));
    const a = acilisCumlesi(l, kanitlar(db, l.id as number), dil);
    return mailBlok(l, i + 1, KONU[dil], mektupGovdesi(l, a, dil, parfumSayisi), a?.kaynakUrl ?? null);
  });

  const trMail = mailler.filter((l) => l.country === 'TR').length;

  const metin = `# İlk tur — bugünün işi

${dmler.length} DM + ${mailler.length} mail. Tek oturumda biter.

⚠️ **Her mesajdan önce kanıt adresini aç.** Cümlede yazan şey o sayfada
gerçekten yoksa gönderme — ilk cevapta yakalanırsın.

⚠️ Attıktan sonra kaydet, yoksa aynı kişiye ikinci kez yazarsın:
\`node src/cli.ts temas <domain> gonderildi\`

---

## Instagram DM — ${dmler.length} hesap

Bu kanal bugün başlayabilir: kurulum yok, yakılacak alan adı yok.
Botla atma, elle at.

${dmBloklari.join('\n')}
---

## Mail — ${mailler.length} adres

${trMail > 0
    ? `⚠️ Bu listede **${trMail} Türkiye adresi** var. Türkiye'de ticari e-posta\ngöndermeden önce adreslerin **İYS'ye kayıtlı** olması gerekiyor. Kalanlar\niçin böyle bir zorunluluk yok.\n`
    : 'Bu listede Türkiye adresi yok — İYS zorunluluğu doğmuyor.\n'}
⚠️ Toplu gönderimi \`osmos.me\` üstünden yapma; ayrı bir gönderim alan adı
kur ve ısıtmadan başlama. Resend soğuk erişimi yasaklıyor.

${mailBloklari.join('\n')}`;

  mkdirSync(dirname(yol), { recursive: true });
  writeFileSync(yol, metin, 'utf8');
  return { dm: dmler.length, mail: mailler.length, turkiye: trMail };
}
