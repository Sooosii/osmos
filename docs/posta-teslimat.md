# Posta neden spam'e düşüyor ve nasıl düzelir

**Ölçüldü (2026-08-11):** doğrulama mektubu gidiyor, teslim ediliyor, ama
gelen kutusuna değil **spam'e** düşüyor.

## Sebep

Gönderen adres `onboarding@resend.dev` — Resend'in **paylaşımlı deneme
adresi**. Üç sorun birden:

1. **İtibar ortak.** Binlerce Resend hesabı aynı adresten atıyor. O adresin
   itibarı senin davranışınla değil, hepsinin ortalamasıyla belirleniyor.
2. **Hizalama yok.** Gönderen alan adı (`resend.dev`) siteninkiyle (`osmos-…`)
   alakasız. DMARC'ın doğrulayacağı bir kimlik yok.
3. **Yalnız sahibine gidiyor.** Resend, doğrulanmamış alan adında yalnızca
   hesap sahibinin adresine teslim ediyor; başkasına **403**. Sitedeki davet
   bağlantısının kapalı olmasının sebebi bu (`SignInLink`,
   `NEXT_PUBLIC_ACCOUNTS_ENABLED`).

⚠️ **Bu kodla kapatılabilecek bir açık değil.** Metni değiştirmek, HTML
eklemek, başlık oynamak bu üçünü çözmez. Çözüm kendi alan adı.

## Çözüm — sırayla

**① Alan adı al.** Yılda ~10–15 $. `osmos.…` biçiminde kısa bir şey yeter.

**② Resend → Domains → Add Domain.** Alan adını gir. Resend sana üç tür DNS
kaydı verir:

- **SPF** — `TXT`, genelde kökte ya da `send.` alt alanında
- **DKIM** — `TXT` (ya da `CNAME`), `resend._domainkey.` gibi bir adda
- **MX** — dönüş yolu (return-path) için, Resend'in verdiği alt alanda

Değerleri **Resend'in ekranından kopyala**; her alan adı için farklı üretiliyor,
buraya yazılamaz.

**③ Kayıtları kayıt şirketinin DNS panelinde oluştur.** Yayılması genelde
dakikalar, bazen birkaç saat. Resend'de "Verified" yazana kadar bekle.

**④ DMARC ekle** (SPF ve DKIM doğrulandıktan **sonra**):

```
ad:  _dmarc
tip: TXT
deger: v=DMARC1; p=none; rua=mailto:sen@kendi-alan-adin
```

`p=none` ile başla — önce rapor topla, kimseyi reddetme. Birkaç hafta sonra
`p=quarantine` yapılabilir.

**⑤ Vercel'de değişkenleri kur:**

| değişken | değer | zorunlu |
|---|---|---|
| `MAIL_FROM` | `OSMOS <merhaba@kendi-alan-adin>` | evet |
| `MAIL_REPLY_TO` | cevapları okuyacağın gerçek adres | hayır ama iyi olur |
| `NEXT_PUBLIC_ACCOUNTS_ENABLED` | `1` | daveti açmak için |

⚠️ `NEXT_PUBLIC_*` **derleme anında** gömülüyor: kurduktan sonra **yeniden
deploy** etmeden değişmiyor.

⚠️ Sırayı bozma: `NEXT_PUBLIC_ACCOUNTS_ENABLED` açılıp `MAIL_FROM` unutulursa
davet herkese görünür ama mektup yine deneme adresinden gider — kayıt olan
yabancı kilitlenir. `mail.ts` bu bileşimi üretim günlüğüne yazıyor.

**⑥ Alan adını sitenin kendisine de bağla** (Vercel → Domains). Şart değil ama
`osmos-three.vercel.app` geçici görünüyor ve duyuru metinlerinde kötü duruyor.

## Sonra nasıl doğrulanır

- Kendine bir doğrulama mektubu attır. Gmail'de mektubu aç → **⋮ → Orijinali
  göster**. Üçü de `PASS` olmalı: `SPF`, `DKIM`, `DMARC`.
- [mail-tester.com](https://www.mail-tester.com) adresine bir mektup gönder;
  10 üzerinden 8+ hedefle.
- Resend panelinde teslim ve açılma kayıtları görünür.

## Bugün, alan adı gelene kadar

Kendi gelen kutun için işe yarayan tek şey: spam'deki mektubu aç, **"Spam
değil"** de, ve göndereni kişilere ekle. Bu yalnız **senin** adresin için
Gmail'i eğitir; başkasına faydası yok. Sen sitenin geri kalanını denerken
yeterli.

## Kodun bugünkü hâli

- Gönderen tek bir değişkenden geliyor (`MAIL_FROM`); alan adı geldiğinde
  kodda **hiçbir şey değişmiyor**.
- `MAIL_REPLY_TO` tanımlıysa `reply_to` ekleniyor, yoksa alan hiç
  gönderilmiyor.
- Mektuplar düz metin, tek bağlantı, kısa. Bu kısmı değiştirmeye gerek yok:
  spam'e düşüren şey içerik değil, gönderen.
