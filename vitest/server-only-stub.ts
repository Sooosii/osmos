/**
 * `server-only` paketinin sınamalardaki karşılığı — bilerek boş.
 *
 * Gerçek paket, sunucu koşulu seçilmediğinde fırlatıyor: *"This module cannot
 * be imported from a Client Component"*. Vitest sunucu/istemci ayrımı yapmıyor
 * ve `lib/mail.ts`i içeri alan her sınama o dala düşüyordu.
 *
 * ⚠️ **Paket kaldırılmadı, yalnızca sınamada değiştirildi.** Koruma gerçek:
 * posta modülü bir istemci bileşenine sızarsa Next'in derlemesi kırılıyor ve
 * kırılması gerekiyor — içinde Resend anahtarı okunuyor. Sınamalar o modülü
 * zaten sunucu tarafı gibi çağırıyor.
 */
export {};
