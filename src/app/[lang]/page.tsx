import { Suspense } from 'react';
import { PERFUMES, PERFUME_SPACES } from '@/data/perfumes';
import { buildMarks } from '@/lib/space-marks';
import { ScentSpaceCanvas } from '@/components/ScentSpaceCanvas';
import { Acilis } from '@/components/Acilis';
import { CursorGlitter } from '@/components/CursorGlitter';
import { getDict, localeFor } from '@/i18n/dict';
import { pageAlternates } from '@/lib/site-url';

/**
 * Koku Uzayı — sitenin kapısı.
 *
 * Hesap burada, sunucuda: benzerlik matrisi ve izdüşüm istemciye hiç inmiyor,
 * tarayıcıya yalnızca iki hazır uzay sahnesi gidiyor; aynı anda en fazla 52 nokta çiziliyor.
 *
 * Uzayın üstündeki tek kapı `Acilis`: atomizörün 240/120 karelik açılımı,
 * kaydırmayla ilerler ve doğrudan etkileşimli uzaya bırakır.
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
  const spaces = PERFUME_SPACES.map((space) => ({
    id: space.id,
    marks: buildMarks(space.perfumes, locale, { feelUniverse: PERFUMES }),
  }));

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

        Bu yüzden başlık kabukta: ham HTML'de de ekran okuyucunun ana sayfayı
        adlandırabilmesi gerekiyor.
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
      <div id="osmos-space-shell" inert aria-hidden="true" className="absolute inset-0">
        <Suspense fallback={null}>
          {/*
            Giriş metni tuvalin içine `children` olarak veriliyor; konumunu ve
            etkileşimli kontrollerle ortak düzenini `SpaceOverlays` kuruyor.

            Sunucu bileşeni olarak kalmaya devam ediyor: `children` istemcinin modül
            grafiğine girmiyor, sunucuda üretilip hazır çıktı olarak geçiyor. Yani
            `PERFUMES` hâlâ burada, sunucuda; tarayıcıya yalnızca bir sayı iniyor.
          */}
          <ScentSpaceCanvas spaces={spaces}>
            {/*
              Konumlandırma yok — sol üst köşeyi `SpaceOverlays` kuruyor.

              Eskiden burada `absolute left-6 top-6` vardı. Kaydıraçlar da aynı
              köşeye gelince metnin altında durmaları gerekti ve bunu piksel
              ofsetiyle yapmak kırılgandı: metin bir satır uzasa kaydıraçlar
              üstüne binerdi. İkisi artık tek bir sütunda, akışla diziliyor.
            */}
            <p className="text-xs tracking-[0.3em] text-white/50">{t.site.name}</p>
          </ScentSpaceCanvas>
        </Suspense>
      </div>

      {/* Açılış oturum ve hareket tercihlerini istemcide okur; adresle işi yok. */}
      <Acilis />

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
