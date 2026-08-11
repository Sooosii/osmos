'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { requestPasswordReset, signIn, signUp } from '@/lib/auth-client';
import { useDict, useLocale } from '@/i18n/LocaleProvider';
import { withLocale } from '@/i18n/locale';

/**
 * Giriş ve kayıt — tek form, iki kip.
 *
 * Hazır bir üçüncü taraf penceresi yok: ekran sitenin kendi dilinde, kendi
 * tipografisinde. Yol haritasının sözü buydu.
 *
 * ⚠️ **Kayıttan sonra oturum AÇILMIYOR** ve bu bir hata değil: e-posta
 * doğrulaması zorunlu (`lib/auth.ts`), yani kayıt eden kişi mektubu
 * bekliyor. Ekran onu söylemek zorunda, yoksa kişi "bir şey olmadı"
 * sanıp tekrar tekrar dener.
 *
 * ⚠️ Yinelenen e-postada sunucu **hata dönmüyor** — bilerek, e-posta
 * sızdırmasını engellemek için (ölçüldü, `auth.test.ts`te yazılı). Yani bu
 * ekran "bu adres zaten kayıtlı" diyemez. Karşılığı: aynı ekranda duran
 * "zaten hesabım var" bağlantısı. O bağlantı olmazsa hesabını unutan kişi
 * hiç gelmeyecek bir mektubu bekler.
 */
type Mode = 'signIn' | 'signUp' | 'forgot';

/**
 * Google düğmesi yalnızca **yapılandırılmışsa** çiziliyor.
 *
 * ⚠️ Anahtar yokken de çiziliyordu ve basan kişi hataya düşüyordu — çalışmayan
 * bir düğme, hiç olmayan düğmeden kötü. Değer derlemede satıra gömülüyor, o
 * yüzden tam adıyla yazılmak zorunda.
 */
const GOOGLE_READY = Boolean(process.env.NEXT_PUBLIC_GOOGLE_ENABLED);

export function SignInForm() {
  const t = useDict();
  const locale = useLocale();
  const router = useRouter();

  const [mode, setMode] = useState<Mode>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [optIn, setOptIn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);

    try {
      if (mode === 'forgot') {
        await requestPasswordReset({ email, redirectTo: withLocale(locale, '/reset-password') });
        /*
          ⚠️ Cevap her zaman aynı ve bu bilinçli: "böyle bir hesap yok" demek,
          bir adresin kayıtlı olup olmadığını herkese söyleyen bir sorgu
          açardı. Kayıttaki sahte başarıyla aynı gerekçe.
        */
        setNotice(t.account.sentReset);
      } else if (mode === 'signUp') {
        const result = await signUp.email({
          email,
          password,
          name: email.split('@')[0] ?? 'osmos',
          /*
            Onay kutusu kayıt isteğiyle birlikte gidiyor: bu ekranda henüz
            oturum yok, kaydedilebilmesinin tek yolu bu (`auth.ts`te alan
            `input: true`). Önceden yalnızca ekranda duruyor ve hiçbir şey
            yapmıyordu.
          */
          emailOptIn: optIn,
        } as Parameters<typeof signUp.email>[0]);
        if (result.error) setError(result.error.message ?? t.error.line);
        else setNotice(t.account.checkInbox);
      } else {
        const result = await signIn.email({ email, password });
        if (result.error) setError(result.error.message ?? t.error.line);
        else router.push(withLocale(locale, '/settings'));
      }
    } catch {
      setError(t.error.line);
    } finally {
      setBusy(false);
    }
  }

  const field =
    'w-full border-b border-white/15 bg-transparent py-2 text-sm font-light text-white/90 outline-none transition-colors placeholder:text-white/25 focus:border-white/40';

  return (
    <div className="space-y-8">
      {GOOGLE_READY ? (
        <>
          <button
            type="button"
            onClick={() =>
              signIn.social({ provider: 'google', callbackURL: withLocale(locale, '/settings') })
            }
            className="w-full border border-white/20 py-3 text-[11px] tracking-[0.2em] text-white/70 transition-colors hover:border-white/40 hover:text-white"
          >
            {t.account.withGoogle}
          </button>

          <p className="text-center text-[10px] tracking-[0.18em] text-white/30">
            {t.account.orEmail}
          </p>
        </>
      ) : null}

      <form onSubmit={submit} className="space-y-5">
        <label className="block">
          <span className="text-[10px] tracking-[0.18em] text-white/40">{t.account.email}</span>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={field}
          />
        </label>

        {/* Unut kipinde şifre sorulmuyor: istenen tek şey adres. */}
        {mode === 'forgot' ? null : (
          <label className="block">
            <span className="text-[10px] tracking-[0.18em] text-white/40">
              {t.account.password}
            </span>
            <input
              type="password"
              required
              minLength={8}
              autoComplete={mode === 'signUp' ? 'new-password' : 'current-password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={field}
            />
          </label>
        )}

        {mode === 'signUp' ? (
          <label className="flex items-start gap-2.5 text-xs font-light text-white/50">
            <input
              type="checkbox"
              checked={optIn}
              onChange={(event) => setOptIn(event.target.checked)}
              className="mt-0.5 accent-white/70"
            />
            {t.account.emailOptIn}
          </label>
        ) : null}

        {error ? <p className="text-xs font-light text-white/60">{error}</p> : null}
        {notice ? <p className="text-xs font-light text-white/70">{notice}</p> : null}

        <button
          type="submit"
          disabled={busy}
          className="w-full border border-white/25 py-3 text-[11px] tracking-[0.2em] text-white/80 transition-colors hover:border-white/50 hover:text-white disabled:opacity-50"
        >
          {mode === 'forgot'
            ? t.account.sendReset
            : mode === 'signUp'
              ? t.account.createAccount
              : t.account.signIn.toUpperCase()}
        </button>
      </form>

      <div className="space-y-3">
        <button
          type="button"
          onClick={() => {
            setMode(mode === 'signUp' ? 'signIn' : 'signUp');
            setError(null);
            setNotice(null);
          }}
          className="w-full text-center text-xs font-light text-white/40 transition-colors hover:text-white/70"
        >
          {mode === 'signUp' ? t.account.haveAccount : t.account.createAccount}
        </button>

        {/*
          ⚠️ Şifre sıfırlama yolu bir süre HİÇ YOKTU: arka uçta kuruluydu ama
          onu tetikleyecek tek bir bağlantı yazılmamıştı, yani şifresini
          unutan kişi hesabına bir daha giremiyordu. Kayıt ekranında sahte
          başarı döndüğü için (e-posta sızdırmamak adına) hesabı olduğunu
          unutan kişinin tek çıkışı da burası.
        */}
        {mode === 'forgot' ? (
          <button
            type="button"
            onClick={() => {
              setMode('signIn');
              setNotice(null);
              setError(null);
            }}
            className="w-full text-center text-xs font-light text-white/30 transition-colors hover:text-white/60"
          >
            {t.account.signIn}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              setMode('forgot');
              setNotice(null);
              setError(null);
            }}
            className="w-full text-center text-xs font-light text-white/30 transition-colors hover:text-white/60"
          >
            {t.account.forgot}
          </button>
        )}
      </div>
    </div>
  );
}
