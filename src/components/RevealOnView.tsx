'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Çocuklarını ancak görüş alanına girdiklerinde açar.
 *
 * Komşu çemberi sayfanın altında duruyor. CSS animasyonu sayfa yüklenir yüklenmez
 * başladığı için kullanıcı oraya kaydırdığında dağılma çoktan bitmiş oluyordu —
 * yani efekt vardı ama kimse göremiyordu. Ölçmeden fark edilmeyecek bir kusur:
 * geliştirici bölümü zaten açık ekranda görüyor.
 *
 * Neden ayrı ve minik bir istemci bileşeni: `NeighborMap` sunucuda kalmalı, yoksa
 * 44×44'lük benzerlik motoru tarayıcı paketine iner (`space-marks.ts:11-13`).
 * Sarmalayıcı yalnızca bir sınıf ekliyor; veri ve hesap sunucuda kalıyor.
 *
 * JavaScript inmezse `IntersectionObserver` hiç çalışmaz ve içerik görünür kalır:
 * başlangıç durumu "açık", efekt yalnızca bir ekleme. Bozulduğunda içeriği gizleyen
 * bir çözüm kabul edilemezdi.
 */
interface RevealOnViewProps {
  readonly children: React.ReactNode;
  /**
   * Bölümün ne kadarı görününce başlasın.
   *
   * Neredeyse sıfır: ilk piksel görününce başlasın istiyoruz. Yüksek bir eşik
   * (0.25 gibi) çemberin bir kısmı zaten ekrandayken tetiklerdi ve kullanıcı
   * dağılmanın başladığı anı değil ortasını görürdü.
   */
  readonly threshold?: number;
}

export function RevealOnView({ children, threshold = 0.01 }: RevealOnViewProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Tarayıcı desteklemiyorsa hiçbir şey yapmıyoruz: `data-shown` "false" kalır,
    // CSS kuralı yalnızca "true"da animasyon EKLEDİĞİ için komşular yerlerinde
    // görünür durur. Burada setState çağırmak da gereksizdi — efekt gövdesinde
    // senkron setState zincirleme render tetikler (lint kuralı bunu yakaladı).
    if (typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShown(true);
          // Tek seferlik: her kaydırışta yeniden oynasa süse dönerdi.
          observer.disconnect();
        }
      },
      { threshold },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [threshold]);

  return (
    <div ref={ref} data-shown={shown ? 'true' : 'false'} className="group/reveal">
      {children}
    </div>
  );
}
