import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PERFUMES, getPerfumeSpaceId } from '@/data/perfumes';
import { dominantFamily, getFamily } from '@/data/families';
import { familyVector } from '@/lib/similarity';
import { characterOf } from '@/lib/perfume-character';
import { AddToTopFour } from '@/components/AddToTopFour';
import { CharacterAxes } from '@/components/CharacterAxes';
import { EvolutionSignature } from '@/components/EvolutionSignature';
import { Neighbors } from '@/components/Neighbors';
import { PerfumeNotes } from '@/components/PerfumeNotes';
import { ScreenFrame, type FrameReadout } from '@/components/ScreenFrame';
import { KaynakKunyesi } from '@/components/KaynakKunyesi';
import { SaticiBaglantisi } from '@/components/SaticiBaglantisi';
import { ShelfPicker } from '@/components/ShelfPicker';
import { getDict, localeFor, say } from '@/i18n/dict';
import { withLocale } from '@/i18n/locale';
import { aktifDiller } from '@/lib/tenant';
import { pageAlternates } from '@/lib/site-url';
import { searchForPerfume } from '@/lib/space-navigation';

/**
 * Parfüm sayfası — yol haritasının ①, ②, ③ ve ④'ü. Tamamı.
 *
 *   ①  isim + marka + künye + küratör cümlesi ← yalnızca duygu (bir de kimlik)
 *          ↓
 *   ②③ evrim imzası                          ← altındaki veri, kendi kendine dönen
 *          ↓
 *   ④  uzaydaki komşular                     ← "peki buna benzeyen ne var?"
 *
 * ② ile ③ tek bir şeyde birleşti: imza, çizelgenin başka bir hâli. Kaydıraç yok —
 * biçim ve zaman 12 saniyelik bir turda hiç durmadan dönüyor (`EvolutionSignature`).
 * Kaydıraçlı çizelge `/evolution` doğrulama ekranında duruyor; orası iki parfümü aynı
 * dakikada karşılaştırmak için var.
 *
 * ④ ikiye ayrıldı. Komşular geldi: hiç durmadan dönen üç boyutlu bir takımyıldız.
 * Yarıçap benzerlik, yükseklik `depth` — uzayın iki boyuta sığdıramadığı üçüncü
 * bileşen. Konumlar uzaydaki gerçek yerler DEĞİL; "en benzeyen en yakında dursun"
 * garantisiyle gerçek konumlar aynı anda mümkün olmuyordu (ölçüldü: örtüşme
 * 3.16/5) ve kullanıcı garantiyi seçti. Karar geçmişi `lib/neighbor-orbit.ts`te.
 *
 * ④'ün öbür yarısı **künye** de geldi. Bir kez ertelenmişti: o günkü 44 parfümün
 * 23'ünde parfümör, 18'inde yıl yoktu. Veri elle tamamlandı; yıl artık her kayıtta
 * dolu ve `types.ts` bunu zorunlu kılarak koruyor. Marka parfümörü açıklamadığında
 * satır tek başına yıla düşüyor; tahminle isim eklenmiyor.
 *
 * Renk uzaydaki noktanın renginden **türetilmiyor, aynı zincirden geliyor**:
 * `familyVector → dominantFamily → getFamily().color`. İkinci bir kaynak
 * açsaydık harita bir renk, sayfa başka bir renk gösterebilirdi — oysa sayfanın
 * uzaydaki noktayla aynı renkte olması haritanın kendini doğrulaması demek.
 */

/*
  ⚠️ **Bilinmeyen kimlik rotaya hiç girmiyor.** `dynamicParams = false`, listede
  olmayan bir kimliği eşleşmeyen adres hâline getiriyor: iş `app/global-not-found.tsx`e
  geçiyor, yani sitenin kendi 404'ü, doğru dilde, gerçek 404 durum koduyla.

  Ölçüldü: bu satır olmadan da ekranda **doğru sayfa** çıkıyor — `notFound()` da
  aynı yere düşüyor. Fark maliyette: satır yokken `/perfume/yok` gibi her uydurma
  adres için sunucu sayfayı baştan çizip sonra atıyor. Satır varken çizim hiç
  başlamıyor.

  Bedeli yok: parfümlerin tamamı derleme anında biliniyor, sonradan parfüm
  eklenmesi zaten yeni bir derleme demek. Aşağıdaki `notFound()` kalıyor:
  tipi daraltan şey o (`find` `undefined` da dönebiliyor).
*/
export const dynamicParams = false;

