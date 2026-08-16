import { test } from 'node:test';
import assert from 'node:assert/strict';
import { elemedenGecer } from './eleme.ts';

test('gercek dukkanlar geciyor', () => {
  for (const d of ['scentsplit.com', 'zoologistperfumes.com', 'nishane.com', 'parfum.com.tr', 'kucuk-dukkan.myshopify.com']) {
    assert.equal(elemedenGecer(d, `https://${d}/`).gecti, true, d);
  }
});

test('topluluk ve bilgi siteleri eleniyor', () => {
  for (const d of ['fragrantica.com', 'basenotes.com', 'parfumo.com', 'wikipedia.org']) {
    assert.equal(elemedenGecer(d, null).gecti, false, d);
  }
});

test('sosyal aglar eleniyor', () => {
  for (const d of ['reddit.com', 'youtube.com', 'instagram.com', 'tiktok.com']) {
    assert.equal(elemedenGecer(d, null).gecti, false, d);
  }
});

/*
  Pazar yeri bir isletme ama widget onun urun sayfasina gomulemez —
  bizim satabilecegimiz bir musteri degil.
*/
test('pazar yerleri eleniyor', () => {
  for (const d of ['amazon.com', 'ebay.co.uk', 'trendyol.com', 'hepsiburada.com', 'etsy.com', 'aliexpress.com']) {
    assert.equal(elemedenGecer(d, null).gecti, false, d);
  }
});

/*
  ⚠️ Sahibin acik karari: buyuk evler ELENMIYOR.
  "Ne kadar daha cok markayla evle iletisime gecersek daha iyi olur."
  Bu sinama o karari koruyor — biri filtre eklemeye kalkarsa kirmiziya doner.
*/
test('BUYUK PARFUM EVLERI ELENMIYOR — sahibin karari', () => {
  for (const d of ['dior.com', 'guerlain.com', 'amouage.com', 'xerjoff.com', 'hermes.com', 'sergelutens.com']) {
    assert.equal(elemedenGecer(d, `https://${d}/`).gecti, true, `${d} elenmemeli`);
  }
});

test('makale ve forum yollari eleniyor', () => {
  assert.equal(elemedenGecer('ornek.com', 'https://ornek.com/blog/en-iyi-parfumler').gecti, false);
  assert.equal(elemedenGecer('ornek.com', 'https://ornek.com/news/2026/parfum').gecti, false);
  assert.equal(elemedenGecer('ornek.com', 'https://ornek.com/products/oud').gecti, true);
});

test('kurum uzantilari eleniyor', () => {
  assert.equal(elemedenGecer('harvard.edu', null).gecti, false);
  assert.equal(elemedenGecer('fda.gov', null).gecti, false);
});

test('eleme sebebi HER ZAMAN yaziliyor — sessiz atma yok', () => {
  const s = elemedenGecer('reddit.com', null);
  assert.equal(s.gecti, false);
  assert.ok(s.sebep !== null && s.sebep.length > 0);
});

test('gecen adayda sebep null', () => {
  assert.equal(elemedenGecer('scentsplit.com', 'https://scentsplit.com/').sebep, null);
});

/*
  Olculdu: sondada `wa.me` aday olarak listeye girdi. Mesajlasma kisayolu
  bir dukkan degil, gecis noktasi.
*/
test('mesajlasma ve kisayol adresleri eleniyor', () => {
  for (const d of ['wa.me', 'whatsapp.com', 't.me', 'm.me', 'linktr.ee', 'g.page']) {
    assert.equal(elemedenGecer(d, null).gecti, false, d);
  }
});

/*
  ⚠️ Bes kacak, uretilmis listeye bakinca bulundu. Hepsi ELENEN_ALANLARin
  zaten tuttugu siniflarda ama listede yoktular:
    · apkpure.net  → Android uygulama indirme sitesi. Google aramasina
                     "Kiss of Aroma" diye bir UYGULAMA oldugu icin girdi.
    · threads.com  → listede threads.NET vardi; Meta alan adini tasidi.
    · snapchat.com → sosyal ag, listede yoktu.
    · gmail.com    → posta saglayicisi; kimsenin dukkani degil.
    · faire.com    → B2B pazar yeri; Amazonla ayni sinif, widget gomulemez.

  ⚠️ Bu, sahibin "kimse elenmiyor" kuralini DEGISTIRMIYOR. O kural olcek
  icin: buyuk parfum evleri elenmiyor. Burasi "satilamayacak yer" kapisi.
*/
test('mecra, pazar yeri ve posta saglayicisi elenmeye devam ediyor', () => {
  for (const d of ['apkpure.net', 'threads.com', 'snapchat.com', 'gmail.com', 'faire.com']) {
    assert.equal(elemedenGecer(d, null).gecti, false, d);
  }
});

/* ⚠️ Gercek parfum evleri hala geciyor — sahibin kurali burada korunuyor. */
test('buyuk parfum evleri bu eklemeden sonra da geciyor', () => {
  for (const d of ['amouage.com', 'sergelutens.com', 'nasomatto.com', 'nishane.com']) {
    assert.equal(elemedenGecer(d, null).gecti, true, d);
  }
});
