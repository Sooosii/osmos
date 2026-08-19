import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dmAdresi, htmlKacir, jsonGom, konsolHtml } from './gonderim-konsolu.ts';
import { partiHedefleri } from './parti-dogrula.ts';
import type { PartiHedefi } from './parti-dogrula.ts';

/**
 * Gönderim konsolunun kapısı.
 *
 * ⚠️ Sayfa gerçek dükkân adları ve gerçek mesajlar taşıyor. Kaçırma hatası
 * burada patlamaz, **sessizce yanlış görünür** — ya da sayfayı tamamen bozar.
 */

const hedef = (ek: Partial<PartiHedefi> = {}): PartiHedefi => ({
  sira: 1,
  ad: 'MiniDuft',
  instagram: 'miniduft',
  domain: 'miniduft.com',
  ozet: 'Örtüşen parfüm: 3 · katalog 70 ürün',
  sayimTarihi: '2026-08-19',
  kanit: 'https://miniduft.com/products.json?limit=250&page=1',
  mesaj: 'Hallo MiniDuft, ich habe die 70 Düfte…',
  ...ek,
});

test('gercek dukkan adlarindaki & ve < kaciriliyor', () => {
  /* "Onyx Fragrance | Authentic Perfume Samples" gibi adlar listede duruyor. */
  assert.equal(htmlKacir('Tom & Jerry'), 'Tom &amp; Jerry');
  assert.equal(htmlKacir('a < b > c'), 'a &lt; b &gt; c');
  assert.equal(htmlKacir('de"mek'), 'de&quot;mek');
});

/*
  ⚠️⚠️ ASIL KAPI. JSON `<script>` etiketinin icinde duruyor; icindeki bir
  `</script>` dizisi tarayiciya betigin bittigini soyler ve sayfanin geri
  kalani metin olarak akar. Mesaj metni dukkan adi tasiyor.
*/
test('gomulu JSON script etiketini KAPATAMIYOR', () => {
  const cikti = jsonGom({ mesaj: 'kapat </script><script>alert(1)</script>' });
  assert.ok(!cikti.includes('</script>'), `script kapanisi sizmis: ${cikti}`);
  assert.ok(cikti.includes('\\u003c'), 'kucuk-isareti kacirilmamis');
  /* Kaçırma sonrası veri hâlâ okunabilir olmalı — JSON bozulmamış. */
  assert.equal(JSON.parse(cikti.replace(/\\u003c/g, '<')).mesaj, 'kapat </script><script>alert(1)</script>');
});

/*
  Sayfanin tamami uzerinde ayni kapi: veri blogu tarayicinin gorecegi gibi
  kesilip okunuyor. Kacirma calismazsa blok ERKEN kapanir, yani icinden
  cikan metin bozuk JSON olur ve `JSON.parse` duser.
*/
test('veri blogu erken kapanmiyor — icerik saglam cikiyor', () => {
  const kotu = 'metin </script><script>alert(1)</script> icinde';
  const html = konsolHtml({
    hedefler: [hedef({ ad: 'Kotu </script> Dukkan', mesaj: kotu })],
    damga: '2026-08-19',
  });

  const bas = html.indexOf('<script type="application/json" id="hedefler">');
  assert.ok(bas >= 0, 'veri blogu bulunamadi');
  const icerikBasi = html.indexOf('>', bas) + 1;
  /* Tarayıcı bloğu İLK `</script>` dizisinde kapatır — ölçüm de öyle yapıyor. */
  const icerikSonu = html.indexOf('</script>', icerikBasi);
  const ham = html.slice(icerikBasi, icerikSonu);

  const veri = JSON.parse(ham.replace(/\\u003c/g, '<'));
  assert.equal(veri.length, 1, 'veri blogu erken kesilmis');
  assert.equal(veri[0].mesaj, kotu, 'mesaj bozulmus');
  assert.equal(veri[0].ad, 'Kotu </script> Dukkan');
});