/*
  Tam bileşim döndürülüyor (`{ lang, id }`), yalnızca `{ id }` değil. İç içe
  biçim de çalışıyor ama bu hâli tek başına okunabilir ve derlemede sayı
  doğrulanabilir: 150 × 2.
*/
export function generateStaticParams() {
  return aktifDiller().flatMap((lang) => PERFUMES.map((perfume) => ({ lang, id: perfume.id })));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; id: string }>;
}) {
  const { lang, id } = await params;
  const perfume = PERFUMES.find((entry) => entry.id === id);
  if (!perfume) return {};

  const locale = localeFor(lang);
  const t = getDict(locale);
  return {
    title: t.perfume.title(perfume.name, perfume.brand),
    description: perfume.line
      ? say(perfume.line, locale)
      : t.perfume.fallbackDescription(perfume.name, perfume.brand),
    alternates: pageAlternates(`/perfume/${id}`, locale),
  };
}

export default async function PerfumePage({
  params,
}: {
  params: Promise<{ lang: string; id: string }>;
}) {
  const { lang, id } = await params;
  const perfume = PERFUMES.find((entry) => entry.id === id);
  if (!perfume) notFound();

  const locale = localeFor(lang);
  const t = getDict(locale);

  const family = getFamily(dominantFamily(familyVector(perfume)));
  const color = family.color;
  const spaceSearch = searchForPerfume(getPerfumeSpaceId(perfume.id), perfume.id);

  /*
    Çerçevedeki üçü de parfümün künyesi (`ScreenFrame.tsx`: uydurma sayı yok).
    Aile aynı zamanda sayfanın rengini açıklıyor — tepedeki ışığın neden o renk
    olduğu başka hiçbir yerde yazmıyor.

    ⚠️ `toUpperCase()`, `toLocaleUpperCase('tr')` DEĞİL — ve bu bir devrilme.
    İlk karar 'tr' idi ("ÇIÇEKSI bozuk görünüyor" diye); sahip 2026-08-10'da
    tersini koydu: noktalı büyük İ sitede HİÇ görünmeyecek ("İ bunu görmiyim,
    her yerden düzelt"). İngiliz kuralı i'yi I yapar — istenen tam bu.
    Aynı kural bütün `uppercase` sınıflarında kendiliğinden işliyor, çünkü
    belge `lang="en"`.
  */
  /*
    ⚠️ **FAMILY ve YEAR şeritten KALDIRILDI** (sahip, 2026-08-15: "bunlar
    yazmasın, telefonda göz yoruyor, kalabalık yapıyor"). Veri kaybolmuyor —
    ikisi de sayfanın gövdesinde zaten duruyor: yıl parfümör satırında
    ("Ilias Ermenidis, 2019"), aile hem sayfanın tepesindeki ışıkta hem
    evrim çizelgesinin altındaki aile noktalarında. Şeritte tekrar
    ediyorlardı ve 390 px'te üst satırın çoğunu onlar yiyordu.

    Geri istenirse iki satır; sözlükteki `frame.family` ve `frame.year`
    anahtarları bu yüzden silinmedi.
  */
  const readouts: readonly FrameReadout[] = [
    { label: t.perfume.frame.notes, value: String(perfume.notes.length) },
  ];

  const index = PERFUMES.findIndex((entry) => entry.id === id) + 1;
  const position = t.perfume.position(index, PERFUMES.length);

  return (
    <main className="min-h-dvh bg-[#050507] text-white">
      {/*
        Aile rengi sayfanın tepesinde ince bir ışık olarak duruyor: uzaydan
        gelen göz aynı rengi görüp "doğru yerdeyim" diyor. Fotoğraf yok —
        temel kural; rengin kendisi görsel imzanın ilk katmanı.
      */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 top-0 h-[45vh] opacity-25"
        style={{ background: `radial-gradient(60% 100% at 50% 0%, ${color}, transparent 70%)` }}
      />

      {/*
        Açılış perdesi — uzaydan gelen geçişin ikinci yarısı.
        Uzay tuvali aile rengiyle tamamen kapanıyor, bu sayfa aynı renkten
        açılıp sönüyor. Arada beklenen bir kare yok: sayfa statik üretiliyor ve
        seçim anında önceden çekiliyor, dolayısıyla perde kalktığında içerik
        zaten yerinde duruyor.

        Doğrudan bu adrese gelen biri için de tutarlı bir giriş oluyor.
      */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-50"
        style={{
          backgroundColor: color,
          animation: 'osmos-reveal 320ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
        }}
      />

      <ScreenFrame
        nav={
          <nav className="flex items-center gap-3 text-[10px] tracking-[0.3em] text-white/50">
            {/*
              `?mark=` uzayın o parfümü seçili açması için. Tarayıcının geri tuşu
              da aynı yere düşüyor; iki yol tek davranışta buluşuyor.
            */}
            <Link
              href={`${withLocale(locale, '/')}${spaceSearch}`}
              /* Çerçeve bağlantısı: önden getirilmiyor, gerekçe `LangSwitch`te. */
              prefetch={false}
              className="transition-colors hover:text-white"
            >
              {t.site.name}
            </Link>
            <span aria-hidden="true" className="text-white/20">
              ·
            </span>
            <Link
              href={withLocale(locale, '/notes')}
              /* Çerçeve bağlantısı: önden getirilmiyor, gerekçe `LangSwitch`te. */
              prefetch={false}
              className="transition-colors hover:text-white"
            >
              {t.nav.notes}
            </Link>
          </nav>
        }
        readouts={readouts}
        status={position}
        tail={perfume.brand.toUpperCase()}
      >
        <div className="relative mx-auto max-w-3xl px-6 sm:px-10">
          {/*
            ① — sadece duygu.

            Eskiden `min-h-[60vh]` ile ekranın tamamını yiyordu ve notaları
            görmek için kaydırmak gerekiyordu: basılı tutup geçen biri boş bir
            ekrana düşüyordu. Artık isim, cümle ve çizelge aynı ekranda —
            geçişin bittiği yerde aradığın şey duruyor.
          */}
          <header className="pt-8 sm:pt-14">
            <p className="text-sm tracking-[0.2em] text-white/50">
              {perfume.brand.toUpperCase()}
            </p>
            <h1 className="mt-3 text-4xl font-light leading-[1.05] tracking-tight sm:text-6xl">
              {perfume.name}
            </h1>
            {/*
              Künye — kim, ne zaman. Yeri ve biçimi ekranda üç seçenek yan yana
              çizilip seçildi; gerekçeler `specs/2026-08-05-kunye-design.md`te.

              İsmin hemen altında duruyor çünkü künye kimliğin parçası: adı okuyan
              göz burnu ve yılı da alıp sonra cümleye geçiyor.

              `perfumer` yoksa satır tek başına yıla düşüyor ve bu bilinçli.
              Marka ürüne özgü bir isim açıklamadığında "bilinmiyor" yazmak da
              uydurmak da reddedildi.
            */}
            <p className="mt-4 text-sm font-light text-white/50">
              {perfume.perfumer ? `${perfume.perfumer}, ` : ''}
              {perfume.year}
            </p>
            {/*
              "Nerede bulunur" — künyenin son satırı; yerini sahip seçti
              ("kesin künyede", 2026-08-11). Parfümör satırından bir ton daha
              sönük: künyenin parçası ama kimliğin değil.

              Veri yoksa satır yok — retailers'ı boş olan sayfa bugünkü
              hâlinde duruyor.

              ⚠️ `rel="sponsored"` pazarlık dışı: komisyonlu bağlantının arama
              motoruna beyanı bu; yoksa cezası siteye yazar. `nofollow` eski
              robotlar için eşlikçisi, `noopener` yeni sekmenin güvenliği.
            */}
            {perfume.retailers?.length ? (
              <p className="mt-2 text-sm font-light text-white/40">
                {t.perfume.whereToFind}
                {' — '}
                {perfume.retailers.map((retailer, index) => (
                  <span key={retailer.name}>
                    {index > 0 ? ' · ' : ''}
                    {/*
                      ⚠️ `whitespace-nowrap`: satır birden çok satıcı taşıdığında
                      telefonda sarıyor ve ok, adından kopup alt satıra tek
                      başına düşüyordu (390 px'te ölçüldü). Ad ile oku aynı
                      parçada tutuyor; satır yine sarıyor, ama satıcı adları
                      bütün kalıyor. Sınıf artık `SaticiBaglantisi` içinde.

                      ⚠️ Bağlantı bir istemci bileşenine çıkarıldı çünkü
                      tıklaması SAYILIYOR (`/api/tiklama`). Sayılan şey
                      müşteriye satılan sözün kendisi: harita ziyaretçiyi onun
                      ürün sayfasına bırakıyor mu, kaç kez. Yıllık yenileme
                      ücretinin arkasındaki tek rakam bu.

                      ⚠️ Katalog istemciye PROP geçiyor, ithal EDILMIYOR —
                      `kiraci-sizinti.test.ts`in tuttuğu kural.
                    */}
                    <SaticiBaglantisi
                      perfumeId={perfume.id}
                      name={retailer.name}
                      url={retailer.url}
                    />
                  </span>
                ))}
              </p>
            ) : null}
            {perfume.line ? (
              <p className="mt-5 max-w-xl text-base font-light leading-relaxed text-white/70 sm:text-lg">
                {say(perfume.line, locale)}
              </p>
            ) : null}

            {/*
              Künyenin son satırı: giriş yapmış ziyaretçi için "dörtlüme
              ekle". Girişsizde HİÇ çizilmiyor — sayfa bugünkü hâlinde
              kalıyor ve üyelik daveti köşede duruyor, her parfümde değil.
              Sayfa statik; oturum tarayıcıda çözülüyor (gerekçe bileşende).
            */}
            <AddToTopFour perfumeId={perfume.id} />

            {/*
              Raflar — dörtlüden ayrı bir soru. Top 4 "en sevdiğin dört şey
              ne", raf "elinde ne var". Altında duruyor çünkü sırası o:
              önce iddia, sonra kayıt.
            */}
            <ShelfPicker perfumeId={perfume.id} />
          </header>

          {/* ③ — "aa, o aslında veriymiş" */}
          <section className="pt-14">
            <h2 className="mb-8 text-xs tracking-[0.3em] text-white/50">
              {t.perfume.sections.evolution}
            </h2>
            <EvolutionSignature perfume={perfume} />
          </section>

          {/*
            Karakter — "peki bu nasıl bir şey?"

            Sahip yakaladı: notaların dört ekseni vardı, parfümlerin yoktu.
            Hesap aslında hep vardı (`characterVector`, uzayın izdüşümünü ve
            burun raporunu o sürüyor); eksik olan tek şey burada GÖSTERİLMESİydi.

            Yeri bilerek notaların HEMEN ÜSTÜ: aynı cetvelle çizilmiş iki blok
            alt alta duruyor ve okur "parfüm şurada, malzemeleri şurada" diye
            bakabiliyor. Evrimden sonra geliyor çünkü sıra "nasıl hareket eder"
            → "nasıl bir şeydir" → "neyden yapılmış".
          */}
          <section className="pt-20">
            <h2 className="mb-4 text-xs tracking-[0.3em] text-white/50">
              {t.perfume.sections.character}
            </h2>
            <p className="mb-8 max-w-prose text-sm font-light leading-relaxed text-white/40">
              {t.perfume.characterNote}
            </p>
            <CharacterAxes character={characterOf(perfume)} color={color} t={t} />
          </section>

          {/*
            ⑤ — "peki bunun içinde ne var?"

            Aşama 3'te geldi. Eskiden bu sayfa notalarını hiç listelemiyordu:
            notalar siteye yalnızca imzadaki etiketler olarak giriyordu ve
            tıklanmıyorlardı. Ansiklopedinin birinci kapısı burası.

            Neden imzadaki etiketler değil de duran bir liste — gerekçe
            `PerfumeNotes.tsx`te; kısası, imzanın etiketleri turun bir bölümünde
            tamamen görünmez oluyor ve görünmez bir link yarı zamanlı bir tuzak.
          */}
          <section className="pt-20">
            <h2 className="mb-8 text-xs tracking-[0.3em] text-white/50">
              {t.perfume.sections.notes}
            </h2>
            <PerfumeNotes perfume={perfume} lang={lang} />
          </section>

          {/* ④ — "peki buna benzeyen ne var?" */}
          <section className="pt-20">
            <h2 className="mb-8 text-xs tracking-[0.3em] text-white/50">
              {t.perfume.sections.neighbours}
            </h2>
            <Neighbors perfume={perfume} lang={lang} />

            {/*
              Kendi adresi olan uzun listeye kapı. Bağlantı olmadan o sayfalar
              öksüz kalırdı: yalnızca sitemap'ten bulunurlar, okur hiç
              görmezdi. Buradaki takımyıldız beş komşuyu gösteriyor ve neden
              benzediklerini söylemiyor — orada sekiz komşu ve paylaşılan
              notalar var.
            */}
            <p className="mt-8">
              <Link
                href={withLocale(locale, `/similar/${perfume.id}`)}
                className="text-sm font-light text-white/50 transition-colors hover:text-white/80"
              >
                {t.similar.open} →
              </Link>
            </p>
          </section>

          <footer className="mt-24 space-y-5">
            {/*
              Komisyon dipnotu — yasal beyan, yalnızca satıcı satırı olan
              sayfada. Sayfanın en sönük yazısı: söylenmek zorunda, ama
              bağırmak zorunda değil.
            */}
            {perfume.retailers?.length ? (
              <p className="text-xs font-light text-white/30">
                {t.perfume.commissionNote}
              </p>
            ) : null}
            <p>
              <Link
                href={`${withLocale(locale, '/')}${spaceSearch}`}
                className="text-sm font-light text-white/50 transition-colors hover:text-white/80"
              >
                {t.nav.backToSpace}
              </Link>
            </p>
            {/*
              Kaynak künyesi — yalnız kiracıda çiziliyor, osmos.me'de null.
              Sayfanın en dibi ve en sönük satırı; yerini sahip seçti.
            */}
            <KaynakKunyesi lang={locale} />
          </footer>
        </div>
      </ScreenFrame>
    </main>
  );
}
