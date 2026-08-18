import { dictFor } from '@/i18n/dict';
import { isOsmos } from '@/lib/tenant';
import type { Locale } from '@/i18n/locale';

/**
 * "powered by" — kiracının parfüm sayfasının dibindeki tek satır.
 *
 * ⚠️ **Yerini sahip seçti (2026-08-18): yalnız künye sayfasının dibinde.**
 * Her sayfanın alt şeridine koymak da masadaydı ve elendi — teslim edilen şey
 * müşterinin sitesi; başkasının adı her ekranda durursa satış konuşmasında
 * itiraz çıkarır. Künyenin dibi, müşterinin kendi ürün bağlantısının hemen
 * altı: ziyaretçinin satın alma yoluna girmiyor, ama kaynağı arayan buluyor.
 *
 * ⚠️ **OSMOS'un kendi sitesinde hiç çizilmiyor.** osmos.me'de "powered by
 * osmos.me" yazmak boş bir cümle; ana sitenin çıktısı birebir korunuyor.
 * `DemoUyarisi`den farkı burada: o yalnız `indexable: false` demolarda çıkıyor,
 * bu **her kiracıda** — demo şeridi kalktığında ortada kalan tek imza bu olacak.
 *
 * ⚠️ **Cümle sözlükten, marka bağlantıdan.** Gerekçesi `i18n/en.ts`teki
 * `kaynak` yorumunda: sözlüğe "OSMOS" yazılırsa `brandStrings` onu kiracının
 * adına çevirir ve satır kendi kendini yalanlar.
 */
export function KaynakKunyesi({ lang }: { lang: Locale }) {
  if (isOsmos()) return null;

  const t = dictFor(lang);

  return (
    <p className="text-xs font-light text-white/25">
      {t.kaynak.harita}{' '}
      <a
        href="https://osmos.me"
        target="_blank"
        rel="noreferrer"
        className="underline underline-offset-2 transition-colors hover:text-white/50"
      >
        osmos.me
      </a>
    </p>
  );
}
