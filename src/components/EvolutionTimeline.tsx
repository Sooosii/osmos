'use client';

import { useMemo, useState } from 'react';
import { PERFUMES } from '@/data/perfumes';
import { EvolutionChart } from './EvolutionChart';

/**
 * `/evrim` doğrulama ekranı — 52 parfüm arasında gezinip eğri modelini sınamak.
 *
 * Çizelgenin kendisi artık burada değil, `EvolutionChart` içinde: parfüm
 * sayfası da aynı çizelgeyi kullanıyor ve iki kopya olsaydı biri düzeltilip
 * diğeri unutulduğunda sayfa ile doğrulama ekranı farklı şeyler gösterirdi.
 * Burada kalan tek şey seçici ve künye başlığı — ikisi de yalnızca bu ekrana ait.
 *
 * Kaydıraç parfüm değişince sıfırlanmıyor: iki parfümü **aynı dakikada**
 * karşılaştırmak bu ekranın asıl işi.
 */
export function EvolutionTimeline() {
  const [perfumeId, setPerfumeId] = useState(PERFUMES[0].id);

  const perfume = useMemo(
    () => PERFUMES.find((entry) => entry.id === perfumeId) ?? PERFUMES[0],
    [perfumeId],
  );

  return (
    <section className="w-full max-w-3xl">
      {/* Parfüm seçici — iki uç örneği karşılaştırmak için */}
      <div className="mb-12 flex flex-wrap gap-2">
        {PERFUMES.map((entry) => {
          const isActive = entry.id === perfume.id;
          return (
            <button
              key={entry.id}
              type="button"
              onClick={() => setPerfumeId(entry.id)}
              className={`rounded-full border px-4 py-1.5 text-xs tracking-wide transition-colors ${
                isActive
                  ? 'border-white/40 bg-white/10 text-white'
                  : 'border-white/10 text-white/40 hover:border-white/25 hover:text-white/70'
              }`}
            >
              {entry.name}
            </button>
          );
        })}
      </div>

      <header className="mb-10">
        <h1 className="text-4xl font-light tracking-tight text-white sm:text-5xl">
          {perfume.name}
        </h1>
        <p className="mt-2 text-sm tracking-wide text-white/40">
          {perfume.brand}
          {perfume.year ? ` · ${perfume.year}` : ''}
          {perfume.perfumer ? ` · ${perfume.perfumer}` : ''}
        </p>
        {perfume.line ? (
          <p className="mt-6 max-w-xl text-lg font-light leading-relaxed text-white/70">
            {perfume.line.en}
          </p>
        ) : null}
      </header>

      {/*
        Bilerek `key` YOK. `key={perfume.id}` çizelgeyi her seçimde sıfırdan
        kurar, kaydıraç 0'a düşerdi — oysa bu ekranın işi iki parfümü **aynı
        dakikada** karşılaştırmak. Kaydıraç kontrolsüz olduğu için örnek
        korununca topuz da yerinde kalıyor; değişen yalnızca notalar.
      */}
      <EvolutionChart perfume={perfume} />
    </section>
  );
}
