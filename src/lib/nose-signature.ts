import { dominantFamily, getFamily } from '@/data/families';
import type { Perfume } from '@/data/types';
import { familyVector } from './similarity';

/**
 * Burun imzası — profilde fotoğrafın yerine geçen şey.
 *
 * Sahip profil fotoğrafını reddetti (sitenin "hiçbir yerde fotoğraf yok" sözü
 * README'de, duyuru metinlerinde ve Show HN kancasında yazılı). Yerine geçen
 * şey uydurma bir süs değil: kişinin **Top 4'ünden türetilen** bir desen.
 * Dört parfüm, dört yay; yayın rengi baskın ailesi, üstündeki noktalar
 * notalarının ağırlıkları.
 *
 * Üç şart:
 *
 *   · **Deterministik** — aynı dört parfüm hep aynı deseni verir. Rastgelelik
 *     olsaydı paylaşılan kart ile profil ayrışırdı.
 *   · **Sıraya duyarlı** — "birinci parfümüm" bir iddia; sıra değişince desen
 *     de değişmeli, yoksa Top 4'ü sıralamanın anlamı kalmaz.
 *   · **Saf** — React, DOM, canvas tanımıyor. Çizimi `NoseSignature.tsx`
 *     yapıyor ve **SVG** basıyor: aynı tarif paylaşım kartında da kullanılacak
 *     ve `next/og` (Satori) tuval tanımıyor. O sınır paylaşım katı turunda
 *     ölçülmüştü; ikinci kez öğrenilmeyecek.
 *
 * Renk zinciri sitenin geri kalanıyla aynı: `familyVector → dominantFamily →
 * getFamily().color`. İkinci bir kaynak açılmıyor — harita, parfüm sayfası ve
 * imza aynı rengi göstermek zorunda.
 */

/** Çizim kutusunun kenarı. Görüntü birimi; SVG `viewBox` bunu kullanıyor. */
export const SIGNATURE_SIZE = 100;

/** En fazla dört yuva — "Top 4". */
const MAX_SLOTS = 4;

/** İç ve dış yayın yarıçapları; aradakiler eşit aralıkla yerleşiyor. */
const RADIUS_INNER = 20;
const RADIUS_OUTER = 46;

/** Bir yaydaki en az/en çok nokta. Nota sayısı bu banda sıkıştırılıyor. */
const DOTS_MIN = 5;
const DOTS_MAX = 14;

export interface SignatureDot {
  readonly x: number;
  readonly y: number;
  /** Nokta yarıçapı — notanın kompozisyondaki ağırlığından. */
  readonly r: number;
}

export interface SignatureArc {
  readonly perfumeId: string;
  readonly color: string;
  readonly radius: number;
  readonly dots: readonly SignatureDot[];
}

export interface Signature {
  readonly arcs: readonly SignatureArc[];
}

/**
 * Kimlikten türetilen sabit bir sayı (0–1).
 *
 * Rastgelelik değil: aynı parfüm her profilde aynı açıdan başlıyor, ama iki
 * farklı parfüm aynı yerden başlamıyor. Desenin "bu kişiye ait" görünmesini
 * sağlayan şey bu — dizilim seçilen parfümlerin kendisinden geliyor.
 */
function seedOf(id: string): number {
  let hash = 2166136261;
  for (let i = 0; i < id.length; i += 1) {
    hash ^= id.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return ((hash >>> 0) % 10000) / 10000;
}

function clamp(value: number, low: number, high: number): number {
  return Math.min(Math.max(value, low), high);
}

/**
 * ⚠️ **Kimlik DEĞİL parfüm alıyor — ve bu güvenlik gereği.**
 *
 * Eskiden imza kimlik listesi alıp katalogda kendisi arıyordu (`PERFUMES.find`).
 * Sonucu şuydu: imzayı çizen üç istemci bileşeni — `PatronBackdrop`,
 * `SignatureClip`, `NoseSignature` — bu modül üzerinden **bütün katalogu**
 * tarayıcıya çekiyordu. Ölçüldü (2026-08-17): kiracı derlemesinde OSMOS'un
 * 154 kaydı, küratör cümleleriyle birlikte, müşterinin alan adından herkese
 * açık iniyordu.
 *
 * Çözüm sunucuya taşındı (`perfumesOf`, `data/perfumes.ts`): istemciye artık
 * yalnızca kişinin dört parfümü iniyor. **Buraya kimlik alan bir sürüm geri
 * konursa sızıntı da geri gelir**; `kiraci-sizinti.test.ts` bunu tutuyor.
 *
 * Bilinmeyen kimliğin sessizce atlanması kuralı `perfumesOf`a taşındı: hepsi
 * bilinmiyorsa liste boş gelir ve imza yine `null` olur.
 */
export function signatureOf(perfumes: readonly Perfume[]): Signature | null {
  const chosen = perfumes.slice(0, MAX_SLOTS);

  if (chosen.length === 0) return null;

  const center = SIGNATURE_SIZE / 2;
  /* Tek parfümde bölme sıfıra düşmesin diye: tek yay dış halkaya oturuyor. */
  const step =
    chosen.length > 1 ? (RADIUS_OUTER - RADIUS_INNER) / (chosen.length - 1) : 0;

  const arcs = chosen.map((perfume, slot) => {
    /*
      Yarıçap SIRAYA bağlı: birinci parfüm en dışta, sonrakiler içeri doğru.
      Sıra değişince desen de değişiyor — Top 4'ü sıralamanın karşılığı bu.
    */
    const radius = chosen.length > 1 ? RADIUS_OUTER - slot * step : RADIUS_OUTER;
    const color = getFamily(dominantFamily(familyVector(perfume))).color;

    const count = clamp(perfume.notes.length, DOTS_MIN, DOTS_MAX);
    const start = seedOf(perfume.id) * Math.PI * 2;

    const dots = Array.from({ length: count }, (_, index) => {
      const angle = start + (index / count) * Math.PI * 2;
      /*
        Nokta çapı notanın ağırlığından; nota bittiyse en hafifi tekrar
        ediyor. Ağırlıklar 0–1, çap 1.1–2.6 bandına eşleniyor.
      */
      const weight = perfume.notes[index % perfume.notes.length]?.weight ?? 0.5;
      return {
        x: center + Math.cos(angle) * radius,
        y: center + Math.sin(angle) * radius,
        r: 1.1 + weight * 1.5,
      };
    });

    return { perfumeId: perfume.id, color, radius, dots };
  });

  return { arcs };
}
