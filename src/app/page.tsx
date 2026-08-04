import { Suspense } from 'react';
import { PERFUMES } from '@/data/perfumes';
import { buildMarks } from '@/lib/space-marks';
import { ScentSpaceCanvas } from '@/components/ScentSpaceCanvas';

/**
 * Koku Uzayı — sitenin kapısı.
 *
 * Hesap burada, sunucuda: benzerlik matrisi ve izdüşüm istemciye hiç inmiyor,
 * tarayıcıya yalnızca 44 nokta gidiyor.
 *
 * Açılış sahnesi (hero-scrub) Aşama 2'ye ait; şimdilik uzay doğrudan açılıyor.
 */
export default function Home() {
  const marks = buildMarks(PERFUMES);

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
    <main className="fixed inset-0 overflow-hidden bg-[#050507] text-white">
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
          <div className="absolute left-6 top-6 sm:left-10 sm:top-10">
            <p className="text-xs tracking-[0.3em] text-white/30">OSMOS</p>
            <p className="mt-3 max-w-[15rem] text-xs leading-relaxed text-white/25">
              {PERFUMES.length} parfüm, konumları nota akrabalığından hesaplandı.
              Sürükle, yakınlaş, bir noktaya dokun.
            </p>
          </div>
        </ScentSpaceCanvas>
      </Suspense>
    </main>
  );
}
