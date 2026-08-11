'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { EvolutionSignature } from '@/components/EvolutionSignature';
import { useDict, useLocale } from '@/i18n/LocaleProvider';
import { withLocale } from '@/i18n/locale';
import { asPerfume, MAX_COMPOSITION_NOTES } from '@/lib/composition';
import type { NoteOption } from '@/lib/note-options';
import { saveCompositionAction } from '@/app/[lang]/actions';
import type { PerfumeCard } from '@/lib/perfume-cards';

/**
 * Kurma aracı — Patron'un asıl sebebi.
 *
 * Sahibin itirazından doğdu: satılan şey süs değil **araç** olmalı. Burada
 * 136 notadan kendi parfümünü kuruyorsun ve site onu, kendi 52'sini
 * değerlendirdiği ölçünün **aynısıyla** okuyor.
 *
 * ⚠️ **Evrim imzası taslaktan doğrudan çiziliyor.** `asPerfume` taslağı
 * `Perfume` şekline soktuğu için mevcut `EvolutionSignature` hiç
 * değiştirilmeden çalışıyor: nota ekledikçe eğri gözünün önünde kuruluyor.
 * Aracın "vay" dedirten yeri burası ve tek satır yeni çizim kodu yazılmadı.
 *
 * ⚠️ **En yakın parfümler SUNUCUDAN geliyor** (`/api/compose/nearest`).
 * Burada hesaplansaydı benzerlik motoru ve 52 parfüm tarayıcı paketine
 * inerdi; sitenin en eski sözü "hesap sunucuda, istemciye yalnızca sonuç".
 *
 * ⚠️ Üç nota sınırı burada **gösteriliyor**, uygulanmıyor: kapı sunucuda
 * (`profile-store.ts`) ve bir sınama onu tutuyor.
 */
type Tier = 'top' | 'heart' | 'base';

interface Draft {
  readonly noteId: string;
  readonly tier: Tier;
  readonly weight: number;
}

interface StudioProps {
  readonly notes: readonly NoteOption[];
  readonly freeLimit: number;
  readonly isPatron: boolean;
  readonly signedIn: boolean;
  readonly nameMax: number;
  /** Kimlikten karta çeviri — en yakın sonuçları çizmek için. */
  readonly cards: Readonly<Record<string, PerfumeCard>>;
}

