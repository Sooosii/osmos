'use client';

import { createAuthClient } from 'better-auth/react';

/**
 * Tarayıcı tarafındaki giriş istemcisi.
 *
 * ⚠️ **Sunucudaki `lib/auth.ts` ile karıştırılmayacak.** O modül veritabanına
 * bağlanıyor ve gizli anahtarları okuyor; istemciye sızarsa derleme kırılır
 * (kırılması gerekiyor). Bu dosya yalnızca uçlara HTTP atıyor.
 *
 * Taban adres verilmiyor: istemci kendi kökünden konuşuyor, yani site hangi
 * adreste yayındaysa uçlar da orada. Elle bir adres yazmak, alan adı
 * değiştiği gün sessizce kırılacak bir bağ kurardı.
 */
export const authClient = createAuthClient();

/**
 * ⚠️ Şifre sıfırlamanın adı **`requestPasswordReset`** — `forgetPassword`
 * DEĞİL. İkincisi kütüphanenin eski adı ve hâlâ birçok yazıda geçiyor;
 * bu sürümde yok ve derleme kırılıyor. Uçların kendisi paketten okundu:
 * `/request-password-reset` ve `/reset-password`.
 */
export const { useSession, signIn, signOut, signUp, requestPasswordReset, resetPassword } =
  authClient;
