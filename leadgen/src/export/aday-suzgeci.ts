/**
 * Parti kurulurken adayları eleyen iki kural.
 *
 * ⚠️ Ikisi de **gerçek bir partide yakalandı (2026-08-19)**, tahminle
 * yazılmadı. Dördüncü parti kurulduğunda 1. sırada `visionaryfragranceseu.com`
 * duruyordu ve hesabı `@visionaryfragrancesgb` — yani ilk partide zaten
 * yazılmış olan `visionaryfragrances.com` ile **aynı gelen kutusu.**
 * 3. sırada ise `@shopify` vardı: Shopify'ın kendi hesabı, dükkânın sayfasından
 * yanlışlıkla kazınmış.
 */

/**
 * Bir dükkânın Instagram hesabı zaten yazılmış bir hesapla aynı mı.
 *
 * ⚠️⚠️ **Defter ALAN ADINA bakıyor, gelen kutusuna değil — ve bir işletmenin
 * iki alan adı olabiliyor.** `visionaryfragrances.com` ile
 * `visionaryfragranceseu.com` ayrı kayıtlar ama tek hesap. Defterin tek işi
 * tekrarı önlemek; hesap üzerinden bakmayan bir tekrar koruması, tam da
 * korumak istediği şeyi kaçırıyor. Akışın kendi cümlesi: *"aynı kişiye ikinci
 * kez aynı mesajı atmak, hiç atmamaktan kötü."*
 *
 * @param yazilanHesaplar temas kurulmuş kayıtların hesapları (küçük harf)
 */
export function hesabaZatenYazildi(
  instagram: string | null,
  yazilanHesaplar: ReadonlySet<string>,
): boolean {
  if (instagram === null || instagram.trim() === '') return false;
  return yazilanHesaplar.has(instagram.trim().toLowerCase().replace(/^@/, ''));
}

/**
 * Dükkâna değil PLATFORMA ait hesaplar.
 *
 * ⚠️ Kazıyıcı sayfadaki her Instagram bağlantısını topluyor ve bazı temalar
 * altbilgide "Powered by Shopify" rozetini bağlıyor. Sonuç: iki dükkânın
 * hesabı `@shopify` çıktı. O kutuya gidecek mesaj hem boşa gider hem de
 * gönderen hesabın soğuk DM sicilini bozar.
 *
 * ⚠️ Liste DAR tutuluyor: yalnız hesabın TAMAMI bu adlardan biriyse eleniyor.
 * Içinde geçmesine bakılsaydı `@shopifyqueen` gibi gerçek bir dükkân da
 * elenirdi.
 */
const PLATFORM_HESAPLARI: ReadonlySet<string> = new Set([
  'shopify', 'instagram', 'facebook', 'meta', 'tiktok', 'youtube', 'twitter',
  'x', 'linktree', 'linktr', 'google', 'wordpress', 'woocommerce', 'wix',
  'etsy', 'amazon', 'whatsapp', 'telegram', 'pinterest',
]);

export function platformHesabi(instagram: string | null): boolean {
  if (instagram === null) return false;
  return PLATFORM_HESAPLARI.has(instagram.trim().toLowerCase().replace(/^@/, ''));
}

/**
 * Aynı hesabı taşıyan adaylardan yalnız BIRINCISINI bırakır.
 *
 * ⚠️ **`hesabaZatenYazildi` bunu yakalamıyor: o yalnız DAHA ÖNCE yazılmış
 * hesaplara bakıyor, aynı partinin içindeki tekrara değil.** Beşinci parti
 * kurulduğunda 9. ve 10. sıralarda `parfumexquis.com` ile `parfumexquis.us`
 * yan yana duruyordu — iki alan adı, tek hesap (`@parfum.exquis`), yani tek
 * oturumda aynı kutuya iki mesaj.
 *
 * ⚠️ Giriş sıralı geldiği için "birincisi" en iyisi demek: liste örtüşmeye göre
 * dizili, yani aynı işletmenin iki kaydından örtüşmesi yüksek olanı kalıyor.
 *
 * ⚠️ Hesabı olmayan kayıt elenmiyor — `null` bir kimlik değil, bilgi
 * eksikliği; hepsini tek bir "null" hesabında toplamak onları birbirinin
 * kopyası sayardı.
 */
export function hesabaGoreTekille<T extends { readonly instagram: string | null }>(
  adaylar: readonly T[],
): readonly T[] {
  const gorulen = new Set<string>();
  const cikti: T[] = [];
  for (const a of adaylar) {
    if (a.instagram === null || a.instagram.trim() === '') { cikti.push(a); continue; }
    const anahtar = a.instagram.trim().toLowerCase().replace(/^@/, '');
    if (gorulen.has(anahtar)) continue;
    gorulen.add(anahtar);
    cikti.push(a);
  }
  return cikti;
}

/** Temas kurulmuş kayıtların hesapları — karşılaştırma için küçük harfe iniyor. */
export function yazilanHesaplariTopla(
  kayitlar: readonly { readonly domain: string; readonly instagram: string | null }[],
  yazilanAlanAdlari: ReadonlySet<string>,
): ReadonlySet<string> {
  const cikti = new Set<string>();
  for (const k of kayitlar) {
    if (!yazilanAlanAdlari.has(k.domain)) continue;
    if (k.instagram === null || k.instagram.trim() === '') continue;
    cikti.add(k.instagram.trim().toLowerCase().replace(/^@/, ''));
  }
  return cikti;
}
