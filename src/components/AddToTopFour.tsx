'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useSession } from '@/lib/auth-client';
import { useDict, useLocale } from '@/i18n/LocaleProvider';
import { withLocale } from '@/i18n/locale';
import { addToTopFourAction } from '@/app/[lang]/actions';

/**
 * Parfüm sayfasındaki "top 4'üme ekle" — sahibin istediği şey
 * ("site de değişsin ya, tam olsun").
 *
 * ⚠️ **Sayfa STATİK kalıyor ve bu düğmenin varlık şartı bu.** Oturum
 * sunucuda okunsaydı 52×2 parfüm sayfası dinamiğe düşerdi ve sitenin en
 * büyük teknik iddiası ("hesap sunucuda, sayfalar statik") sessizce ölürdü.
 * Oturum tarayıcıda çözülüyor; sayfa derlemede üretilmeye devam ediyor.
 *
 * ⚠️ **Girişsizken hiçbir şey çizilmiyor.** Ne "giriş yap da ekle" daveti ne
 * sönük bir düğme: bugün siteye giren insanların tamamı girişsiz ve parfüm
 * sayfası onlar için bugünkü hâlinde kalmalı. Üyelik isteğe bağlı; sayfaya
 * her ziyarette bir davet koymak o sözü bozardı. Davet zaten köşede duruyor.
 *
 * ⚠️ Düğmenin görünmesi bir yetki değil: `addToTopFourAction` kendi
 * oturumunu ayrıca denetliyor. Buradaki `useSession` yalnızca görünürlük.
 */
export function AddToTopFour({ perfumeId }: { readonly perfumeId: string }) {
  const { data, isPending } = useSession();
  const t = useDict();
  const locale = useLocale();
  const [busy, startTransition] = useTransition();
  const [state, setState] = useState<'idle' | 'added' | 'error'>('idle');
  const [message, setMessage] = useState<string | null>(null);

  /* Oturum belirsizken ya da girişsizken sayfa bugünkü hâlinde. */
  if (isPending || !data?.user) return null;

  const user = data.user as { username?: string | null };

  function add() {
    setMessage(null);
    startTransition(async () => {
      const result = await addToTopFourAction(perfumeId);
      if (result.ok) {
        setState('added');
        return;
      }
      setState('error');
      const table = t.account.top.errors as Record<string, string>;
      setMessage(result.error === 'tooMany' ? t.account.top.full : (table[result.error] ?? t.error.line));
    });
  }

  if (state === 'added') {
    return (
      <p className="mt-2 text-sm font-light text-white/40">
        {t.account.top.added}
        {user.username ? (
          <>
            {' — '}
            <Link
              href={withLocale(locale, `/u/${user.username}`)}
              className="transition-colors hover:text-white/80"
            >
              {user.username}
            </Link>
          </>
        ) : null}
      </p>
    );
  }

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={add}
        disabled={busy}
        className="text-sm font-light text-white/40 transition-colors hover:text-white/80 disabled:opacity-50"
      >
        {t.account.top.add}
      </button>
      {message ? <p className="mt-1 text-xs font-light text-white/50">{message}</p> : null}
    </div>
  );
}
