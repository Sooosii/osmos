'use client';

import Link from 'next/link';
import { useSession } from '@/lib/auth-client';
import { useDict, useLocale } from '@/i18n/LocaleProvider';
import { withLocale } from '@/i18n/locale';

/**
 * Köşedeki giriş bağlantısı — sitenin üçüncü "meta" kontrolü.
 *
 * `NotifyControl` ve `LangSwitch` ile aynı kümede, aynı sessiz tipografide.
 * Girişsizken "sign in", girişliyken kullanıcı adı (ya da adı henüz
 * seçilmemişse ayarlara giden sönük bir bağlantı).
 *
 * ⚠️ **Oturum TARAYICIDA okunuyor, sunucuda değil.** Sunucuda okunsaydı bu
 * bileşeni taşıyan her sayfa — yani `ScreenFrame` kullanan 380 statik sayfa —
 * dinamiğe düşerdi. Sitenin en büyük teknik iddiası ("hesap sunucuda kalır,
 * sayfalar statik") tam burada sessizce ölürdü.
 *
 * Bunun bedeli: bağlantı ilk boyamada "sign in" olarak çiziliyor ve oturum
 * çözülünce kullanıcı adına dönüyor. Kabul edilebilir, çünkü alternatifi
 * bütün siteyi dinamikleştirmek. Zıplamayı azaltmak için oturum belirsizken
 * hiçbir şey çizilmiyor — yanlış bir şey göstermektense boş kalmak iyi.
 */
/**
 * ⚠️ **Davet, kapıdan ayrı bir anahtarla açılıyor.**
 *
 * Hesap katmanı hazır ve çalışıyor, ama posta gönderimi doğrulanmış bir alan
 * adı olmadan **yalnızca site sahibinin adresine** ulaşıyor (Resend'in kuralı,
 * 403 ile ölçüldü). O hâlde başka biri kayıt olursa: hesabı oluşuyor, mektup
 * hiç gitmiyor, ve kişi kilitleniyor — giriş yapamıyor, tekrar kayıt olamıyor.
 *
 * Bu yüzden köşedeki davet ayrı bir bayrağa bağlı. Adresler çalışmaya devam
 * ediyor (`/signin` doğrudan açılıyor, sahip deneyebiliyor); görünen tek şey
 * değişiyor: kimse çıkışı olmayan bir kapıya çağrılmıyor. Alan adı Resend'de
 * doğrulandığı gün tek bir değişken açılıyor.
 */
const ACCOUNTS_INVITED = Boolean(process.env.NEXT_PUBLIC_ACCOUNTS_ENABLED);

export function SignInLink({ className = '' }: { readonly className?: string }) {
  const { data, isPending } = useSession();
  const t = useDict();
  const locale = useLocale();

  /* Oturum henüz bilinmiyor: yanlış bir şey göstermektense hiçbir şey. */
  if (isPending) return null;

  /*
    Girişliye her zaman gösteriliyor — profiline ve ayarlarına ulaşması gerek.
    Kapanan yalnızca girişsize yapılan DAVET.
  */
  if (!ACCOUNTS_INVITED && !data?.user) return null;

  const user = data?.user as { username?: string | null } | undefined;
  const label = user ? (user.username ?? t.account.settings.heading.toLowerCase()) : t.account.signIn;
  const href = user
    ? withLocale(locale, user.username ? `/u/${user.username}` : '/settings')
    : withLocale(locale, '/signin');

  return (
    <Link
      href={href}
      className={`text-[9px] tracking-[0.18em] text-white/50 transition-colors hover:text-white/70 ${className}`}
    >
      {label}
    </Link>
  );
}
