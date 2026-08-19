'use client';

/**
 * Künyedeki tek bir satıcı bağlantısı — turnikenin tarayıcı tarafı.
 *
 * ⚠️ **Görünüm ve davranış birebir korunuyor.** Bu bileşen sunucu bileşeninin
 * içinden çıkarıldı ve tek eklediği şey `onClick`. `href`, `target`, `rel` ve
 * sınıflar aynen taşındı; ayrıntılarının gerekçesi çağıran sayfada yazılı
 * (`app/[lang]/perfume/[id]/page.tsx`): `rel="sponsored"` komisyonlu
 * bağlantının arama motoruna beyanı ve pazarlık dışı, `whitespace-nowrap` ise
 * 390 px'te ölçülmüş bir sarma hatasının düzeltmesi.
 *
 * ⚠️ **`href` gerçek adres kalıyor.** Sayan bir yönlendirme (`/git?url=...`)
 * tıklamayı tam sayardı, ama fareyle üstüne gelen ziyaretçiye gideceği yerden
 * başka bir adres gösterirdi. Bu sitenin bütün iddiası ölçtüğünü olduğu gibi
 * söylemek; kendi bağlantısını gizlemesi bedava bir güven kaybı olurdu.
 * Bedeli kabul edildi: engelleyicisi olan ziyaretçi sayılmıyor, yani rakam
 * bir **taban**. Rapor bunu müşteriye açıkça yazıyor.
 *
 * ⚠️ **Sayım tıklamayı geciktirmiyor.** `sendBeacon` isteği tarayıcıya
 * bırakıyor ve hemen dönüyor; sayfa yeni sekmede açılırken istek arka planda
 * gidiyor. `fetch` + `await` olsaydı ölçüm, ölçtüğü şeyi yavaşlatırdı.
 *
 * ⚠️ **Sayım başarısız olursa hiçbir şey olmuyor.** Beacon yoksa (eski
 * tarayıcı) ya da istek düşerse bağlantı yine çalışıyor: ziyaretçinin yolunu
 * hiçbir koşulda sayaç kesmiyor.
 */

interface SaticiBaglantisiProps {
  /** Katalog istemciye PROP geçer, ithal EDILMEZ — kiracı sızıntısı dersi. */
  readonly perfumeId: string;
  readonly name: string;
  readonly url: string;
}

export function SaticiBaglantisi({ perfumeId, name, url }: SaticiBaglantisiProps) {
  function say(): void {
    if (typeof navigator === 'undefined' || typeof navigator.sendBeacon !== 'function') return;
    try {
      const govde = new Blob([JSON.stringify({ perfume: perfumeId, retailer: name })], {
        type: 'application/json',
      });
      navigator.sendBeacon('/api/tiklama', govde);
    } catch {
      /* Sayaç ziyaretçinin yolunu kesmez. Sessiz geçiliyor. */
    }
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="sponsored nofollow noopener"
      className="whitespace-nowrap transition-colors hover:text-white/80"
      onClick={say}
    >
      {name} ↗
    </a>
  );
}
