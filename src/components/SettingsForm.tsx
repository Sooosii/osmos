'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from '@/lib/auth-client';
import { useDict, useLocale } from '@/i18n/LocaleProvider';
import { withLocale } from '@/i18n/locale';
import type { PerfumeCard } from '@/lib/perfume-cards';
import { MAX_TOP_FOUR } from '@/lib/top-four-sabit';
import {
  chooseUsernameAction,
  saveProfileAction,
  setSlotAction,
} from '@/app/[lang]/actions';

/**
 * Ayarlar — hesabın tek yönetim yeri.
 *
 * Plan dört ayrı ekran öngörüyordu (kullanıcı adı, ayarlar, Top 4 düzenleme,
 * silme); tek sayfada toplandı. Sebep: dördü de "hesabımı yönetiyorum"
 * eylemi ve aralarında gezinmek, iki alanı doldurmak için üç sayfa açmak
 * demekti. Adres sayısı azaldı, akış kısaldı.
 *
 * ⚠️ **Kullanıcı adı yoksa ilk ve tek iş odur.** Adı olmayan bir hesabın
 * profili yok, paylaşacak bağlantısı yok — geri kalan alanları göstermek,
 * doldurulup kaybolacak bir form sunmak olurdu.
 */
interface SettingsFormProps {
  readonly username: string | null;
  readonly bio: string | null;
  readonly hidden: boolean;
  readonly emailOptIn: boolean;
  readonly topFour: readonly PerfumeCard[];
  readonly all: readonly PerfumeCard[];
  readonly bioMax: number;
}

