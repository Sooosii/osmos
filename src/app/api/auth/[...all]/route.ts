import { toNextJsHandler } from 'better-auth/next-js';
import { getAuth } from '@/lib/auth';
import { ucKapali } from '@/lib/tenant-guard';

/**
 * Better Auth'un kendi uçları — giriş, kayıt, çıkış, Google dönüşü,
 * doğrulama, şifre sıfırlama. Hepsi bu tek yakalayıcı rotanın altında.
 *
 * ⚠️ Yol `/api/auth/...` ve **dil öneki almıyor.** `proxy.ts`teki
 * `ROOT_PREFIXES` bunu tutuyor: `/tr/api/auth/callback/google` diye bir şey
 * olamaz, çünkü Google'a kayıtlı yönlendirme adresi tek ve sabit.
 *
 * ⚠️ İşleyici **istek anında** kuruluyor (`getAuth()` çağrısı burada, modülün
 * tepesinde değil): derleme sırasında `DATABASE_URL` yok ve olmamalı.
 */
const isleyici = toNextJsHandler((request) => getAuth().handler(request));

/*
  ⚠️ **Kapı işleyiciyi SARIYOR, yanına konmuyor** — ve bu bir üslup tercihi
  değil. `toNextJsHandler`ın döndürdüğü işlev çağrıldığı anda `getAuth()`a
  gidiyor; kiracıda `DATABASE_URL` yok ve orası patlıyor. Kapı geç çalışsaydı
  müşterinin alan adında 404 değil **500** çıkardı: "burada bir şey var ve
  bozuk" cümlesi, oysa doğru cümle "burada bir şey yok".
*/
export async function GET(request: Request): Promise<Response> {
  const kapali = ucKapali('accounts');
  if (kapali) return kapali;
  return isleyici.GET(request);
}

export async function POST(request: Request): Promise<Response> {
  const kapali = ucKapali('accounts');
  if (kapali) return kapali;
  return isleyici.POST(request);
}