test('DM adresi hesap arama adimini siliyor', () => {
  assert.equal(dmAdresi('miniduft'), 'https://ig.me/m/miniduft');
  /* Dosyadaki hesaplar bazen @ ile geliyor — iki kez yazilmiyor. */
  assert.equal(dmAdresi('@miniduft'), 'https://ig.me/m/miniduft');
  assert.equal(dmAdresi('kiss.of.aroma'), 'https://ig.me/m/kiss.of.aroma');
});

test('Instagram hesabi olmayan hedefte DM dugmesi YOK', () => {
  const html = konsolHtml({ hedefler: [hedef({ instagram: null })], damga: 'x' });
  assert.ok(!html.includes('ig.me/m/'), 'olmayan hesaba DM baglantisi uretilmis');
  assert.ok(html.includes('"dm":null'), 'dm alani null degil');
});

/*
  Damga localStorage anahtarina giriyor: yeni parti eski partinin
  isaretlerini devralirsa sahip atilmis sanip atlamis olur.
*/
test('damga localStorage anahtarina giriyor', () => {
  const a = konsolHtml({ hedefler: [hedef()], damga: '2026-08-19' });
  const b = konsolHtml({ hedefler: [hedef()], damga: '2026-08-26' });
  assert.ok(a.includes("'osmos-gonderim-2026-08-19'"));
  assert.ok(b.includes("'osmos-gonderim-2026-08-26'"));
});

/*
  ⚠️ Konsol ile dogrulama AYNI ayristiriciyi kullaniyor. Ikisi ayrisirsa
  dogrulanan liste ile gonderilen liste farkli olurdu — bu depo o hatayi bir
  kez yedi (urunAnahtari / markaAnahtari).
*/
test('parti dosyasindan uctan uca: ayristir → sayfa', () => {
  const metin = [
    '# Sıradaki parti — 2 mesaj',
    '',
    'Parti kuruldu: 2026-08-19 · sırada bekleyen uygun aday: 208',
    '',
    '## 1. Onyx Fragrance | Authentic Perfume Samples',
    '',
    '- **Instagram:** @onyx__fragrance',
    '- **Alan adı:** sprayonyx.com · CA',
    '- **Örtüşen parfüm: 3** · ortak marka 32 · katalog 681 ürün',
    '- Sayım tarihi: 2026-08-19',
    '- **Kanıt adresi:** https://sprayonyx.com/products.json?limit=250&page=1',
    '',
    '```',
    'Hi Onyx Fragrance! I counted the 681 fragrances…',
    '```',
    '',
    '## 2. Parfumtesten',
    '',
    '- **Instagram:** @parfumtestende',
    '- **Alan adı:** parfumtesten.de · DE',
    '- **Örtüşen parfüm: 3** · ortak marka 19 · katalog 466 ürün',
    '- Sayım tarihi: 2026-08-19',
    '- **Kanıt adresi:** https://parfumtesten.de/products.json?limit=250&page=1',
    '',
    '```',
    'Hallo Parfumtesten, ich habe die 466 Düfte…',
    '```',
  ].join('\n');

  const hedefler = partiHedefleri(metin);
  assert.equal(hedefler.length, 2);
  assert.equal(hedefler[0].domain, 'sprayonyx.com');
  assert.equal(hedefler[0].instagram, 'onyx__fragrance');
  assert.equal(hedefler[0].sayimTarihi, '2026-08-19');
  assert.ok(hedefler[0].mesaj.startsWith('Hi Onyx Fragrance!'));
  /* Almanca kartta Almanca metin — dil karismiyor. */
  assert.ok(hedefler[1].mesaj.startsWith('Hallo Parfumtesten'));

  const html = konsolHtml({ hedefler, damga: '2026-08-19' });
  assert.ok(html.includes('ig.me/m/onyx__fragrance'));
  assert.ok(html.includes('ig.me/m/parfumtestende'));
  /* Boru isareti tasiyan ad sayfayi bozmuyor. */
  assert.ok(html.includes('Onyx Fragrance | Authentic Perfume Samples'));
});