export function SettingsForm(props: SettingsFormProps) {
  const t = useDict();
  const locale = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [name, setName] = useState(props.username ?? '');
  const [bio, setBio] = useState(props.bio ?? '');
  const [hidden, setHidden] = useState(props.hidden);
  const [optIn, setOptIn] = useState(props.emailOptIn);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [query, setQuery] = useState('');
  const [openSlot, setOpenSlot] = useState<number | null>(null);

  const errorText = (key: string): string => {
    const table = t.account.username.errors as Record<string, string>;
    const top = t.account.top.errors as Record<string, string>;
    return table[key] ?? top[key] ?? t.error.line;
  };

  function claimName() {
    setError(null);
    startTransition(async () => {
      const result = await chooseUsernameAction(name);
      if (result.ok) router.refresh();
      else setError(errorText(result.error));
    });
  }

  function save() {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await saveProfileAction({ bio, hidden, emailOptIn: optIn });
      if (result.ok) {
        setSaved(true);
        router.refresh();
      } else setError(errorText(result.error));
    });
  }

  function pick(slot: number, perfumeId: string | null) {
    setError(null);
    startTransition(async () => {
      const result = await setSlotAction(slot, perfumeId);
      if (result.ok) {
        setOpenSlot(null);
        setQuery('');
        router.refresh();
      } else setError(errorText(result.error));
    });
  }

  const field =
    'w-full border-b border-white/15 bg-transparent py-2 text-sm font-light text-white/90 outline-none transition-colors placeholder:text-white/25 focus:border-white/40';
  const button =
    'border border-white/25 px-5 py-2.5 text-[11px] tracking-[0.2em] text-white/80 transition-colors hover:border-white/50 hover:text-white disabled:opacity-40';

  /* ① Adı yoksa başka hiçbir şey gösterilmiyor. */
  if (!props.username) {
    return (
      <div className="max-w-sm space-y-6">
        <div>
          <h2 className="text-2xl font-light tracking-tight">{t.account.username.heading}</h2>
          <p className="mt-3 text-sm font-light text-white/50">
            {t.account.username.lede(withLocale(locale, ''))}
          </p>
        </div>

        <label className="block">
          <span className="text-[10px] tracking-[0.18em] text-white/40">
            {t.account.username.label}
          </span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoComplete="off"
            className={field}
          />
        </label>

        {error ? <p className="text-xs font-light text-white/60">{error}</p> : null}

        <button type="button" onClick={claimName} disabled={pending} className={button}>
          {t.account.username.save}
        </button>
      </div>
    );
  }

  const slots = Array.from({ length: MAX_TOP_FOUR }, (_, index) => props.topFour[index] ?? null);
  const chosen = new Set(props.topFour.map((card) => card.id));
  const matches = query.trim()
    ? props.all.filter((card) => card.search.includes(query.trim().toLowerCase())).slice(0, 8)
    : [];

  return (
    <div className="space-y-16">
      {/* ② Top 4 */}
      <section>
        <h2 className="mb-6 text-xs tracking-[0.3em] text-white/50">{t.account.top.heading}</h2>

        {/*
          ⚠️ Bekleme sırasında görsel bir işaret şart. Düğmeler `disabled`
          oluyordu ama ekranda hiçbir şey değişmiyordu: telefonda dokunup
          ~2 saniye bekleyen kişi dokunuşun kaydedilmediğini sanıyor ve
          tekrar dokunuyor. Site dönen bir çark kullanmıyor — karşılığı
          sönme; sitenin geri kalanının dili de bu.
        */}
        <div
          className={`grid grid-cols-2 gap-3 transition-opacity duration-200 sm:grid-cols-4 ${
            pending ? 'opacity-50' : ''
          }`}
        >
          {slots.map((card, slot) => (
            <div key={slot} className="space-y-2">
              <button
                type="button"
                onClick={() => setOpenSlot(openSlot === slot ? null : slot)}
                className="flex min-h-[5.5rem] w-full flex-col justify-between border border-white/10 p-3 text-left transition-colors hover:border-white/30"
              >
                {card ? (
                  <>
                    <span className="text-[9px] tracking-[0.22em] text-white/40">
                      {card.brand.toUpperCase()}
                    </span>
                    <span className="text-sm font-light text-white/90">{card.name}</span>
                    <span
                      aria-hidden="true"
                      className="mt-2 block h-[3px] w-full"
                      style={{ backgroundColor: card.color }}
                    />
                  </>
                ) : (
                  /*
                    ⚠️ Boş yuvada eskiden yalnızca sıra numarası yazıyordu
                    ("4") ve telefonda ne olduğu anlaşılmıyordu — sayı mı,
                    başlık mı, tıklanır mı? Artık numara sönük bir köşe
                    işareti, ortadaki `+` ise ne yapılacağını söylüyor.
                  */
                  <span className="flex h-full w-full flex-col justify-between">
                    <span className="text-[10px] tracking-[0.2em] text-white/20">{slot + 1}</span>
                    <span className="self-center pb-2 text-2xl font-light leading-none text-white/25">
                      +
                    </span>
                  </span>
                )}
              </button>

              {card ? (
                /*
                  ⚠️ Dokunma hedefi: metin 10 px ama düğmenin kendisi `py-2`
                  ile ~30 px yüksekliğinde ve kartın tam genişliğinde.
                  Telefonda ölçüldü — tek satırlık bir bağlantı olarak
                  parmakla ıskalanıyordu.
                */
                <button
                  type="button"
                  onClick={() => pick(slot, null)}
                  disabled={pending}
                  className="w-full py-2 text-left text-[10px] tracking-[0.18em] text-white/30 transition-colors hover:text-white/60"
                >
                  {t.account.top.remove}
                </button>
              ) : null}
            </div>
          ))}
        </div>

        {openSlot !== null ? (
          <div className="mt-6 max-w-md space-y-3">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t.account.top.search}
              autoFocus
              className={field}
            />
            <ul className="space-y-1">
              {matches.map((card) => (
                <li key={card.id}>
                  <button
                    type="button"
                    onClick={() => pick(openSlot, card.id)}
                    disabled={pending || chosen.has(card.id)}
                    className="flex w-full items-center gap-3 py-1.5 text-left text-sm font-light text-white/70 transition-colors hover:text-white disabled:opacity-30"
                  >
                    <span
                      aria-hidden="true"
                      className="size-2 shrink-0 rounded-full"
                      style={{ backgroundColor: card.color }}
                    />
                    <span className="truncate">
                      {card.name}
                      <span className="text-white/35"> · {card.brand}</span>
                    </span>
                  </button>
                </li>
              ))}
              {query.trim() && matches.length === 0 ? (
                <li className="py-1.5 text-sm font-light text-white/35">{t.account.top.noMatch}</li>
              ) : null}
            </ul>
          </div>
        ) : null}
      </section>

      {/* ③ Cümle ve gizlilik */}
      <section className="max-w-md space-y-6">
        <h2 className="text-xs tracking-[0.3em] text-white/50">{t.account.settings.heading}</h2>

        <label className="block">
          <span className="text-[10px] tracking-[0.18em] text-white/40">
            {t.account.settings.bio}
          </span>
          <input
            value={bio}
            maxLength={props.bioMax}
            onChange={(event) => setBio(event.target.value)}
            className={field}
          />
          <span className="mt-1 block text-[10px] text-white/25">
            {t.account.settings.bioHint(props.bioMax)}
          </span>
        </label>

        <label className="flex items-start gap-2.5 text-sm font-light text-white/60">
          <input
            type="checkbox"
            checked={hidden}
            onChange={(event) => setHidden(event.target.checked)}
            className="mt-1 accent-white/70"
          />
          <span>
            {t.account.settings.hidden}
            <span className="mt-0.5 block text-xs text-white/35">
              {t.account.settings.hiddenHint}
            </span>
          </span>
        </label>

        <label className="flex items-start gap-2.5 text-sm font-light text-white/60">
          <input
            type="checkbox"
            checked={optIn}
            onChange={(event) => setOptIn(event.target.checked)}
            className="mt-1 accent-white/70"
          />
          {t.account.emailOptIn}
        </label>

        {error ? <p className="text-xs font-light text-white/60">{error}</p> : null}
        {saved ? <p className="text-xs font-light text-white/50">{t.account.settings.saved}</p> : null}

        <div className="flex items-center gap-4">
          <button type="button" onClick={save} disabled={pending} className={button}>
            {t.account.settings.save}
          </button>
          <button
            type="button"
            onClick={() => signOut().then(() => router.push(withLocale(locale, '/')))}
            className="text-xs font-light text-white/40 transition-colors hover:text-white/70"
          >
            {t.account.signOut}
          </button>
        </div>
      </section>

      <DeleteAccount username={props.username} />
    </div>
  );
}

