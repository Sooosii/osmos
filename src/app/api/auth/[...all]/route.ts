import { toNextJsHandler } from 'better-auth/next-js';
import { getAuth } from '@/lib/auth';

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
export const { GET, POST } = toNextJsHandler((request) => getAuth().handler(request));