export function Studio({ notes, freeLimit, isPatron, signedIn, nameMax, cards }: StudioProps) {
  const t = useDict();
  const locale = useLocale();
  const [busy, startTransition] = useTransition();

  const [draft, setDraft] = useState<readonly Draft[]>([]);
  const [name, setName] = useState('');
  const [query, setQuery] = useState('');
  /*
    ⚠️ Sonuçlar **ait oldukları taslakla etiketli** tutuluyor. Sade bir dizi
    olsaydı bayat sonuç ekranda kalırdı: kişi notayı çıkarır, eski eşleşmeler
    350 ms daha durur ve o an başka bir kompozisyonun cevabını gösterir.
    Etiket eşleşmediğinde hiçbir şey çizilmiyor.
  */
  const [near, setNear] = useState<{ key: string; matches: readonly { perfumeId: string; score: number }[] }>({
    key: '',
    matches: [],
  });
  const [saved, setSaved] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const limit = isPatron ? MAX_COMPOSITION_NOTES : freeLimit;
  const full = draft.length >= limit;

  const perfume = useMemo(
    () => asPerfume(draft.map((d) => ({ noteId: d.noteId, tier: d.tier, weight: d.weight })), name || '—'),
    [draft, name],
  );

  /*
    Taslak değiştikçe en yakınlar sunucudan tazeleniyor. Gecikme bilerek
    var: her tuşta istek atmak hem gereksiz hem de kullanıcı ağırlık
    kaydıracını sürüklerken saniyede onlarca çağrı demek.
  */
  const draftKey = JSON.stringify(draft);

  useEffect(() => {
    if (draft.length < 2) return;

    const id = setTimeout(async () => {
      try {
        const response = await fetch('/api/compose/nearest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: draftKey,
        });
        if (response.ok) setNear({ key: draftKey, matches: await response.json() });
      } catch {
        /* Ağ düştüyse sessiz kalınıyor; hata göstermeye değmez. */
      }
    }, 350);

    return () => clearTimeout(id);
    /*
      Bağımlılık `draftKey` — dizinin kendisi her çizimde yeni bir referans
      olurdu ve etki sonsuz dönerdi.
    */
  }, [draftKey, draft.length]);

  const matches = query.trim()
    ? notes
        .filter((note) => note.search.includes(query.trim().toLowerCase()))
        .filter((note) => !draft.some((d) => d.noteId === note.id))
        .slice(0, 8)
    : [];

  function add(note: NoteOption) {
    if (full) return;
    /* Katman notanın kendi bandından öneriliyor; kullanıcı değiştirebiliyor. */
    setDraft([...draft, { noteId: note.id, tier: note.band, weight: 0.6 }]);
    setQuery('');
    setSaved(null);
  }

  function update(index: number, patch: Partial<Draft>) {
    setDraft(draft.map((d, i) => (i === index ? { ...d, ...patch } : d)));
    setSaved(null);
  }

  function save() {
    setError(null);
    startTransition(async () => {
      const result = await saveCompositionAction({ name, notes: [...draft] });
      if (result.ok) setSaved(result.slug);
      else {
        const table = t.studio.errors as Record<string, string>;
        setError(table[result.error] ?? t.error.line);
      }
    });
  }

  const field =
    'w-full border-b border-white/15 bg-transparent py-2 text-sm font-light text-white/90 outline-none transition-colors placeholder:text-white/25 focus:border-white/40';
  const nameOf = (id: string) => notes.find((n) => n.id === id)?.name ?? id;
  const colorOf = (id: string) => notes.find((n) => n.id === id)?.color ?? '#888';

  return (
    <div className="space-y-14">
      {/* ① Notalar */}
      <section className="space-y-5">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-xs tracking-[0.3em] text-white/50">{t.studio.notes}</h2>
          <span className="text-[10px] tabular-nums tracking-[0.18em] text-white/30">
            {draft.length}/{limit}
          </span>
        </div>

        {draft.map((entry, index) => (
          <div key={entry.noteId} className="space-y-2 border-l border-white/10 pl-4">
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-sm font-light text-white/85">
                <span
                  aria-hidden="true"
                  className="size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: colorOf(entry.noteId) }}
                />
                {nameOf(entry.noteId)}
              </span>
              <button
                type="button"
                onClick={() => setDraft(draft.filter((_, i) => i !== index))}
                className="py-1 text-[10px] tracking-[0.18em] text-white/30 transition-colors hover:text-white/60"
              >
                {t.account.top.remove}
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              <div className="flex gap-3">
                {(['top', 'heart', 'base'] as const).map((tier) => (
                  <button
                    key={tier}
                    type="button"
                    onClick={() => update(index, { tier })}
                    className={`py-1 text-[10px] tracking-[0.18em] transition-colors ${
                      entry.tier === tier ? 'text-white/80' : 'text-white/25 hover:text-white/50'
                    }`}
                  >
                    {t.bands[tier]}
                  </button>
                ))}
              </div>

              <label className="flex min-w-[10rem] flex-1 items-center gap-3">
                <span className="sr-only">{t.studio.weight}</span>
                <input
                  type="range"
                  min={0.1}
                  max={1}
                  step={0.05}
                  value={entry.weight}
                  onChange={(event) => update(index, { weight: Number(event.target.value) })}
                  className="w-full accent-white/70"
                />
                <span className="w-8 text-right text-[10px] tabular-nums text-white/35">
                  {entry.weight.toFixed(2)}
                </span>
              </label>
            </div>
          </div>
        ))}

        {full ? (
          <p className="text-xs font-light text-white/45">
            {isPatron ? t.studio.limitReached : t.studio.needsPatron}
          </p>
        ) : (
          <div className="space-y-2">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t.studio.search}
              className={field}
            />
            <ul>
              {matches.map((note) => (
                <li key={note.id}>
                  <button
                    type="button"
                    onClick={() => add(note)}
                    className="flex w-full items-center gap-3 py-2 text-left text-sm font-light text-white/70 transition-colors hover:text-white"
                  >
                    <span
                      aria-hidden="true"
                      className="size-2 shrink-0 rounded-full"
                      style={{ backgroundColor: note.color }}
                    />
                    <span className="truncate">{note.name}</span>
                    <span className="ml-auto text-[9px] tracking-[0.18em] text-white/25">
                      {t.bands[note.band]}
                    </span>
                  </button>
                </li>
              ))}
              {query.trim() && matches.length === 0 ? (
                <li className="py-2 text-sm font-light text-white/35">{t.account.top.noMatch}</li>
              ) : null}
            </ul>
          </div>
        )}
      </section>

      {/* ② Canlı imza — taslaktan doğrudan */}
      {draft.length >= 1 ? (
        <section>
          <h2 className="mb-6 text-xs tracking-[0.3em] text-white/50">{t.studio.curve}</h2>
          <EvolutionSignature perfume={perfume} />
        </section>
      ) : null}

      {/* ③ En yakın parfümler — sunucudan */}
      {near.key === draftKey && near.matches.length > 0 ? (
        <section>
          <h2 className="mb-5 text-xs tracking-[0.3em] text-white/50">{t.studio.nearest}</h2>
          <ul className="space-y-2">
            {near.matches.map((match) => {
              const card = cards[match.perfumeId];
              if (!card) return null;
              return (
                <li key={match.perfumeId} className="flex items-center gap-3 text-sm font-light">
                  <span
                    aria-hidden="true"
                    className="size-2 shrink-0 rounded-full"
                    style={{ backgroundColor: card.color }}
                  />
                  <Link
                    href={withLocale(locale, `/perfume/${card.id}`)}
                    className="text-white/75 transition-colors hover:text-white"
                  >
                    {card.name}
                  </Link>
                  <span className="text-white/30">{card.brand}</span>
                  <span className="ml-auto tabular-nums text-white/40">
                    {Math.round(match.score * 100)}%
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {/* ④ Adı ve kaydetme */}
      {draft.length >= 2 ? (
        <section className="max-w-md space-y-4">
          <label className="block">
            <span className="text-[10px] tracking-[0.18em] text-white/40">{t.studio.name}</span>
            <input
              value={name}
              maxLength={nameMax}
              onChange={(event) => setName(event.target.value)}
              className={field}
            />
          </label>

          {error ? <p className="text-xs font-light text-white/60">{error}</p> : null}

          {saved ? (
            <p className="text-sm font-light text-white/70">
              {t.studio.saved}{' '}
              <Link
                href={withLocale(locale, `/u/me/k/${saved}`)}
                className="underline underline-offset-4 transition-colors hover:text-white"
              >
                {name}
              </Link>
            </p>
          ) : signedIn ? (
            <button
              type="button"
              onClick={save}
              disabled={busy || name.trim().length === 0}
              className="border border-white/25 px-5 py-2.5 text-[11px] tracking-[0.2em] text-white/80 transition-colors hover:border-white/50 hover:text-white disabled:opacity-40"
            >
              {t.studio.save}
            </button>
          ) : (
            /* Girişsiz kişi kurabiliyor ama kaydedemiyor — davet burada. */
            <p className="text-xs font-light text-white/45">
              <Link
                href={withLocale(locale, '/signin')}
                className="underline underline-offset-4 transition-colors hover:text-white/80"
              >
                {t.studio.signInToSave}
              </Link>
            </p>
          )}
        </section>
      ) : null}
    </div>
  );
}