/**
 * Hesap silme — ayrı bir bileşen, ayrı bir zihinsel alan.
 *
 * ⚠️ Onay için **kullanıcı adını yazdırıyor.** "Emin misin?" penceresi
 * refleksle geçiliyor; adı yazmak, kişinin ne sildiğini okumasını
 * zorunlu kılıyor. Geri dönüşü yok ve metin bunu söylüyor.
 */
function DeleteAccount({ username }: { readonly username: string }) {
  const t = useDict();
  const locale = useLocale();
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  async function remove() {
    setBusy(true);
    setFailed(false);
    try {
      const { authClient } = await import('@/lib/auth-client');
      const result = await authClient.deleteUser();
      if (result.error) {
        setFailed(true);
        setBusy(false);
        return;
      }
      /*
        ⚠️ **Sert gezinme, `router.push` DEĞİL** — ölçülerek öğrenildi:
        silme sunucuda tamamlanmıştı (kullanıcı, oturum, Top 4 hepsi gitti)
        ama tarayıcı `/settings`te kaldı. Sebep istemci yönlendiricisinin
        önbelleği: oturum çerezi artık yok, ama React ağacı ve rota
        önbelleği hâlâ giriş yapılmış hâli tutuyor.

        Hesap silindikten sonra doğru davranış her şeyi sıfırlamak; yumuşak
        geçiş, silinmiş bir hesabın ekranında oturmaya devam etmek demek.
      */
      window.location.href = withLocale(locale, '/');
    } catch {
      setFailed(true);
      setBusy(false);
    }
  }

  return (
    <section className="max-w-md space-y-4 border-t border-white/10 pt-10">
      <h2 className="text-xs tracking-[0.3em] text-white/40">
        {t.account.settings.dangerHeading}
      </h2>
      <p className="text-xs font-light leading-relaxed text-white/40">
        {t.account.settings.dangerLine}
      </p>
      <input
        value={typed}
        onChange={(event) => setTyped(event.target.value)}
        placeholder={t.account.settings.deleteConfirm}
        autoComplete="off"
        className="w-full border-b border-white/10 bg-transparent py-2 text-sm font-light text-white/70 outline-none placeholder:text-white/20 focus:border-white/30"
      />
      {failed ? <p className="text-xs font-light text-white/60">{t.error.line}</p> : null}
      <button
        type="button"
        onClick={remove}
        disabled={busy || typed.trim() !== username}
        className="text-[11px] tracking-[0.2em] text-white/40 transition-colors hover:text-white/70 disabled:opacity-25"
      >
        {t.account.settings.delete}
      </button>
    </section>
  );
}
