import { dominantFamily, getFamily } from '@/data/families';
import { PERFUMES } from '@/data/perfumes';
import type { Perfume } from '@/data/types';
import { familyVector } from './similarity';

/**
 * Mini parfüm kartı — profildeki Top 4 ve seçicideki liste.
 *
 * Fotoğraf yok (sitenin sözü): kartın kimliği **aile rengi + nota noktaları**.
 * Renk zinciri her yerdekiyle aynı: `familyVector → dominantFamily →
 * getFamily().color`. İkinci bir kaynak açılmıyor — harita, parfüm sayfası,
 * imza ve kart aynı rengi göstermek zorunda.
 *
 * ⚠️ **İstemciye inen tek biçim bu ve bilerek küçük.** Seçici 52 parfümü
 * tarayıcıda süzüyor; `Perfume` nesnelerinin tamamı (nota listeleri, ağırlık
 * tabloları, küratör cümleleri iki dilde) gönderilseydi paket birkaç kat
 * büyürdü ve benzerlik verisi de yanında inerdi. Kart yalnızca çizmek için
 * gerekeni taşıyor.
 *
 * ⚠️ **Dil parametresi YOK ve olmayacak**: parfüm adı ve markası çevrilmiyor
 * (`Perfume.name`/`brand` düz dize, `Localized` değil). Kullanılmayan bir
 * `locale` parametresi taşımak, bir gün birinin onu doldurmaya çalışması
 * demekti.
 */
export interface PerfumeCard {
  readonly id: string;
  readonly name: string;
  readonly brand: string;
  readonly color: string;
  /** Nota ağırlıkları (0–1), ağırdan hafife. Kartta nokta olarak çiziliyor. */
  readonly dots: readonly number[];
  /** Aramada eşleşen metin — küçük harfli, sunucuda bir kez hesaplanmış. */
  readonly search: string;
}

/** Kartta en fazla kaç nokta çizilecek. */
const MAX_DOTS = 8;

function cardOf(perfume: Perfume): PerfumeCard {
  return {
    id: perfume.id,
    name: perfume.name,
    brand: perfume.brand,
    color: getFamily(dominantFamily(familyVector(perfume))).color,
    dots: [...perfume.notes]
      .sort((a, b) => b.weight - a.weight)
      .slice(0, MAX_DOTS)
      .map((note) => note.weight),
    /*
      Arama metni sunucuda kuruluyor: istemci her tuşta 52 kez küçük harfe
      indirmesin. `toLocaleLowerCase` bilerek kullanılmıyor — tarayıcıya göre
      değişen bir eşleşme, arama kutusunda sebebi anlaşılmayan bir
      tutarsızlık olurdu.
    */
    search: `${perfume.name} ${perfume.brand}`.toLowerCase(),
  };
}

/** Verilen kimliklerin kartları — **sıra korunuyor**, bilinmeyen atlanıyor. */
export function cardsFor(ids: readonly string[]): readonly PerfumeCard[] {
  return ids
    .map((id) => PERFUMES.find((perfume) => perfume.id === id))
    .filter((perfume) => perfume !== undefined)
    .map(cardOf);
}

/** Seçicinin listesi — 52 parfüm, marka+ada göre sıralı. */
export function allCards(): readonly PerfumeCard[] {
  return [...PERFUMES]
    .sort((a, b) => `${a.brand} ${a.name}`.localeCompare(`${b.brand} ${b.name}`))
    .map(cardOf);
}
