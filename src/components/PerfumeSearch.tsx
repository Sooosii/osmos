'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useDict, useLocale } from '@/i18n/LocaleProvider';
import { withLocale } from '@/i18n/locale';
import {
  searchPerfumes,
  type PerfumeSearchDocument,
} from '@/lib/perfume-search';

let cachedDocuments: readonly PerfumeSearchDocument[] | null = null;

async function readDocuments(): Promise<readonly PerfumeSearchDocument[]> {
  if (cachedDocuments) return cachedDocuments;
  const response = await fetch('/api/perfume-search');
  if (!response.ok) throw new Error(`Search index returned ${response.status}`);
  const value: unknown = await response.json();
  if (!Array.isArray(value)) throw new Error('Search index is not an array');
  cachedDocuments = value as readonly PerfumeSearchDocument[];
  return cachedDocuments;
}

function SearchGlyph() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className="size-3.5 fill-none stroke-current">
      <circle cx="6.75" cy="6.75" r="4.75" />
      <path d="m10.25 10.25 3.5 3.5" />
    </svg>
  );
}

export function PerfumeSearch() {
  const t = useDict();
  const locale = useLocale();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const wasOpenRef = useRef(false);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [documents, setDocuments] = useState<readonly PerfumeSearchDocument[]>(
    cachedDocuments ?? [],
  );
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>(
    cachedDocuments ? 'ready' : 'idle',
  );

  const load = useCallback(() => {
    setStatus('loading');
    void readDocuments()
      .then((nextDocuments) => {
        setDocuments(nextDocuments);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }, []);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (open) {
      wasOpenRef.current = true;
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = previousOverflow;
      };
    }

    if (wasOpenRef.current) {
      wasOpenRef.current = false;
      triggerRef.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setOpen(false);
        setQuery('');
        return;
      }

      if (event.key !== 'Tab') return;
      const focusable = panelRef.current?.querySelectorAll<HTMLElement>(
        'input, button:not([disabled]), a[href]',
      );
      if (!focusable?.length) return;
      if (!panelRef.current?.contains(document.activeElement)) {
        event.preventDefault();
        inputRef.current?.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  const results = useMemo(
    () => searchPerfumes(documents, query, locale),
    [documents, locale, query],
  );

  const close = () => {
    setOpen(false);
    setQuery('');
  };

  const openSearch = () => {
    setOpen(true);
    if (status === 'idle') load();
  };

  const overlay = open ? (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center overflow-y-auto bg-[#050507]/95 p-4 text-white backdrop-blur-sm sm:p-8"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="osmos-search-heading"
        className="relative flex max-h-[calc(100dvh-2rem)] w-full max-w-2xl flex-col border border-white/20 bg-[#070709] shadow-[0_28px_90px_rgba(0,0,0,0.65)] sm:max-h-[calc(100dvh-4rem)]"
      >
        <div aria-hidden="true" className="osmos-search-dither h-1 border-b border-white/15 opacity-45" />

        <div className="flex items-center justify-between border-b border-white/15 px-4 py-3 sm:px-6">
          <p id="osmos-search-heading" className="text-[9px] tracking-[0.28em] text-white/50">
            {t.search.heading}
          </p>
          <button
            type="button"
            onClick={close}
            aria-label={t.search.close}
            className="flex size-8 items-center justify-center text-lg text-white/45 transition-colors motion-reduce:transition-none hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/50"
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>

        <label className="flex items-center gap-3 border-b border-white/15 px-4 sm:px-6">
          <SearchGlyph />
          <span className="sr-only">{t.search.aria}</span>
          <input
            ref={inputRef}
            type="search"
            autoComplete="off"
            spellCheck={false}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t.search.placeholder}
            className="h-16 min-w-0 flex-1 bg-transparent font-sans text-lg text-white outline-none placeholder:text-white/25 sm:text-xl"
          />
          <span aria-hidden="true" className="hidden text-[9px] tracking-[0.16em] text-white/25 sm:block">
            ESC
          </span>
        </label>

        <div
          role="status"
          aria-live="polite"
          aria-busy={status === 'loading'}
          className="min-h-40 overflow-y-auto"
        >
          {status === 'loading' ? (
            <p className="px-5 py-10 text-sm text-white/40 sm:px-7">{t.search.loading}</p>
          ) : status === 'error' ? (
            <div role="alert" className="flex items-center justify-between gap-4 px-5 py-10 sm:px-7">
              <p className="text-sm text-white/45">{t.search.error}</p>
              <button
                type="button"
                onClick={() => {
                  cachedDocuments = null;
                  load();
                }}
                className="border border-white/25 px-3 py-2 text-[9px] tracking-[0.2em] text-white/65 hover:border-white/50 hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/50"
              >
                {t.search.retry}
              </button>
            </div>
          ) : query.trim() === '' ? (
            <p className="px-5 py-10 text-sm text-white/35 sm:px-7">{t.search.prompt}</p>
          ) : results.length === 0 ? (
            <p className="px-5 py-10 text-sm text-white/40 sm:px-7">{t.search.empty}</p>
          ) : (
            <ol aria-live="polite" className="divide-y divide-white/10">
              {results.map((result, index) => (
                <li key={result.id}>
                  <a
                    href={withLocale(locale, `/perfume/${result.id}`)}
                    className="group grid grid-cols-[2rem_1fr_auto] items-center gap-3 px-4 py-4 transition-colors motion-reduce:transition-none hover:bg-white/[0.035] focus-visible:bg-white/[0.05] focus-visible:outline-none sm:grid-cols-[2.5rem_1fr_auto] sm:px-6"
                  >
                    <span className="text-[9px] tabular-nums tracking-[0.12em] text-white/25">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm text-white/90 sm:text-base">{result.name}</span>
                      <span className="mt-1 block truncate text-[10px] tracking-[0.12em] text-white/40">
                        {result.brand}
                      </span>
                    </span>
                    {result.matchingNotes.length > 0 ? (
                      <span className="hidden max-w-48 text-right text-[9px] leading-relaxed tracking-[0.1em] text-white/30 sm:block">
                        {t.search.notes} · {result.matchingNotes.join(' · ')}
                      </span>
                    ) : null}
                  </a>
                </li>
              ))}
            </ol>
          )}
        </div>

        <div className="flex justify-between border-t border-white/15 px-4 py-2 text-[8px] tracking-[0.18em] text-white/25 sm:px-6">
          <span>OSMOS / INDEX</span>
          <span>{documents.length.toString().padStart(3, '0')}</span>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label={t.search.aria}
        onClick={openSearch}
        className="flex h-8 shrink-0 items-center gap-1.5 text-[9px] tracking-[0.16em] text-white/50 transition-colors motion-reduce:transition-none hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/40"
      >
        <SearchGlyph />
        <span className="hidden md:inline">{t.search.trigger}</span>
      </button>
      {overlay && typeof document !== 'undefined' ? createPortal(overlay, document.body) : null}
    </>
  );
}
