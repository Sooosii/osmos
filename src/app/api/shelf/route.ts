import { currentViewer, shelfOf } from '@/lib/dal';

/**
 * Okuyucunun **kendi** rafı.
 *
 * ⚠️ **Neden Server Action değil de uç?** `compose/nearest`in birinci
 * gerekçesi burada da geçerli: depodaki kural "her Server Action ilk işi
 * oturumu doğrular" ve bir sınama onu tutuyor. Okuma amaçlı bir action o
 * kuralı deler. Ayrıca action'lar POST; bu bir GET ve iki ayrı yerden
 * çağrılıyor.
 *
 * ⚠️ **Tek uç, iki tüketici**: künyedeki raf düğmeleri (`ShelfPicker`) ve
 * uzaydaki halkalar (`use-shelf-rings`). İkisi de "bu kişinin rafında ne var"
 * sorusunu soruyor; iki ayrı uç açmak aynı sorguyu iki yerde tutmak olurdu.
 *
 * ⚠️ **Girişsizde 401 DEĞİL, boş liste.** Uç uzayın açılışında da çağrılıyor
 * ve siteye giren insanların çoğu girişsiz; onlar için bu bir hata durumu
 * değil, normal cevap. 401 dönseydi tarayıcı konsolu her ziyarette kırmızı
 * yanardı ve gerçek bir arıza o gürültünün içinde kaybolurdu.
 *
 * ⚠️ `private, no-store` **pazarlık dışı**: bu kişiye özel veri. Paylaşımlı
 * bir önbellek (CDN, ara vekil) cevabı tutsaydı birinin rafını başkasına
 * servis ederdi — sessiz ve gerçek bir sızıntı.
 *
 * Kök varlık: `proxy.ts`teki `ROOT_PREFIXES` (`/api/`) bunu kapsıyor.
 */
export async function GET(): Promise<Response> {
  const viewer = await currentViewer();
  const entries = viewer ? await shelfOf(viewer.id) : [];

  return Response.json({ entries }, { headers: { 'Cache-Control': 'private, no-store' } });
}
