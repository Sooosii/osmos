import type { DatabaseSync } from 'node:sqlite';
import type { Lead } from './types.ts';
import { kanitlar } from './db.ts';
import { dilSec, sayfaMetni, type Dil } from './export/outreach.ts';

/**
 * Takip — cevap gelmeyen dükkâna tek hatırlatma.
 *
 * ⚠️ **Sistem bugüne kadar TEK ATIŞLIKTI.** `temasKurulanlar()` yalnız
 * `SELECT DISTINCT domain` yapıyor, tarihe hiç bakmıyor: yazılan dükkân bir
 * daha hiçbir partide çıkmıyordu. Yani 36 dükkâna yazıldı ve hiçbiri bir daha
 * hatırlanmadı. Kural dokümanda vardı (`docs/b2b/teklif.md`), otomasyonu yoktu
 * — ve elle takip edilecek bir liste, takip edilmeyen bir liste demektir.
 *
 * ⚠️ **"Iki hatırlatma yok" kuralı ŞEMA DEĞIŞTIRMEDEN uygulanıyor.** Bir
 * dükkânın takip hakkı, deftere yazılmış `gonderildi` sayısının bir olmasıyla
 * ölçülüyor. Hatırlatma gönderilip deftere işlendiği an sayı ikiye çıkıyor ve
 * dükkân listeden kendiliğinden düşüyor. Ayrı bir "takip edildi" sütunu
 * tutulsaydı, deftere yazmayı unutan biri aynı kişiye üçüncü kez yazabilirdi.
 *
 * ⚠️ **`otomatik` takip hakkını YAKMIYOR.** Bot karşılaması yalnız mesajın
 * ulaştığını ve hesabın canlı olduğunu söylüyor; insan onu hiç görmedi.
 * `cevap`/`ilgilendi`/`red`/`elendi` ise konuşmanın gerçekten başladığını (ya
 * da bittiğini) söylüyor ve bunlar listeyi kapatıyor — sıcak bir konuşmaya
 * soğuk hatırlatma göndermek, hiç göndermemekten kötü.
 */

/** Hatırlatma için beklenecek en az gün — `docs/b2b/teklif.md`: "en erken bir hafta". */
export const EN_AZ_GUN = 7;

export interface TakipAdayi {
  readonly domain: string;
  /** Ilk (ve tek) `gonderildi` kaydının tarihi. */
  readonly gonderimTarihi: string;
  readonly gecenGun: number;
  readonly kanal: string;
  readonly dil: Dil;
  readonly instagram: string | null;
  readonly email: string | null;
  readonly shopName: string | null;
}

/** Iki ISO tarih arasındaki tam gün. Saf — sınamanın tuttuğu yer burası. */
export function gecenGun(gonderim: string, simdi: Date): number {
  const fark = simdi.getTime() - new Date(gonderim).getTime();
  return Math.floor(fark / (24 * 60 * 60 * 1000));
}

interface HamSatir {
  readonly domain: string;
  readonly ilk_tarih: string;
  readonly kanal: string;
}

/**
 * Hatırlatma hakkı olan dükkânlar, en eskisi başta.
 *
 * Konuşma başlamış (ya da bitmiş) dükkânlar SQL'de eleniyor; yaş süzgeci
 * `gecenGun` ile burada uygulanıyor — saf ve tek başına sınanabilir kalsın diye.
 */
export function takipAdaylari(
  db: DatabaseSync,
  leadler: readonly Lead[],
  simdi: Date,
  enAzGun: number = EN_AZ_GUN,
): readonly TakipAdayi[] {
  const satirlar = db.prepare(`
    SELECT domain, MIN(tarih) AS ilk_tarih, MIN(kanal) AS kanal
    FROM temas
    WHERE sonuc = 'gonderildi'
      AND domain NOT IN (
        SELECT domain FROM temas WHERE sonuc IN ('cevap','ilgilendi','red','elendi')
      )
    GROUP BY domain
    HAVING COUNT(*) = 1
    ORDER BY ilk_tarih ASC
  `).all() as unknown as HamSatir[];

  const leadOf = new Map(leadler.map((l) => [l.domain, l]));

  return satirlar
    .map((satir): TakipAdayi => {
      const lead = leadOf.get(satir.domain);
      return {
        domain: satir.domain,
        gonderimTarihi: satir.ilk_tarih,
        gecenGun: gecenGun(satir.ilk_tarih, simdi),
        kanal: satir.kanal,
        /*
          ⚠️ **Dil, gönderilen mesajınkiyle AYNI yoldan seçiliyor.** Yalnız
          `country`ye bakmak yetmiyordu ve bu ölçüldü: nischengold.com'a
          Almanca yazılmıştı ama ülkesi defterde boş, dolayısıyla takip
          listesi onu `en` gösteriyordu. Almanca yazdığın dükkâna Ingilizce
          hatırlatma göndermek, hatırlatmanın kendisinden çok görünür bir
          özensizlik. `outreach.ts` sayfa metnine de bakıyor; takip de bakmalı
          — iki yerde iki farklı dil kararı, bir gün ikisinden yalnız birinin
          düzeltilmesi demekti.
        */
        dil: lead === undefined
          ? 'en'
          : dilSec(lead.country, sayfaMetni(lead, lead.id === undefined ? [] : kanitlar(db, lead.id))),
        instagram: lead?.instagram ?? null,
        email: lead?.email ?? null,
        shopName: lead?.shop_name ?? null,
      };
    })
    .filter((aday) => aday.gecenGun >= enAzGun);
}

/**
 * Hatırlatma metni — **tek cümle**, `docs/b2b/teklif.md`deki kuralın birebir
 * karşılığı: *"Bir şey sormak isterseniz buradayım; istemezseniz bir daha
 * yazmam."*
 *
 * ⚠️ Yeni bir satış hamlesi DEĞIL: fiyat, özellik, bağlantı yok. Ikinci mesajın
 * işi konuşmayı yeniden açmak; satmaya çalışan bir hatırlatma, sessizliği
 * ısrara çeviriyor ve hesabı riske atıyor.
 */
export function takipMetni(dil: Dil): string {
  if (dil === 'tr') {
    return 'Bir şey sormak isterseniz buradayım; istemezseniz bir daha yazmam.';
  }
  if (dil === 'de') {
    return 'Falls Sie etwas fragen möchten, bin ich da; falls nicht, schreibe ich Ihnen nicht wieder.';
  }
  return 'If you would like to ask anything I am here; if not, I will not write again.';
}
