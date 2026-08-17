import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /*
    ⚠️ Service worker HTTP önbelleğine takılmamalı. Tarayıcı `sw.js`i http
    önbelleğinden tazeleyebiliyor; bu başlık olmadan eski çalışan günlerce
    takılı kalır ve bunu kimse görmez — bildirim düşmez, hata da görünmez.
    Kayıt tarafındaki `updateViaCache: 'none'` (NotifyControl) tek başına
    yetmiyor: o yalnızca kayıt anındaki denetimi kapsıyor.
  */
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [{ key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' }],
      },
      /*
        Güvenlik başlıkları.

        ⚠️ **Asıl olan `frame-ancestors`.** Ölçüldü (2026-08-17): canlıda tek
        güvenlik başlığı `Strict-Transport-Security`di — yani site herhangi bir
        sayfada iframe'e alınabiliyordu. Bunu bugün önemli yapan şey hesapların
        canlıda AÇILMIŞ olması (`/signin`, `/settings`, `/studio` 200 dönüyor):
        çerçeveye alınmış bir `/settings`te giriş yapmış kullanıcıya istemediği
        bir şeyi tıklatmak mümkündü. 12 Ağustos denetimi hesaplar kapalıyken
        yapıldığı için bu ölçülmemişti.

        ⚠️ `X-Frame-Options` ve CSP `frame-ancestors` birlikte yazılıyor:
        ikincisi modern tarayıcıda ötekini eziyor, birincisi eski tarayıcı için
        duruyor. CSP'nin tamamı (script-src vb.) bilerek YOK — Next'in satır içi
        betikleri nonce ister ve yanlış kurulmuş bir CSP siteyi sessizce kırar.
        XSS yüzeyi zaten ölçülmüş ve pratikte sıfır (`dangerouslySetInnerHTML`,
        `eval`, `innerHTML` hiçbir yerde yok); buradaki üç başlık savunma
        derinliği, tek dayanak değil.
      */
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: "frame-ancestors 'none'" },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
  experimental: {
    /*
      Haritada olmayan adreslerin sayfası `app/global-not-found.tsx`.

      ⚠️ Bu bayrak bir tercih değil zorunluluk. Kök düzenimiz üst düzey bir
      dinamik segmentte (`app/[lang]/layout.tsx`) duruyor ve Next'in kendi
      belgesi bu durumu adıyla anıyor: öyle bir yapıda `not-found.tsx` sınırı
      eşleşmeyen adresleri yakalayamıyor, `global-not-found` tam bu iki durum
      için var (`node_modules/next/dist/docs/01-app/03-api-reference/
      03-file-conventions/not-found.md`). Bayrak kalkarsa yanlış adrese giden
      kişi Next'in çıplak varsayılanını görür.
    */
    globalNotFound: true,
  },
};

export default nextConfig;
