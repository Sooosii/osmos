/**
 * Partideki sayı iddialarını dükkânın kendi kataloğuna karşı doğrular.
 *
 * ⚠️ **Elde tutulan bir betikten doğdu ve o betik körleşti (2026-08-19).**
 * Akışın pazarlık dışı kuralı şu: *"her mesajdan önce kanıt adresini AÇ; sayı
 * tutmuyorsa gönderme."* Üç parti boyunca bu denetim geçici bir betikle
 * yapıldı ve her seferinde kayan sayı buldu (2. partide 1/10, 3. partide
 * 3/10). Dördüncüde betik dört hedefte `NaN` bastı: metinler Almanca çıkmıştı
 * ve betiğin kalıbı yalnız Ingilizce biliyordu.
 *
 * ⚠️⚠️ **Bu yüzden burada METIN AYRIŞTIRILMIYOR.** Iddiayı üreten şey
 * `leads.product_count`; cümle ondan türüyor. Dolayısıyla doğru soru
 * "cümledeki sayı doğru mu" değil, **"kayıttaki sayı hâlâ gerçek mi"** —
 * ve o soru dilden bağımsız. Üretilen düzyazıyı geri ayrıştırmak, her yeni
 * dilde sessizce körleşen bir denetim demekti.
 */
import { naziceGetir, jsonAyristir } from '../net/fetch.ts';
import { URUN_TAVANI } from '../enrich/platform.ts';

/* Ölçüm boru hattıyla AYNI sayfa boyu — başka türlüsü iki farklı sayı üretir. */
const SAYFA_BOYU = 250;

/*
  ⚠️ Tavanın iki katına kadar bakılıyor. Sebep: `product_count` tavanda
  (`1000`) duran bir kayıtta iddia *"1000'den fazla"* oluyor ve bunu
  doğrulamak için gerçek sayının 1000'i AŞTIĞINI görmek yeterli — tam sayıyı
  bilmeye gerek yok. Sekiz sayfa o kanıtı veriyor ve dükkânı yormuyor.
*/
const EN_FAZLA_SAYFA = 8;

export type Durum = 'tutuyor' | 'kaymis' | 'olculemedi';

export interface DogrulamaSatiri {
  readonly domain: string;
  readonly kayittaki: number;
  readonly tavanda: boolean;
  readonly bugun: number | null;
  readonly durum: Durum;
  readonly aciklama: string;
}

/**
 * Bir kaydın sayı iddiası hâlâ doğru mu.
 *
 * ⚠️ Tavandaki kayıtta eşitlik YETMIYOR, aşması gerekiyor: cümle *"1000'den
 * fazla"* diyor ve tam 1000 ürünlü bir katalogda o cümle yanlış olur.
 */
export function karsilastir(
  kayittaki: number,
  tavanda: boolean,
  bugun: number | null,
): { durum: Durum; aciklama: string } {
  if (bugun === null) {
    return { durum: 'olculemedi', aciklama: 'katalog okunamadi — elle bak, gonderme' };
  }
  if (tavanda) {
    return bugun > kayittaki
      ? { durum: 'tutuyor', aciklama: `${kayittaki}'den fazla — bugun ${bugun}` }
      : { durum: 'kaymis', aciklama: `"${kayittaki}'den fazla" YANLIS — bugun ${bugun}` };
  }
  return bugun === kayittaki
    ? { durum: 'tutuyor', aciklama: `${bugun} birebir tutuyor` }
    : { durum: 'kaymis', aciklama: `kayitta ${kayittaki}, bugun ${bugun}` };
}

/** Kayıt tavana dayanmış mı — sayı eşiği TEK BAŞINA yetmiyor, not da okunuyor. */
export function tavandaMi(productCount: number, notes: string | null): boolean {
  return productCount >= URUN_TAVANI || (notes ?? '').includes('(tavan)');
}

/** Dükkânın kataloğunu şimdi say. `null` = okunamadı. */
export async function katalogSay(domain: string): Promise<number | null> {
  let toplam = 0;
  for (let sayfa = 1; sayfa <= EN_FAZLA_SAYFA; sayfa += 1) {
    const c = await naziceGetir(`https://${domain}/products.json?limit=${SAYFA_BOYU}&page=${sayfa}`);
    const veri = jsonAyristir<{ products?: unknown[] }>(c);
    const urunler = veri?.products;
    if (urunler === undefined) return sayfa === 1 ? null : toplam;
    toplam += urunler.length;
    if (urunler.length < SAYFA_BOYU) return toplam;
  }
  return toplam;
}

/**
 * Parti dosyasındaki alan adları.
 *
 * ⚠️ Hedefler VERITABANINDAN değil DOSYADAN okunuyor ve bu bilinçli: gönderimi
 * yapan kişi elindeki dosyaya bakıyor. Dosya ile veritabanı ayrışmışsa
 * doğrulanması gereken şey dosyadır.
 */
export function partiAlanAdlari(metin: string): readonly string[] {
  const cikti: string[] = [];
  for (const satir of metin.split('\n')) {
    const e = /^- \*\*Alan adı:\*\* ([^\s·]+)/.exec(satir);
    if (e !== null) cikti.push(e[1]);
  }
  return cikti;
}
