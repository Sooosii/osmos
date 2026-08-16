/**
 * `demo-adaylari` — hangi hedefe demo BUGÜN kurulabilir.
 *
 * Satış sırası "anlat, sonra göster" değil: bespoke bir ürün ancak kurulup
 * gösterilerek satılıyor. Bu komut o sıranın ilk adımını ölçüyor — hedefin
 * sattığı markalar bizim kataloğumuzda varsa demo dakikalar içinde kurulur.
 *
 * ⚠️ Ücretsiz: yalnız Shopify `products.json` okunuyor, Apify yok.
 */
import type { DatabaseSync } from 'node:sqlite';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { tumLeadler, upsertLead } from '../db.ts';
import { adayHostlar } from '../domain.ts';
import { jsonAyristir, naziceGetir } from '../net/fetch.ts';
import { temizAd } from '../export/outreach.ts';
import { ortusmeHesapla, type Ortusme } from './markalar.ts';
import type { Lead } from '../types.ts';

/** Kaç ürün okunacak — marka listesi için bu kadarı yetiyor. */
const URUN_SINIRI = 250;

interface ShopifyUrun { readonly vendor?: string }
interface ShopifyListe { readonly products?: readonly ShopifyUrun[] }

export interface AdayOlcumu {
  readonly lead: Lead;
  readonly ortusme: Ortusme | null;
  readonly not: string | null;
}

/** Bir hedefin marka listesini okur. */
export async function hedefMarkalari(lead: Lead): Promise<readonly string[] | null> {
  for (const host of adayHostlar(lead.domain, lead.seed_url)) {
    const c = await naziceGetir(`https://${host}/products.json?limit=${URUN_SINIRI}`);
    const veri = jsonAyristir<ShopifyListe>(c);
    const urunler = veri?.products;
    if (urunler === undefined) continue;
    return urunler.flatMap((u) => (u.vendor === undefined || u.vendor.trim() === '' ? [] : [u.vendor]));
  }
  return null;
}

/**
 * Adayları ölçer ve örtüşmeyi veritabanına yazar.
 *
 * ⚠️ Yalnız Shopify hedefleri geziliyor. WooCommerce'da marka alanı standart
 * değil; onları ölçmeye çalışmak yanlış sıfırlar üretirdi ve puanlama
 * "ölçüldü, yok" ile "ölçülmedi"yi ayırt ediyor.
 */
export async function olcAdaylar(
  db: DatabaseSync,
  bizimkiler: ReadonlySet<string>,
  sinir: number,
  log: (s: string) => void,
): Promise<readonly AdayOlcumu[]> {
  const adaylar = tumLeadler(db)
    .filter((l) => l.platform === 'shopify' && l.durum === 'zenginlestirildi')
    .slice(0, sinir);

  log(`[demo] ${adaylar.length} Shopify hedefinin marka listesi okunacak`);
  const sonuclar: AdayOlcumu[] = [];

  for (const [i, lead] of adaylar.entries()) {
    const markalar = await hedefMarkalari(lead);
    if (markalar === null) {
      sonuclar.push({ lead, ortusme: null, not: 'katalog okunamadi' });
      continue;
    }
    const ortusme = ortusmeHesapla(markalar, bizimkiler);
    upsertLead(db, { ...lead, marka_ortusmesi: ortusme.sayi });
    sonuclar.push({ lead, ortusme, not: null });
    if ((i + 1) % 25 === 0) log(`[demo] ${i + 1}/${adaylar.length}`);
  }
  return sonuclar;
}

export function yazDemoRaporu(sonuclar: readonly AdayOlcumu[], yol: string): number {
  const kurulabilir = sonuclar
    .filter((s): s is AdayOlcumu & { ortusme: Ortusme } => s.ortusme !== null && s.ortusme.sayi > 0)
    .sort((a, b) => b.ortusme.sayi - a.ortusme.sayi);

  const satirlar = kurulabilir.map((s, i) => [
    `### ${i + 1}. ${temizAd(s.lead.shop_name) ?? s.lead.domain}`,
    '',
    `- ${s.lead.domain} · skor ${s.lead.score} · ${s.lead.product_count ?? '?'} ürün`
    + ` · ${s.lead.segment}`,
    `- **ortak marka: ${s.ortusme.sayi}** / hedefin ${s.ortusme.hedefMarkaSayisi} markası`,
    `- demo seçkisi: ${s.ortusme.ortak.slice(0, 12).join(', ')}`,
    `- iletişim: ${s.lead.email ?? '—'}${s.lead.instagram === null ? '' : ` · @${s.lead.instagram}`}`,
    '',
  ].join('\n'));

  const metin = `# Demo adayları

**${kurulabilir.length} hedefe demo bugün kurulabilir** — sattıkları markalar
zaten kataloğumuzda, yani seçkiyi listelemek yetiyor.

⚠️ Demo kuralları: gerçek bir işletmenin adıyla kurulan çalışma **noindex**,
sayfada "resmi olmayan çalışma" etiketi, **talep edilirse aynı gün kaldırılır.**

⚠️ Ortak marka sayısı yüksek olan üstte. Ama seçkinin koku ailelerine yayılması
da gerekiyor: dar bir seçki haritanın tek bir köşesinde toplanır. Gerekçesi
demo-selva katalogunun yorumunda yazılı.

---

${satirlar.join('\n')}`;

  mkdirSync(dirname(yol), { recursive: true });
  writeFileSync(yol, metin, 'utf8');
  return kurulabilir.length;
}
