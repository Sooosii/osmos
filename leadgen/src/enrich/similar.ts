/**
 * "Benzer ürün" bloğu var mı — boru hattının ÜRÜNE en yakın ölçümü.
 *
 * OSMOS tam da bu bloğu satıyor. Bloğu **olmayan** dükkân +20 puan alıyor,
 * yani bu ölçüm listenin sırasını doğrudan belirliyor.
 *
 * ⚠️ Üçlü mantık burada hayati: hiçbir ürün sayfası çekilemediyse cevap
 * `null` ("bakılmadı"), `false` ("bakıldı, yok") DEĞİL. İkisi karıştırılırsa
 * ulaşılamayan her site listenin tepesine çıkar ve sahip en değersiz
 * adaylara mektup yazar.
 *
 * ⚠️ Birden çok sayfaya bakılıyor. Tek sayfa yetmiyor: tema öneri bloğunu
 * çoğu zaman ürün türüne göre gösteriyor, bir aksesuar sayfasında
 * bulunmaması dükkânda bulunmadığı anlamına gelmiyor.
 */
import { naziceGetir, type Cevap } from '../net/fetch.ts';
import type { UclyMantik } from '../types.ts';

/**
 * Öneri bloğunun izleri. Hem sınıf/bölüm adları hem görünür başlıklar,
 * hem Türkçe hem İngilizce.
 */
const IZLER: readonly RegExp[] = [
  /product-recommendations/i,
  /related[-_ ]products/i,
  /complementary-products/i,
  /you\s+may\s+also\s+like/i,
  /you\s+might\s+also\s+like/i,
  /customers\s+also\s+(bought|viewed|liked)/i,
  /complete\s+the\s+look/i,
  /similar\s+(products|items|fragrances|scents)/i,
  /recommended\s+for\s+you/i,
  /benzer\s+(ürünler|urunler|parfümler|parfumler)/i,
  /bunlar\s+da\s+ilginizi/i,
  /birlikte\s+(alınanlar|alinanlar)/i,
];

const URUN_BAGLANTISI = /href="([^"]*\/(?:products|product|urun|p)\/[^"?#]+)/i;
/** Kanıt parçasının çevresinden alınacak karakter sayısı. */
const BAGLAM = 90;

/**
 * Betik ve stil blokları taramadan ÖNCE atılıyor.
 *
 * ⚠️ Bu, ölçülmüş bir yanlış-pozitifin karşılığı. aaronterencehughes.com
 * "öneri bloğu var" çıkmıştı; kanıta bakınca eşleşmenin temanın hangi
 * bölümleri TAŞIDIĞINI sayan bir betik özniteliğinin içinde olduğu
 * görüldü. O dize sayfada bloğun gösterildiğini söylemiyor.
 */
export function betikleriAt(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<link[^>]*>/gi, ' ');
}

export interface BenzerOlcumu {
  readonly hasSimilar: UclyMantik;
  readonly kanit: readonly { kind: string; url: string; snippet: string; status: number | null }[];
}

const BAKILMADI: BenzerOlcumu = { hasSimilar: null, kanit: [] };

/** Ölçülecek ürün sayfası adresleri. */
export function urunAdresleri(origin: string, adaylar: readonly string[], anaSayfa: Cevap): readonly string[] {
  if (adaylar.length > 0) return adaylar.map((h) => `${origin}/products/${h}`);
  const yol = URUN_BAGLANTISI.exec(anaSayfa.body)?.[1];
  if (yol === undefined) return [];
  return [yol.startsWith('http') ? yol : `${origin}${yol.startsWith('/') ? '' : '/'}${yol}`];
}

/** Eşleşen izi çevresiyle birlikte döndürür — sahip gözle doğrulayabilsin. */
export function izAra(html: string): { iz: RegExp; parca: string } | null {
  for (const iz of IZLER) {
    const m = iz.exec(html);
    if (m?.index === undefined) continue;
    const bas = Math.max(0, m.index - BAGLAM);
    return { iz, parca: html.slice(bas, m.index + m[0].length + BAGLAM).replace(/\s+/g, ' ').trim() };
  }
  return null;
}

/**
 * ⚠️ BİLİNEN SINIR — mektup yazmadan önce okunmalı.
 *
 * Bu ölçüm sunucudan gelen HTML'e bakıyor; tarayıcının çizdiği sayfaya
 * değil. Öneri bloğunu JavaScript ile sonradan basan bir tema ya da
 * uygulama varsa burada "yok" görünür.
 *
 * Ölçülmüş örnek: marcantoinebarrois.com sayfasında "You may also like"
 * dizesi dört kez geçiyor — dördü de bir sepet/ödeme upsell uygulamasının
 * JSON ayarının içinde (widget_message, checkout, thank_you bağlamları).
 * Yani dükkânın ÜRÜN sayfasında öneri bloğu yok ama satın alma akışında
 * bir upsell uygulaması var. Ham HTML'de düz arama yapmak bunu "öneri var"
 * diye okur ve yanılır; betikleri atmak doğru cevabı verir.
 *
 * Sonuç: `false` değeri "sunucudan gelen üründe sayfasında iz yok" demek,
 * "ziyaretçi hiçbir öneri görmüyor" demek DEĞİL. Bu yüzden `outreach.csv`
 * her satırda `kanit_url` taşıyor: mektup gitmeden önce o adres gerçek
 * tarayıcıda açılıp gözle doğrulanacak. Deponun kendi dersi burada da
 * geçerli — gerçek tarayıcı, gözle bakmanın yerini tutmaz ama düz aramanın
 * yerini tutar.
 */
export async function olcBenzerUrun(
  origin: string,
  adaylar: readonly string[],
  anaSayfa: Cevap,
  izinliMi: (yol: string) => boolean,
): Promise<BenzerOlcumu> {
  const bakilanlar: { url: string; status: number | null }[] = [];

  for (const adres of urunAdresleri(origin, adaylar, anaSayfa)) {
    let yol: string;
    try {
      yol = new URL(adres).pathname;
    } catch {
      continue;
    }
    if (!izinliMi(yol)) continue;

    const c = await naziceGetir(adres);
    if (!c.ok || c.body.length < 500) continue;

    const bulgu = izAra(betikleriAt(c.body));
    bakilanlar.push({ url: c.finalUrl, status: c.status });
    if (bulgu !== null) {
      /* Tek sayfada bulunması yeter: dükkânda öneri bloğu VAR. */
      return {
        hasSimilar: true,
        kanit: [{ kind: 'benzer-urun', url: c.finalUrl, snippet: `iz ${String(bulgu.iz)} → …${bulgu.parca}…`, status: c.status }],
      };
    }
  }

  if (bakilanlar.length === 0) return BAKILMADI;

  /*
    Yokluk da bir ölçümdür ve kanıtı saklanıyor: hangi sayfalara bakıldığı
    yazılı olmazsa "bu dükkânda öneri yok" iddiası doğrulanamaz. En üstteki
    kanıt açılış cümlesine giriyor, o yüzden parfüm olma olasılığı en yüksek
    sayfa (listenin ilki) başta duruyor.
  */
  return {
    hasSimilar: false,
    kanit: bakilanlar.map((b) => ({
      kind: 'benzer-urun',
      url: b.url,
      snippet: `${bakilanlar.length} urun sayfasi tarandi, oneri blogu izine rastlanmadi`,
      status: b.status,
    })),
  };
}
