'use client';

import { useState, useSyncExternalStore } from 'react';
import { useDict } from '@/i18n/LocaleProvider';
import { SIGNATURE_SIZE, signatureOf } from '@/lib/nose-signature';
import { clipFileName, pickClipType } from '@/lib/clip-format';

/**
 * Hareketli imza — hikâye boyutunda inen bir klip.
 *
 * Patron'un ikinci parçası. Paylaşılan her klip siteye kapı olduğu için
 * büyüme tarafı da var: kimsenin profil işareti böyle dönmüyor.
 *
 * ⚠️ **Klip tarayıcıda üretiliyor, sunucuda değil.** Video kodlamayı sunucuya
 * taşımak yeni bir işlem yükü, yeni bir kuyruk ve muhtemelen yeni bir servis
 * demekti; `MediaRecorder` aynı işi ziyaretçinin makinesinde yapıyor ve
 * dosya hiç ağa çıkmıyor.
 *
 * ⚠️ **Desteklenmeyen tarayıcıda düğme HİÇ çizilmiyor.** Basıldığında hiçbir
 * şey olmayan bir düğme, olmayan düğmeden kötü — bugün Google düğmesinde
 * bizzat yaşanmış bir hataydı.
 *
 * ⚠️ Ölçüler 720×1280: hikâye oranı (9:16) ve telefonda net. 1080×1920 de
 * çalışıyor ama zayıf makinelerde kare düşürüyor ve klip takılıyor.
 */
const WIDTH = 720;
const HEIGHT = 1280;
const SECONDS = 8;
const FPS = 30;

interface SignatureClipProps {
  readonly perfumeIds: readonly string[];
  readonly username: string;
}

export function SignatureClip({ perfumeIds, username }: SignatureClipProps) {
  const t = useDict();
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);

  /*
    ⚠️ Tarayıcı desteği `useSyncExternalStore` ile okunuyor — etkinin içinde
    durum yazarak değil (lint haklı olarak reddediyor) ve `useState`in tembel
    başlatıcısıyla da değil: o başlatıcı sunucuda `null`, istemcide biçim
    döndürür ve hidrasyon uyuşmazlığı doğardı. Bu kanca tam bu iş için var —
    sunucu anlık görüntüsü ayrı veriliyor.

    Destek hiç değişmediği için abone olan işlev boş; okuma her çizimde
    yapılıyor ve dize karşılaştırması kararlı.
  */
  const type = useSyncExternalStore(
    () => () => {},
    () => pickClipType(window.MediaRecorder),
    () => null,
  );

  const signature = signatureOf(perfumeIds);
  if (!signature || !type) return null;

  async function record() {
    setBusy(true);
    setProgress(0);

    const canvas = document.createElement('canvas');
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    const context = canvas.getContext('2d');
    if (!context) {
      setBusy(false);
      return;
    }

    const stream = canvas.captureStream(FPS);
    const recorder = new MediaRecorder(stream, { mimeType: type!, videoBitsPerSecond: 4_000_000 });
    const chunks: Blob[] = [];
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    };

    const done = new Promise<void>((resolve) => {
      recorder.onstop = () => resolve();
    });

    recorder.start();

    const scale = (WIDTH * 0.78) / SIGNATURE_SIZE;
    const cx = WIDTH / 2;
    const cy = HEIGHT / 2;
    const total = SECONDS * FPS;

    for (let frame = 0; frame < total; frame += 1) {
      const turn = (frame / total) * Math.PI * 2;

      context.fillStyle = '#050507';
      context.fillRect(0, 0, WIDTH, HEIGHT);

      for (const arc of signature!.arcs) {
        /* Her halka kendi hızında — ortak ritim yok; tarla kararının aynısı. */
        const own = turn * (0.6 + arc.radius / SIGNATURE_SIZE);
        for (const dot of arc.dots) {
          const dx = dot.x - SIGNATURE_SIZE / 2;
          const dy = dot.y - SIGNATURE_SIZE / 2;
          context.beginPath();
          context.arc(
            cx + (dx * Math.cos(own) - dy * Math.sin(own)) * scale,
            cy + (dx * Math.sin(own) + dy * Math.cos(own)) * scale,
            dot.r * scale,
            0,
            Math.PI * 2,
          );
          context.fillStyle = arc.color;
          context.globalAlpha = 0.45 + (arc.radius / SIGNATURE_SIZE) * 0.9;
          context.fill();
        }
      }

      context.globalAlpha = 1;
      context.fillStyle = 'rgba(255,255,255,0.45)';
      context.font = '28px system-ui, sans-serif';
      context.textAlign = 'center';
      context.fillText(username, cx, HEIGHT - 150);
      context.fillStyle = 'rgba(255,255,255,0.25)';
      context.font = '20px system-ui, sans-serif';
      context.fillText('O S M O S', cx, HEIGHT - 100);

      setProgress(Math.round(((frame + 1) / total) * 100));
      /* Kayıt gerçek zamanlı: her kare için bir çerçeve bekleniyor. */
      await new Promise((resolve) => setTimeout(resolve, 1000 / FPS));
    }

    recorder.stop();
    await done;

    const blob = new Blob(chunks, { type: type! });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = clipFileName(username, type);
    link.click();
    /* Adres serbest bırakılmazsa blob bellekte kalır — sekme kapanana kadar. */
    URL.revokeObjectURL(url);

    setBusy(false);
    setProgress(0);
  }

  return (
    <button
      type="button"
      onClick={record}
      disabled={busy}
      className="text-xs font-light text-white/40 transition-colors hover:text-white/70 disabled:opacity-60"
    >
      {busy ? `${t.studio.clipBusy} ${progress}%` : t.studio.clip}
    </button>
  );
}
