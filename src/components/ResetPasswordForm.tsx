'use client';

import { useState } from 'react';
import Link from 'next/link';
import { resetPassword } from '@/lib/auth-client';
import { useDict, useLocale } from '@/i18n/LocaleProvider';
import { withLocale } from '@/i18n/locale';

/**
 * Yeni şifre — sıfırlama mektubundaki bağlantının indiği yer.
 *
 * ⚠️ **Belirteç adresten `window.location`la okunuyor, `useSearchParams` ile
 * değil.** Sebep depoda yazılı bir ders (`LangSwitch`): `useSearchParams`,
 * Suspense sınırı olmadan bütün sayfayı istemciye düşürüyor; sınır koyunca da
 * üretilen HTML'de içerik eksik kalıyor. Sayfa statik kalsın diye belirteç
 * mount'tan sonra okunuyor.
 *
 * ⚠️ Belirteç **hiçbir yere loglanmıyor**: tek kullanımlık ve hesabı açıyor.
 */
export function ResetPasswordForm() {
  const t = useDict();
  const locale = useLocale();
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [state, setState] = useState<'idle' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);

    const token = new URLSearchParams(window.location.search).get('token');
    if (!token) {
      setState('error');
      setMessage(t.account.resetBadLink);
      setBusy(false);
      return;
    }

    try {
      const result = await resetPassword({ newPassword: password, token });
      if (result.error) {
        setState('error');
        setMessage(t.account.resetBadLink);
      } else {
        setState('done');
      }
    } catch {
      setState('error');
      setMessage(t.account.resetBadLink);
    } finally {
      setBusy(false);
    }
  }

  if (state === 'done') {
    return (
      <div className="space-y-6">
        <p className="text-sm font-light text-white/70">{t.account.resetDone}</p>
        <Link
          href={withLocale(locale, '/signin')}
          className="inline-block border border-white/25 px-5 py-2.5 text-[11px] tracking-[0.2em] text-white/80 transition-colors hover:border-white/50 hover:text-white"
        >
          {t.account.signIn.toUpperCase()}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <label className="block">
        <span className="text-[10px] tracking-[0.18em] text-white/40">
          {t.account.newPassword}
        </span>
        <input
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full border-b border-white/15 bg-transparent py-2 text-sm font-light text-white/90 outline-none transition-colors focus:border-white/40"
        />
      </label>

      {message ? <p className="text-xs font-light text-white/60">{message}</p> : null}

      <button
        type="submit"
        disabled={busy}
        className="w-full border border-white/25 py-3 text-[11px] tracking-[0.2em] text-white/80 transition-colors hover:border-white/50 hover:text-white disabled:opacity-50"
      >
        {t.account.settings.save}
      </button>
    </form>
  );
}
