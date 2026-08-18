'use client';

import { createAuthClient } from 'better-auth/react';
import { activeTenant } from './tenant';

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
/**
 * Hesabı olmayan sitede oturum SORULMUYOR.
 *
 * ⚠️ **Ölçülerek bulundu (2026-08-18).** `/api/auth` kiracıda 404'e alınınca
 * müşterinin sitesinde her sayfa yüklemesinde konsola kırmızı bir satır
 * düşmeye başladı: `GET /api/auth/get-session 404`. Sebep `SignInLink`,
 * `AddToTopFour`, `ShelfPicker` ve `use-shelf-rings` — dördü de hiçbir şey
 * çizmedikleri hâlde `useSession()` çağırıyorlar, çünkü kanca koşullu
 * çağrılamaz.
 *
 * ⚠️ **Doğru düzeltme ucu geri açmak DEĞİL, soruyu sormamaktı.** Hesabı
 * olmayan bir sitenin ziyaretçisine "sen kimsin" diye sormak için sebep yok;
 * kapanan istek başına bir ağ gidiş-dönüşü de kazanılıyor. Aynı ders
 * `use-shelf-rings`te bir kez yazılmıştı: koşulsuz çağrılan uç, belirtisi
 * olmayan bir israftır.
 *
 * ⚠️ Karar **kayıttan** okunuyor, ortam değişkeninden değil: env kopyalayan
 * biri müşterinin sitesinde oturum sorgusunu geri açamasın. Ana sitede
 * `features.accounts` açık, yani osmos.me'de hiçbir şey değişmiyor.
 */
const HESAPLAR_ACIK = activeTenant().features.accounts;

/* Kancanın sözleşmesi: tüketiciler yalnız `data` ve `isPending` okuyor. */
const BOS_OTURUM = { data: null, isPending: false, error: null, refetch: () => {} };

export const useSession = (
  HESAPLAR_ACIK ? authClient.useSession : () => BOS_OTURUM
) as typeof authClient.useSession;

export const {
  signIn,
  signOut,
  signUp,
  requestPasswordReset,
  resetPassword,
  sendVerificationEmail,
} = authClient;
