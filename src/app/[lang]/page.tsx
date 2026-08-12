import { Suspense } from 'react';
import { PERFUMES } from '@/data/perfumes';
import { buildMarks } from '@/lib/space-marks';
import { introPoints } from '@/lib/intro-points';
import { ScentSpaceCanvas } from '@/components/ScentSpaceCanvas';
import { Acilis } from '@/components/Acilis';
import { CursorGlitter } from '@/components/CursorGlitter';
import { getDict, localeFor } from '@/i18n/dict';
import { pageAlternates } from '@/lib/site-url';

/**
 * Koku Uzayı — sitenin kapısı.
 *
 * Hesap burada, sunucuda: benzerlik matrisi ve izdüşüm istemciye hiç inmiyor,
 * tarayıcıya yalnızca 52 nokta gidiyor.
 *
 * Uzay doğrudan açılmıyor; kapının üç adımı var (`Acilis`):
 * astronot (kaydırmayla uğurlanıyor) → perde (kendiliğinden, 2.6 sn) →
 * yaklaşma sahnesi (`space-approach.ts`, kamera 0.14'ten 1'e).
 */
/*
  Başlık ve tarif kök düzenden geliyor; buradaki tek iş hreflang. Sitemap aynı
  bilgiyi ayrıca veriyor ve bu bir tekrar değil — arama motoru ikisini birden
  okuyor, sitemap tek başına yeterli sayılmıyor.
*/
export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  return { alternates: pageAlternates('/', localeFor((await params).lang)) };
}

export default async function Home({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const locale = localeFor(lang);
  const t = getDict(locale);

  // Küratör cümleleri sayfanın dilinde hesaplanıyor: nokta listesi sunucuda
  // kuruluyor ve istemciye hazır metin olarak iniyor.
  const marks = buildMarks(PERFUMES, locale);

  return (
    /*
     * `fixed inset-0` — akışta duran `h-dvh` bir blok değil.
     *
     * Akıştayken belge yüksekliğine katkı veriyordu ve birkaç piksellik taşma
     * dikey kaydırma çubuğunu getiriyordu: uzayın sağında, neredeyse tüm
     * yüksekliği kaplayan bir topuz — düz bir şerit gibi görünüyor. Uzayın
     * kayacak bir şeyi olmadığı için doğru yer akışın dışı; belge artık
     * uzayamıyor, çubuk da hiç çıkmıyor.
     *
     * Zemin rengi tuvalin kenar rengiyle aynı: tuval boyanana kadar geçen anda
     * renk sıçraması olmasın.
     */
    <main className="fixed inset-0 overflow-hidden bg-black text-white">
      {/*
        Sayfanın başlığı — görünmez, ve `Suspense`in DIŞINDA.

        ⚠️ İki kez ölçüldü (2026-08-12). Önce: kapıda **hiç başlık yoktu**,
        hiçbir düzeyde. Sonra ekranda zaten duran ad `h1` yapıldı ve tarayıcıda
        doğru göründü — ama üretim derlemesinin `en.html`inde **yine yoktu**.
        Sebep aşağıdaki sınır: uzay `useSearchParams` okuduğu için o alt ağaç
        statik üretimde istemciye erteleniyor, yani içine konan başlık ancak
        hidrasyondan sonra doğuyor.

        Bu yüzden başlık kabukta. Görünmez olması bir ödün değil: görünen ad
        yaklaşma sahnesi bitene kadar zaten ekranda yok, yani "gören ve
        görmeyen aynı şeyi okusun" burada zaten kurulamıyordu.
      */}
      <h1 className="sr-only">{t.space.heading}</h1>
      {/*
        Suspense şart, süs değil. Uzay `?mark=` parametresini okuyor
        (`useSearchParams`) ve o kanca, sınır olmadan bütün sayfayı istemci
        tarafına düşürüyor: üretim derlemesi "/" sayfasını önceden üretemeyip
        hata veriyor — ölçüldü, `npm run build` kırmızıydı.

        Sınır sayfanın statik kabuğunu (zemin, başlık) yerinde tutuyor; yalnızca
        adres parametresine bağlı olan tuval istemcide çözülüyor. Yedek boş:
        tuval zaten ilk kareyi istemcide çiziyor, araya bir iskelet koymak
        yanıp sönen ikinci bir görüntü olurdu.
      */}
      <Suspense fallback={null}>
        {/*
          Giriş metni tuvalin içine `children` olarak veriliyor, yanına kardeş
          olarak değil. Sebebi görünürlük: metin yaklaşma sahnesi boyunca yok,
          varışta yerine yerleşiyor — o kararı bilen tek yer tuval bileşeni.

          Sunucu bileşeni olarak kalmaya devam ediyor: `children` istemcinin modül
          grafiğine girmiyor, sunucuda üretilip hazır çıktı olarak geçiyor. Yani
          `PERFUMES` hâlâ burada, sunucuda; tarayıcıya yalnızca bir sayı iniyor.
        */}
        <ScentSpaceCanvas marks={marks}>
          {/*
            Konumlandırma yok — sol üst köşeyi `SpaceOverlays` kuruyor.

            Eskiden burada `absolute left-6 top-6` vardı. Kaydıraçlar da aynı
            köşeye gelince metnin altında durmaları gerekti ve bunu piksel
            ofsetiyle yapmak kırılgandı: metin bir satır uzasa kaydıraçlar
            üstüne binerdi. İkisi artık tek bir sütunda, akışla diziliyor.
          */}
          <div>
            <p className="text-xs tracking-[0.3em] text-white/50">{t.site.name}</p>
            <p className="mt-3 max-w-[15rem] text-xs leading-relaxed text-white/50">
              {t.space.intro(PERFUMES.length)}
            </p>
          </div>
        </ScentSpaceCanvas>
      </Suspense>

      {/*
        Açılış — astronot + perde, sırayla (sahibin seçimi, 2026-08-10).

        Suspense'in dışında: adres parametresiyle işi yok.
      */}
      <Acilis points={introPoints(marks)} />

      {/*
        İmleç tozu — sahibin isteği, yalnızca burada.

        Belge sayfalarında imlecin ardında parıltı okumayı bölerdi; uzay ise
        zaten bir sahne. Dokunmatikte ve `prefers-reduced-motion` altında
        kendini hiç çizmiyor (gerekçeler bileşende).
      */}
      <CursorGlitter />
    </main>
  );
}
