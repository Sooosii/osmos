'use client';

import { useEffect, useState, useTransition } from 'react';
import { useSession } from '@/lib/auth-client';
import { useDict } from '@/i18n/LocaleProvider';
import { SHELF_KINDS, type ShelfEntry, type ShelfKind } from '@/lib/shelf';
import { setShelfAction } from '@/app/[lang]/actions';

/**
 * Künyedeki üç raf düğmesi — "bende var · denedim · istiyorum".
 *
 * ⚠️ **Sayfa STATİK kalıyor** ve bu düğmelerin varlık şartı bu. Oturum
 * sunucuda okunsaydı 52×2 parfüm sayfası dinamiğe düşerdi; `AddToTopFour`ün
 * aynı gerekçesi. Hem oturum hem raf tarayıcıda çözülüyor.
 *
 * ⚠️ **Girişsizde hiçbir şey çizilmiyor** — ne davet ne sönük bir düğme.
 * Bugün siteye giren insanların tamamı girişsiz ve künye onlar için bugünkü
 * hâlinde kalmalı.
 *
 * ⚠️ **Raf bilinene kadar da çizilmiyor.** Önce çizip sonra işareti
 * yerleştirmek, kullanıcının gözü önünde "seçili değil"den "seçili"ye atlayan
 * bir düğme demek olurdu; kendi tıklamadığı bir değişikliği kendi yapmış
 * sanır.
 *
 * ⚠️ Düğmenin görünmesi bir yetki değil: `setShelfAction` oturumu ayrıca
 * denetliyor. Buradaki `useSession` yalnızca görünürlük.
 */
export function ShelfPicker({ perfumeId }: { readonly perfumeId: string }) {
  const { data, isPending } = useSession();
  const t = useDict();

  const [kind, setKind] = useState<ShelfKind | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [busy, startTransition] = useTransition();

  const signedIn = !isPending && Boolean(data?.user);

  useEffect(() => {
    if (!signedIn) return;
    let alive = true;

    /*
      Bütün raf iniyor, tek parfümün hâli değil: liste en fazla katalog
      boyunda (52 küçük kayıt) ve aynı uç uzaydaki halkaları da besliyor.
      Parfüm başına bir uç açmak aynı sorguyu ikinci kez yazmak olurdu.
    */
    void (async () => {
      try {
        const response = await fetch('/api/shelf');
        if (!response.ok) return;

        const body = (await response.json()) as { entries?: readonly ShelfEntry[] };
        const mine = body.entries?.find((entry) => entry.perfumeId === perfumeId);
        if (alive) setKind(mine?.kind ?? null);
      } catch {
        /* Ağ düştü: düğmeler yine de çizilsin, işaretsiz. Sessiz kalmak
           doğru — kullanıcı bir şey istemedi, sayfa kendiliğinden sordu. */
      } finally {
        if (alive) setLoaded(true);
      }
    })();

    return () => {
      alive = false;
    };
  }, [signedIn, perfumeId]);

  if (!signedIn || !loaded) return null;

  function choose(next: ShelfKind) {
    /* Etkin rafa tekrar basmak raftan çıkarıyor. */
    const target = next === kind ? null : next;
    const previous = kind;

    // İyimser: tıklama anında işaret yer değiştiriyor, sunucu beklenmiyor.
    setKind(target);

    startTransition(async () => {
      const result = await setShelfAction(perfumeId, target);
      if (!result.ok) setKind(previous);
    });
  }

  return (
    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
      {SHELF_KINDS.map((option) => {
        const active = option === kind;
        const label = t.shelf.kinds[option];

        return (
          <button
            key={option}
            type="button"
            onClick={() => choose(option)}
            disabled={busy}
            aria-pressed={active}
            aria-label={active ? t.shelf.removeLabel(label) : label}
            /*
              Etkin olan hem parlak hem altı çizili. Yalnız parlaklıkla
              ayrılsaydı fark renk körlüğünde ve düşük kontrastlı ekranda
              kaybolurdu; `aria-pressed` de ekran okuyucu için eşlikçisi.
            */
            className={`text-sm font-light transition-colors disabled:opacity-50 ${
              active
                ? 'text-white underline decoration-white/30 underline-offset-4'
                : 'text-white/35 hover:text-white/70'
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
