# Tam Bitiş — Tasarım

## Sorun

Bilinen eksik kalmamıştı ama üç şeye **hiç bakılmamıştı**: site yalnızca
Chromium'da görülmüştü (Safari/iOS hiç), sınamalar yalnızca elle çalışıyordu
(CI yok), ve deponun kullanım izni yazılı değildi (LICENSE yok).

## ① Safari — cihaz olmadan ne ölçülebilir, ne ölçülemez

Elimde Safari yok. O yüzden bu tur **koddan ve üretilen çıktıdan** yapıldı;
neyin doğrulanmadığı da aşağıda yazılı, çünkü "baktım" ile "cihazda gördüm"
aynı şey değil.

**Temiz çıkanlar (ölçüldü):**

| Bakılan | Sonuç |
|---|---|
| `backdrop-filter` | Üretilen CSS `-webkit-backdrop-filter`ı da basıyor |
| Tekerlek dinleyicileri | `preventDefault` çağıran `{ passive: false }`, öbürü `passive: true` |
| Dokunma | İşaretçi olayları + `touch-action: none` (iOS'un istediği yol) |
| `matchMedia` | Modern `addEventListener('change')`, eski `addListener` yok |
| Tuval API'leri | `OffscreenCanvas`, `roundRect`, `ctx.filter` hiçbir yerde yok |

**Bulunan tek şey — uykudaki bir tuzak.** Safari "bütün çerezleri engelle"
açıkken `window.sessionStorage`a **erişmek bile** `SecurityError` fırlatıyor;
`acilis-oturum.ts` tam bu yüzden depoyu sarmalıyordu. `use-approach-scene.ts`
ise iki yerde **çıplak** çağırıyordu — üstelik bir satır yukarısında güvenli
yolu kullanırken.

⚠️ Bu **patlamış bir mayın değil, kurulu bir tuzaktı**: iki çağrı da
`APPROACH_ONCE` sabitinin arkasında ve o sabit `false`, yani satırlar hiç
çalışmıyordu. Tehlike, sabiti bir gün açanın hiçbir uyarı görmemesiydi; orası
sitenin giriş kapısı. İkisi de güvenli yola alındı, bir sınama çıplak çağrıları
denetliyor (önce kırılarak doğrulandı).

**Doğrulanmayanlar — cihaz gerekiyor:** iOS'ta adres çubuğu küçülüp büyürken
`dvh` ve `visualViewport` üstüne kurulu açılış kapısının davranışı; ve
Tailwind 4'ün tabanı (`color-mix`, `@property`) **Safari 16.4 öncesinde**
çalışmıyor — iOS 16.4'ten eski bir telefonda renkler bozulur. İkisi de ancak
gerçek bir iPhone'da görülür.

## ② CI

`.github/workflows/ci.yml`: her itişte lint, sınamalar, sonra üretim derlemesi
(sınamalar hızlı, derleme yavaş — kırık bir şey varsa üç dakika beklemeden
görünsün). Node 22 (LTS) seçildi; yerelde 24 koşuyor ama barındırma tarafı
çoğunlukla LTS koşar ve "bende çalışıyordu" farkı orada yakalanmalı.
`npm ci` kullanılıyor: `npm install` kilidi güncelleyip CI'yi başka sürümlerle
yeşil yapabiliyor.

## ③ LICENSE

Sahip dört seçenek arasından **"tüm hakları saklı"**yı seçti. Kod okunabilir
ama seçki, küratör cümleleri ve ölçümler özgün iş ve serbest değil. Gerekçe:
sonradan açmak her zaman mümkün, tersi değil.

*Reddedilen:* MIT (veri de dahil her şey serbest olurdu), kod MIT + içerik
CC BY-NC (ikili lisans, bu ölçekte gereksiz karmaşa), ve hiç yazmamak
(yayın günü ambiguity bırakırdı).

## ④ iPhone turu — kodun göremediği hata oradan çıktı

Sahip siteyi telefonda gezdi ve **cihazsız bulunamayacak** bir şey buldu:
uzayda iki parmakla yakınlaştırma çalışmıyordu. Üç turda çözüldü ve her tur
bir şey öğretti.

**Tur 1 — tahmin, tutmadı.** "Safari'nin sayfa yakınlaştırması araya giriyor"
diye standart dışı `gesture*` olaylarının varsayılanı kesildi. Sahip sınadı:
sorun sürdü. *Ders: cihaz elimde yokken tahminle düzeltme yapılmamalı.*

**Tur 2 — ölçüm.** Chromium'da **gerçek çift dokunuş** üretildi (CDP
`Input.dispatchTouchEvent`, iPhone ölçüleri) ve sıkıştırmanın **zaten
çalıştığı** görüldü. Demek ki kod doğru, sorun işaretçi olaylarının iOS'ta
bölünmesi. İki parmak **dokunma olaylarından** okunmaya başladı — `touchmove`
bütün parmakları tek olayda veriyor, yakalama ve iptal karmaşası hiç yok
(harita kütüphanelerinin iOS için yaptığı da bu).

**Tur 3 — asıl sebep.** Sahip: *"iki parmağımla aşağı çekince büyüyor, yukarı
çekince küçülüyor."* Bu tarif hatayı tek cümlede verdi: iki parmakla
**kaydırmanın karşılığı yoktu** ve hareket bütünüyle yakınlaşmaya sayılıyordu.
İki sebep birden vardı:

- Dokunma yolu yalnızca **mesafeyi** okuyordu. Artık **ortanın yer
  değiştirmesi** de okunuyor: mesafe yakınlaştırıyor, orta kaydırıyor, ikisi
  aynı harekette birlikte olabiliyor. Sıra önemli — yakınlaşma ortaya çapalı,
  o yüzden önce o.
- Safari iki parmaklı kaydırmayı **tekerlek olayına** çeviriyor ve `onWheel`
  masaüstündeki gibi yakınlaştırıyordu. Parmak ekrandayken (ve kalktıktan
  sonraki 400 ms boyunca, savrulma olayları için) tekerleğe artık bakılmıyor.

⚠️ **Kalan kural:** dokunuşun karşılığını yalnızca dokunma yolu verir. Tekerlek
masaüstünündür; iki parmak kaydırmayı tekerleğe çeviren tarayıcı yüzünden ikisi
karışırsa hareket iki kez sayılır.

Sahip son hâli telefonda onayladı: "şimdi düzgün çalışıyor".

## Sonuç

241 sınama yeşil, lint sessiz, 392 sayfa. iPhone turu yapıldı ve çıkan tek
hata düzeltildi. Doğrulanmadan kalan: eski iOS'ta (16.4 öncesi) renkler —
Tailwind 4'ün tabanı orada çalışmıyor ve sahibin telefonu daha yeni.
