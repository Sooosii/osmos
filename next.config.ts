import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
