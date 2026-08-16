import { dictFor } from '@/i18n/dict';
import { activeTenant, isOsmos } from '@/lib/tenant';
import type { Locale } from '@/i18n/locale';

/**
 * Demo şeridi — gerçek bir işletmenin adıyla kurulmuş, onayı alınmamış
 * çalışmanın üstündeki uyarı.
 *
 * ⚠️ **Bu bir nezaket değil, yayına çıkmanın şartı.** Nischengold var olan bir
 * dükkân ve bu site onun markasıyla, onun kataloguyla kurulmuş. Ziyaretçi —
 * ya da dükkânın kendisi — sayfayı bulduğunda ilk öğreneceği şey bunun resmî
 * olmadığı olmalı. Yoksa marka gaspı gibi okunur.
 *
 * ⚠️ **Metin sözlükte ama "OSMOS" kelimesi orada YOK, ve sebebi bir tuzak.**
 * İlk sürümde uyarı bileşende sabit yazılmıştı ki marka değişiminden kaçsın;
 * `i18n.test.ts` onu reddetti (ekrana çıkacak Türkçe dize sözlükten geçmek
 * zorunda). Sözlüğe konunca da `brandStrings` her "OSMOS"u kiracının adıyla
 * değiştiriyor ve cümle *"bu sayfa Nischengold tarafından yaptırılmadı,
 * Nischengold hazırladı"* hâline geliyor.
 *
 * Çözüm ikisini de sağlıyor: cümle sözlükte ve marka adı içermiyor; "kim
 * yaptı" sorusunu aşağıdaki `osmos.me` bağlantısı cevaplıyor — o bir adres,
 * sözlükten geçmiyor, marka değişimi ona dokunmuyor.
 *
 * ⚠️ Kapatma düğmesi yok. Kapatılabilen bir uyarı, kapatıldıktan sonra yok
 * demektir.
 *
 * OSMOS'un kendi sitesinde ve `indexable` kiracılarda hiç çizilmiyor —
 * gerçek bir müşteriye teslim edilen sitede bu şeridin yeri yok.
 */
export function DemoUyarisi({ lang }: { lang: Locale }) {
  const tenant = activeTenant();
  if (isOsmos() || tenant.indexable) return null;

  const t = dictFor(lang);

  return (
    <div
      role="note"
      className="w-full border-b border-white/15 bg-white/[0.04] px-4 py-2
                 text-center font-mono text-[11px] leading-relaxed tracking-wide
                 text-white/60"
    >
      {t.demo.uyari(tenant.name)}{' '}
      <a
        href="https://osmos.me"
        rel="noreferrer"
        className="underline underline-offset-2 hover:text-white/90"
      >
        osmos.me
      </a>
    </div>
  );
}
