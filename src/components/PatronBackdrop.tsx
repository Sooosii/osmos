'use client';

import { useEffect, useRef } from 'react';
import { SIGNATURE_SIZE, signatureOf } from '@/lib/nose-signature';
import type { Perfume } from '@/data/types';

/**
 * Patron'un dönen takımyıldız zemini.
 *
 * ⚠️ **Yeni bir görsel dil icat edilmedi: zemin, imzanın kendisi.** Büyütülmüş,
 * sönükleştirilmiş ve çok yavaş dönen hâli. İkinci bir desen uydurmak, kişiye
 * ait iki farklı işaret üretmek olurdu — oysa imza zaten "bu kişi" demek.
 * Aynı tarif (`signatureOf`) üç yerde kullanılıyor: profildeki SVG, paylaşım
 * kartındaki daireler ve burası.
 *
 * ⚠️ **Okunabilirlik zeminden önce gelir.** Opaklık bilerek çok düşük ve
 * noktalar bulanık: arkada bir şey döndüğü hissediliyor ama üstündeki yazı
 * hiçbir yerde zorlaşmıyor. Doygun renkleri geniş alana yaymanın göz
 * yorduğu bu depoda bir kez ölçülmüştü (`dither-field` kararı).
 *
 * ⚠️ `motion-reduce` sözü tutuluyor: hareketi kapatmış birine sürekli dönen
 * bir zemin göstermek, sitenin başka yerlerinde verilmiş sözü bozmak olurdu.
 * O durumda desen duruyor — kayboluyor değil, donuyor.
 */
export function PatronBackdrop({ perfumes }: { readonly perfumes: readonly Perfume[] }) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;

    const signature = signatureOf(perfumes);
    if (!signature) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let frame = 0;
    let raf = 0;

    /*
      Tampon pencereyle birlikte yeniden kuruluyor. Kurulmasaydı CSS eski
      tamponu gerdirir ve noktalar yumurtaya dönerdi — açılış tarlasında
      ölçülmüş ve düzeltilmiş bir hata (`setupBg`).
    */
    const setup = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = () => {
      const dpr = window.devicePixelRatio || 1;
      const width = canvas.width / dpr;
      const height = canvas.height / dpr;

      context.clearRect(0, 0, width, height);

      /* Desen ekranın kısa kenarına oturuyor ve taşacak kadar büyük. */
      const scale = (Math.min(width, height) * 1.6) / SIGNATURE_SIZE;
      const cx = width / 2;
      const cy = height / 2;
      const spin = still ? 0 : frame * 0.00012;

      for (const arc of signature.arcs) {
        /*
          Her halka kendi hızında dönüyor: hepsi aynı hızda dönseydi desen
          tek parça bir levha gibi kayardı ve "tak tak" ritmi doğardı —
          açılış tarlasında bizzat sınanan bir şikâyet.
        */
        const own = spin * (0.6 + arc.radius / SIGNATURE_SIZE);

        for (const dot of arc.dots) {
          const dx = dot.x - SIGNATURE_SIZE / 2;
          const dy = dot.y - SIGNATURE_SIZE / 2;
          const x = cx + (dx * Math.cos(own) - dy * Math.sin(own)) * scale;
          const y = cy + (dx * Math.sin(own) + dy * Math.cos(own)) * scale;

          /*
            ⚠️ **Konum ölçekleniyor, ÇAP ölçeklenmiyor** — ikisini birden
            ölçeklemek ölçülerek görülmüş bir hataydı: `scale` ekran boyuna
            göre ~12 çıkıyor ve 2 piksellik noktalar 25 piksellik lekelere
            dönüşüyordu. Ekranda yıldız alanı değil puanlı desen vardı ve
            içerikle yarışıyordu.

            Çap sabit ve küçük: desen seyrek, ince ve arkada kalıyor.
            Küçük nokta daha az mürekkep demek, o yüzden opaklık biraz
            yüksek — yine de yazının okunmasını zorlamıyor.
          */
          context.beginPath();
          context.arc(x, y, dot.r * 1.6, 0, Math.PI * 2);
          context.fillStyle = arc.color;
          context.globalAlpha = 0.5;
          context.fill();
        }
      }
      context.globalAlpha = 1;
    };

    const loop = () => {
      frame += 1;
      draw();
      raf = requestAnimationFrame(loop);
    };

    setup();
    draw();
    if (!still) raf = requestAnimationFrame(loop);

    const onResize = () => {
      setup();
      draw();
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
    };
  }, [perfumes]);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      /*
        ⚠️ `z-0`, `-z-10` DEĞİL — ölçülerek bulundu. Negatif katmanda tuval
        `main`in **opak siyah arka planının arkasına** düşüyor ve hiç
        görünmüyordu: tuvalde boyalı piksel vardı, ekranda hiçbir şey yoktu.
        Opaklığı yükseltmek de işe yaramamıştı, çünkü sorun opaklık değildi.

        `fixed`: sayfa kaydırılırken zemin duruyor, içerik üstünden geçiyor
        (`ScreenFrame` içeriği zaten `z-10`). `pointer-events-none` — zemin
        hiçbir tıklamayı yutmuyor.
      */
      className="pointer-events-none fixed inset-0 z-0 h-full w-full"
    />
  );
}
