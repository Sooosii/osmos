'use client';

import { useEffect, useState } from 'react';
import { useDict, useLocale } from '@/i18n/LocaleProvider';
import { vapidKeyBytes } from '@/lib/push-client';
import { activeTenant } from '@/lib/tenant';

/**
 * Bildirim düğmesi — dil değiştiricinin kardeşi, sitenin ikinci "meta" kontrolü.
 *
 * Dört görünür durumu var: `idle` (HABER VER / NOTIFY), `on` (nokta + abone
 * sözcüğü), `busy` (tıklama işleniyor), `denied` (tarayıcı izni engellemiş —
 * sönük, başlığı sebebini söylüyor). Beşincisi `hidden`: tarayıcı push
 * desteklemiyorsa (iOS Safari sekmesi dahil) ya da VAPID açık anahtarı derleme
 * ortamında tanımlı değilse düğme HİÇ çizilmez — site bugünkü hâlinde kalır.
 *
 * ⚠️ **İzin penceresi yalnızca tıklamada açılır** (yol haritasındaki karar).
 * Kendiliğinden izin isteyen site, daha soru sorulmadan hayır demiş ziyaretçi
 * biriktirir.
 *
 * ⚠️ **Service worker mount'ta KURULMAZ.** `getRegistration` yalnızca var olanı
 * okur; kurulum (`register`) ilk aboneliğe kadar bekler. Aboneliği olmayan
 * ziyaretçi hiçbir ek yük taşımaz — sw.js isteği bile gitmez.
 *
 * POST düşerse tarayıcı aboneliği geri alınır: sunucunun bilmediği bir abonelik
 * tarayıcıda kalsaydı düğme "açık" gösterir ama bildirim hiç gelmezdi — yarım
 * kayıt iki tarafta da yok.
 */

type NotifyState = 'hidden' | 'idle' | 'busy' | 'on' | 'denied';

/* Derlemede satıra gömülüyor; tam ad kalıp olarak yazılmak zorunda. */
const VAPID_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

/*
  ⚠️ Kiracıda bildirim kapalı ve gerekçe beslemeninkiyle aynı (`feed.xml`):
  müşterinin ziyaretçisine ne zaman bildirim gideceğine bizim takvimimiz karar
  veremez. Env'in yokluğuna güvenilmiyor, kayıt karar veriyor — `SignInLink`teki
  aynı gerekçe.
*/
const NOTIFY_ALLOWED = activeTenant().features.notify;

function supported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

export function NotifyControl({ className = '' }: { readonly className?: string }) {
  const t = useDict();
  const lang = useLocale();
  const [state, setState] = useState<NotifyState>('hidden');

  useEffect(() => {
    if (!NOTIFY_ALLOWED || !VAPID_KEY || !supported()) return;

    let cancelled = false;
    (async () => {
      try {
        const registration = await navigator.serviceWorker.getRegistration('/');
        const sub = await registration?.pushManager.getSubscription();
        if (cancelled) return;
        if (sub) setState('on');
        else setState(Notification.permission === 'denied' ? 'denied' : 'idle');
      } catch {
        if (!cancelled) setState('idle');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  async function subscribe() {
    if (!NOTIFY_ALLOWED || !VAPID_KEY) return;
    setState('busy');
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setState(permission === 'denied' ? 'denied' : 'idle');
        return;
      }

      await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none',
      });
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidKeyBytes(VAPID_KEY),
      });

      const response = await fetch('/api/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...sub.toJSON(), lang }),
      });
      if (!response.ok) {
        await sub.unsubscribe();
        setState('idle');
        return;
      }
      setState('on');
    } catch {
      setState('idle');
    }
  }

  async function unsubscribe() {
    setState('busy');
    try {
      const registration = await navigator.serviceWorker.getRegistration('/');
      const sub = await registration?.pushManager.getSubscription();
      if (sub) {
        const endpoint = sub.endpoint;
        await sub.unsubscribe();
        try {
          await fetch('/api/push', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ endpoint }),
          });
        } catch {
          /* Sunucudaki kayıt ölü kaldı — gönderici 404/410'da budayacak. */
        }
      }
      setState('idle');
    } catch {
      /* Tarayıcı aboneliği duruyor olabilir; düğme açık kalsın, tekrar denenir. */
      setState('on');
    }
  }

  if (state === 'hidden') return null;

  const on = state === 'on';
  const tone =
    state === 'denied'
      ? 'text-white/30'
      : on
        ? 'text-white/70'
        : 'text-white/50 hover:text-white/70';

  return (
    <button
      type="button"
      onClick={on ? unsubscribe : state === 'idle' ? subscribe : undefined}
      disabled={state === 'busy' || state === 'denied'}
      title={state === 'denied' ? t.notify.blocked : undefined}
      aria-label={t.notify.aria}
      aria-pressed={on}
      className={`flex items-center gap-1.5 text-[9px] tracking-[0.18em] transition-colors ${tone} ${
        state === 'busy' ? 'opacity-60' : ''
      } ${className}`}
    >
      {on ? <span aria-hidden="true" className="size-1 rounded-full bg-white/60" /> : null}
      {on ? t.notify.active : t.notify.cta}
    </button>
  );
}
