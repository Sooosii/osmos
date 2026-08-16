/**
 * Instagram kanalı — iki adımlı.
 *
 * Actor'lar: `scrapesmith/instagram-hashtag-scraper` ($0.00045/gönderi,
 * %99,9 başarı) → `figue/instagram-profile-scraper` ($0.0011/hesap, %97,8).
 *
 * ⚠️ Instagram bir SİTE kaynağı değil, iki ayrı değer taşıyor:
 *   ① Dükkânın kendi adresi biyodaki dış bağlantıda duruyor — Google'ın
 *     hiç göremediği küçük satıcılar buradan çıkıyor.
 *   ② Hafızada yazılı sıra: **Instagram DM → mail → telefon.** Sahip yeni
 *     ve şirketi tanınmıyor; soğuk mailden çok DM'e cevap gelir.
 *
 * ⚠️ İki adım şart ve sırası değişemez: hashtag kazıması yalnız gönderi ve
 * kullanıcı adı veriyor, dış bağlantı **profilde**. Tek adımda bitirmeye
 * çalışmak site adreslerinin tamamını kaybettirir.
 */
import { normalizeDomain } from '../../domain.ts';
import { elemedenGecer } from './eleme.ts';
import type { Aday, HasatSonucu } from './google.ts';

/** Aranacak etiketler — dört pazarın dilinde. */
export const HASHTAGLER: readonly string[] = [
  'perfumedecants', 'decantsforsale', 'perfumesamples', 'fragrancedecants',
  'nicheperfume', 'nichefragrance', 'perfumedecant', 'decantparfum',
  'parfumdekant', 'parfumnumune', 'nisparfum', 'parfumsatis',
  'perfumeshop', 'indieperfume', 'artisanperfume',
];

/** Hashtag actor'ının döndürdüğü gönderi — yalnız kullandığımız alanlar. */
export interface GonderiKaydi {
  readonly ownerUsername?: string;
  readonly username?: string;
  readonly ownerFullName?: string;
}

/** Profil actor'ının döndürdüğü hesap. */
export interface ProfilKaydi {
  readonly username?: string;
  readonly fullName?: string;
  readonly externalUrl?: string;
  readonly externalUrls?: readonly { readonly url?: string }[];
  readonly biography?: string;
  readonly followersCount?: number;
  readonly isBusinessAccount?: boolean;
}

/** Gönderilerden tekil kullanıcı adı listesi — profil adımının girdisi. */
export function gonderilerdenKullanicilar(kayitlar: readonly GonderiKaydi[]): readonly string[] {
  const kume = new Set<string>();
  for (const k of kayitlar) {
    const ad = (k.ownerUsername ?? k.username ?? '').trim().toLowerCase();
    if (ad !== '') kume.add(ad);
  }
  return [...kume].sort();
}

/** Biyografideki çıplak adresi de yakalar — dış bağlantı alanı boş olabiliyor. */
const BIYO_ADRESI = /(?:https?:\/\/)?(?:www\.)?([a-z0-9-]+(?:\.[a-z0-9-]+)+)(?:\/[^\s]*)?/i;

/** Bağlantı toplayıcıları alan adı değil, ara duraktır. */
const ARA_DURAKLAR = new Set(['linktr.ee', 'beacons.ai', 'linkin.bio', 'lnk.bio', 'taplink.cc', 'milkshake.app']);

/** Profilden dükkânın kendi adresini çıkarır. */
export function profilAdresi(p: ProfilKaydi): string | null {
  const adaylar = [p.externalUrl, ...(p.externalUrls ?? []).map((u) => u.url)]
    .filter((u): u is string => typeof u === 'string' && u.trim() !== '');
  for (const ham of adaylar) {
    const d = normalizeDomain(ham);
    if (d !== null && !ARA_DURAKLAR.has(d)) return ham;
  }
  /*
    Dış bağlantı alanı boşsa biyografi metnine bakılıyor. Küçük satıcıların
    çoğu adresi oraya düz yazıyor.
  */
  const m = BIYO_ADRESI.exec(p.biography ?? '');
  const govde = m?.[1];
  if (govde === undefined) return null;
  const d = normalizeDomain(govde);
  return d === null || ARA_DURAKLAR.has(d) ? null : `https://${govde}`;
}

/** Profilleri aday listesine çevirir; Instagram kullanıcı adı da taşınıyor. */
export function profillerdenAdaylar(
  profiller: readonly ProfilKaydi[],
): HasatSonucu & { readonly instagramlar: ReadonlyMap<string, string> } {
  const adaylar = new Map<string, Aday>();
  const instagramlar = new Map<string, string>();
  const sebepler = new Map<string, number>();
  let elenen = 0;
  let tekrar = 0;

  for (const p of profiller) {
    const adres = profilAdresi(p);
    if (adres === null) {
      elenen += 1;
      sebepler.set('biyoda site adresi yok', (sebepler.get('biyoda site adresi yok') ?? 0) + 1);
      continue;
    }
    const domain = normalizeDomain(adres);
    if (domain === null) continue;

    const eleme = elemedenGecer(domain, adres);
    if (!eleme.gecti) {
      elenen += 1;
      const anahtar = (eleme.sebep ?? 'bilinmiyor').split(':')[0] ?? 'bilinmiyor';
      sebepler.set(anahtar, (sebepler.get(anahtar) ?? 0) + 1);
      continue;
    }
    if (adaylar.has(domain)) {
      tekrar += 1;
      continue;
    }
    adaylar.set(domain, {
      domain,
      shopName: (p.fullName ?? p.username ?? '').trim().slice(0, 120),
      seedUrl: adres,
      kaynak: 'instagram',
    });
    const kullanici = (p.username ?? '').trim().toLowerCase();
    if (kullanici !== '') instagramlar.set(domain, kullanici);
  }
  return { adaylar: [...adaylar.values()], elenen, tekrar, sebepler, instagramlar };
}
