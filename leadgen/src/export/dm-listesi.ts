/**
 * `dm-listesi.md` — elle DM atmak için çalışma listesi.
 *
 * ⚠️ Neden CSV değil: bu dosya makineye değil SAHİBİN GÖZÜNE bakıyor.
 * Instagram'da DM atmak elle yapılan bir iş; sahip telefonunda ya da ikinci
 * ekranda bu listeyi açıp yukarıdan aşağı ilerleyecek. Excel hücresinden
 * metin kopyalamak bu iş için kötü bir arayüz.
 *
 * ⚠️ Instagram DM'i otomatikleştirilmiyor: soğuk DM için API yok ve botla
 * atmak hesabı kapattırır. Bu dosya o yüzden bir ARAÇ değil, bir liste.
 *
 * ⚠️ Daha önce temas kurulanlar listeye girmiyor. Aynı kişiye ikinci kez
 * aynı mesajı atmak, hiç atmamaktan kötü.
 */
import type { DatabaseSync } from 'node:sqlite';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { kanitlar, temasKurulanlar, tumLeadler } from '../db.ts';
import { acilisCumlesi, dilSec, dmTaslagi, kanalSec, temizAd } from './outreach.ts';
import type { Lead } from '../types.ts';

/** Bir günde elle atılabilecek makul DM sayısı — üstü hesabı riske atıyor. */
export const GUNLUK_ONERI = 15;

export interface DmListesiOzeti {
  readonly toplam: number;
  readonly atlanan: number;
  readonly gun: number;
}

/**
 * Kanıt bağlantısını NE OLDUĞUYLA birlikte yazar.
 *
 * "Kanıtı aç" demek yetmiyor: sahip neye bakacağını bilmezse açıp kapatır.
 * Ürün sayfasında öneri bloğu aranır, katalog ucunda ürün sayısı.
 */
function kanitSatiri(kanitUrl: string | null): string {
  if (kanitUrl === null) return '- **Kanıt:** yok — cümlede somut ayrıntı da yok';
  if (kanitUrl.includes('products.json') || kanitUrl.includes('wp-json')) {
    return `- **Kanıt — ürün sayısı:** ${kanitUrl}`;
  }
  return `- **Kanıt — ürünün altında öneri bloğu var mı, BAK:** ${kanitUrl}`;
}

function blok(lead: Lead, sira: number, metin: string, kanitUrl: string | null): string {
  const etiket = lead.instagram === null ? '(hesap yok)' : `@${lead.instagram}`;
  return [
    `### ${sira}. ${temizAd(lead.shop_name) ?? lead.domain}`,
    '',
    `- **Instagram:** ${etiket} → https://instagram.com/${lead.instagram ?? ''}`,
    `- **Site:** ${lead.domain} · skor ${lead.score} · ${lead.segment} · ${lead.olcek}`,
    kanitSatiri(kanitUrl),
    '',
    '```',
    metin,
    '```',
    '',
    `Attıktan sonra: \`node src/cli.ts temas ${lead.domain} gonderildi\``,
    '',
  ].join('\n');
}

export function yazDmListesi(db: DatabaseSync, yol: string): DmListesiOzeti {
  const gorulen = temasKurulanlar(db);
  const adaylar = tumLeadler(db).filter((l) => kanalSec(l) === 'dm');
  const kalan = adaylar.filter((l) => !gorulen.has(l.domain));

  const bloklar: string[] = [];
  kalan.forEach((l, i) => {
    const dil = dilSec(l.country);
    const acilis = acilisCumlesi(l, kanitlar(db, l.id as number), dil);
    /*
      Gün ayracı: sahip listeyi tek oturumda bitirmeye çalışmasın. Instagram
      yeni bir hesaptan gelen yoğun DM'i kısıtlıyor.
    */
    if (i > 0 && i % GUNLUK_ONERI === 0) {
      bloklar.push(`---\n\n## ${Math.floor(i / GUNLUK_ONERI) + 1}. gün\n`);
    }
    bloklar.push(blok(l, i + 1, dmTaslagi(l, acilis, dil), acilis?.kaynakUrl ?? null));
  });

  const gun = Math.max(1, Math.ceil(kalan.length / GUNLUK_ONERI));
  const metin = `# DM çalışma listesi

**${kalan.length} hesap** · günde ${GUNLUK_ONERI} tane · yaklaşık **${gun} gün**
${gorulen.size > 0 ? `\n${gorulen.size} hesap daha önce temas kurulduğu için listede yok.\n` : ''}
⚠️ **Her mesajdan önce kanıt adresini aç.** Cümlede yazan şey o sayfada
gerçekten yoksa mesajı gönderme — ilk cevapta yakalanır.

⚠️ Bu liste elle çalışılır. Instagram soğuk DM için API vermiyor; botla
atmak hesabı kapattırır.

---

## 1. gün

${bloklar.join('\n')}`;

  mkdirSync(dirname(yol), { recursive: true });
  writeFileSync(yol, metin, 'utf8');
  return { toplam: kalan.length, atlanan: adaylar.length - kalan.length, gun };
}
