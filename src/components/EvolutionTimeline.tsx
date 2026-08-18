'use client';

import { useMemo, useState } from 'react';
import type { Perfume } from '@/data/types';
import { EvolutionChart } from './EvolutionChart';
import { useLocale } from '@/i18n/LocaleProvider';
import { say } from '@/i18n/dict';

/**
 * `/evolution` doğrulama ekranı — 52 parfüm arasında gezinip eğri modelini sınamak.
 *
 * Çizelgenin kendisi artık burada değil, `EvolutionChart` içinde: parfüm
 * sayfası da aynı çizelgeyi kullanıyor ve iki kopya olsaydı biri düzeltilip
 * diğeri unutulduğunda sayfa ile doğrulama ekranı farklı şeyler gösterirdi.
 * Burada kalan tek şey seçici ve künye başlığı — ikisi de yalnızca bu ekrana ait.
 *
 * Kaydıraç parfüm değişince sıfırlanmıyor: iki parfümü **aynı dakikada**
 * karşılaştırmak bu ekranın asıl işi.
 *
 * ⚠️ **Katalog PROP olarak geliyor, `@/data/perfumes`ten ithal EDİLMİYOR.**
 * Bu dosya `'use client'` ve o modülü ithal ettiği sürece paketleyici bütün
 * katalogları — OSMOS'un 154 kaydını ve her kiracının katalogunu — tarayıcıya
 * inen ortak bir parçaya koyuyordu (`perfumes.ts` ternary'sinin iki dalı da
 * statik). Ölçüldü (2026-08-17): kiracı derlemesinde
 * `/_next/static/chunks/000-*.js` 100 KB'lık bir dosyaydı ve içinde OSMOS'un
 * elle yazılmış küratör cümleleri iki dilde duruyordu — müşterinin alan
 * adından, tek istekle, herkese açık. Prop'a çevrilince veri artık sayfanın
 * RSC yüküne giriyor, yani her site yalnızca kendi katalogunu taşıyor.
 * **Buraya `@/data/perfumes` ithali geri konursa sızıntı da geri gelir**;
 * `kiraci-sizinti.test.ts` bunu tutuyor.
 */
export function EvolutionTimeline({ perfumes }: { perfumes: readonly Perfume[] }) {
  const locale = useLocale();
  const [perfumeId, setPerfumeId] = useState(perfumes[0].id);

  const perfume = useMemo(
    () => perfumes.find((entry) => entry.id === perfumeId) ?? perfumes[0],
    [perfumes, perfumeId],
  );

  return (
    <section className="w-full max-w-3xl">
      {/* Parfüm seçici — iki uç örneği karşılaştırmak için */}
      <div className="mb-12 flex flex-wrap gap-2">
        {perfumes.map((entry) => {
          const isActive = entry.id === perfume.id;
          return (
            <button
              key={entry.id}
              type="button"
              onClick={() => setPerfumeId(entry.id)}
              className={`rounded-full border px-4 py-1.5 text-xs tracking-wide transition-colors ${
                isActive
                  ? 'border-white/40 bg-white/10 text-white'
                  : 'border-white/10 text-white/50 hover:border-white/25 hover:text-white/70'
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
        <p className="mt-2 text-sm tracking-wide text-white/50">
          {perfume.brand}
          {perfume.year ? ` · ${perfume.year}` : ''}
          {perfume.perfumer ? ` · ${perfume.perfumer}` : ''}
        </p>
        {perfume.line ? (
          <p className="mt-6 max-w-xl text-lg font-light leading-relaxed text-white/70">
            {say(perfume.line, locale)}
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
