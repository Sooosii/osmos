import { fileURLToPath } from 'node:url';
import { configDefaults, defineConfig } from 'vitest/config';

/**
 * Vitest yapılandırması — tek işi `@/` takma adını çözmek.
 *
 * Bugüne kadar gerek yoktu: sınanan modüllerin hepsi yalnızca birbirini `./` ile
 * çağırıyordu ve `dither-field.ts` gibi bazıları "`@/` yoluna dokunmuyor, sınamalar
 * bu yüzden çalışıyor" diye başlığına yazmıştı bile. `note-measures.ts` o sınırı
 * ilk kez aşıyor: uçuculuk eğrisini `evolution.ts`ten alması gerekiyor ve o modül
 * `@/data/notes`ten besleniyor.
 *
 * Alternatif eğri formülünü ikinci kez yazmaktı — `evolution.ts` başlığındaki
 * "eğri modeli tek yerden ayarlanır, 136 notaya dokunmadan" sözünü bozardı.
 *
 * Takma adın kaynağı `tsconfig.json`daki `paths`; Vite onu kendiliğinden okumuyor,
 * o yüzden burada bir kez daha yazılıyor. İkisi ayrışırsa derleme geçer ama
 * sınamalar çözemez — değiştirirken ikisi birden.
 */
export default defineConfig({
  /*
    ⚠️ `leadgen/` kendi sınamalarını kendi çalıştırıcısıyla koşuyor
    (`cd leadgen && npm test`). Buradan dışlanmazsa Vitest'in varsayılan
    `.test.ts` süpürgesi onları da toplar ve sitenin sınama sayısı ağdan
    veri çeken betiklerle karışır.

    ⚠️ Bu yorumda joker kalıbı AÇIKÇA yazılmıyor: içindeki yıldız-eğik
    ikilisi blok yorumu tam orada kapatıyor ve dosyanın geri kalanı kod
    sanılıyor. Bir kez yaşandı, yapılandırma hiç yüklenmedi.
  */
  test: {
    exclude: [...configDefaults.exclude, 'leadgen/**'],
  },
  resolve: {
    /*
      ⚠️ İkinci takma ad `server-only` paketi için ve gerekçesi
      `vitest/server-only-stub.ts`in başında: paket sunucu koşulu
      seçilmediğinde fırlatıyor, Vitest de o ayrımı yapmıyor. Koruma
      kaldırılmadı — yalnızca sınamada boş bir modülle değiştirildi.
    */
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      'server-only': fileURLToPath(new URL('./vitest/server-only-stub.ts', import.meta.url)),
    },
  },
});
