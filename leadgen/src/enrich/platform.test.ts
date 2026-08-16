import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EN_FAZLA_URUN_ADAYI, urunleriSirala } from './platform.ts';

/*
  Olculmus hata: urun listesinin ilk sirasini korlemesine almak
  xerjoff.com icin bir hediye cantasi, marcantoinebarrois.com icin bir
  kartpostal seti sayfasina bakmak demekti. Aksesuar sayfasinda oneri
  blogu bulunmamasi dukkanda bulunmadigi anlamina gelmiyor — ustelik o
  cumle mektuba girseydi parfumcuye "hediye cantaniza baktim" yazilacakti.
*/
test('parfum urunu aksesuarin onune geciyor', () => {
  const s = urunleriSirala([
    { handle: 'pochette-gift', title: 'Pochette Gift', product_type: 'Accessory' },
    { handle: 'erba-pura', title: 'Erba Pura Eau de Parfum', product_type: 'Fragrance' },
  ]);
  assert.equal(s[0], 'erba-pura');
});

test('turu belirsiz urun aksesuarin onunde, parfumun arkasinda', () => {
  const s = urunleriSirala([
    { handle: 'kit', title: 'Kit Carte Postale Arles Set 1' },
    { handle: 'bilinmez', title: 'Mystery Item' },
    { handle: 'parfum', title: 'Naxos Extrait de Parfum' },
  ]);
  assert.deepEqual([...s], ['parfum', 'bilinmez', 'kit']);
});

test('urun turu alaninda gecen parfum izi de sayiliyor', () => {
  const s = urunleriSirala([
    { handle: 'a', title: 'Numero 5' },
    { handle: 'b', title: 'Numero 9', product_type: 'Eau de Parfum' },
  ]);
  assert.equal(s[0], 'b');
});

test('kisa adi olmayan urun adaylara girmiyor', () => {
  assert.deepEqual([...urunleriSirala([{ title: 'kisa adi yok' }, { handle: '', title: 'bos' }])], []);
});

test('aday sayisi tavanla sinirli — nezaket', () => {
  const cok = Array.from({ length: 20 }, (_, i) => ({ handle: `u${i}`, title: 'Eau de Parfum' }));
  assert.equal(urunleriSirala(cok).length, EN_FAZLA_URUN_ADAYI);
});

/*
  Olculmus hata (ikinci tur): "Bougie Elixir d'Ambre" bir MUM ama icindeki
  "elixir" kelimesi onu parfum sanmisti; "Savon Parfume Tilia" ise sabun.
  Ilk iki mektubun kaniti bu iki sayfaydi — parfum evine "mumunuza baktim"
  diye yazilacakti. Aksesuar kontrolu parfum izinden ONCE bakiyor.
*/
test('mum ve sabun, adinda parfum kelimesi gecse bile aksesuar', () => {
  const s = urunleriSirala([
    { handle: 'bougie', title: "Bougie Elixir d'Ambre" },
    { handle: 'encelade', title: 'Encelade Eau de Parfum' },
    { handle: 'bilinmez', title: 'Mystery' },
  ]);
  assert.equal(s[0], 'encelade');
  assert.equal(s[2], 'bougie', 'mum en sona dusmeli');
});

test('savon parfume da aksesuar sayiliyor', () => {
  const s = urunleriSirala([
    { handle: 'savon', title: 'Savon Parfume Tilia' },
    { handle: 'parfum', title: 'Tilia Eau de Parfum' },
  ]);
  assert.equal(s[0], 'parfum');
});

test('urun turu Home Fragrance olan aksesuar', () => {
  const s = urunleriSirala([
    { handle: 'ev', title: 'Tilia', product_type: 'Home Fragrance' },
    { handle: 'siseli', title: 'Tilia', product_type: 'Eau de Parfum' },
  ]);
  assert.equal(s[0], 'siseli');
});

/*
  Ucuncu tur olcum: "Coffret Savons Parfumes" (sabun koffresi) ve
  "Cristal Oud Coffret Travel Edition" (hediye koffresi) hala parfum
  saniliyordu. Birincisinde cogul eki ("savon" + "s") kelime sinirini
  deliyordu, ikincisinde "coffret" listede yoktu.
*/
test('cogul ekli aksesuar adi da yakalaniyor', () => {
  const s = urunleriSirala([
    { handle: 'coffret-savon', title: 'Coffret Savons Parfumes d Invite Encelade' },
    { handle: 'encelade', title: 'Encelade Eau de Parfum' },
  ]);
  assert.equal(s[0], 'encelade');
});

test('hediye koffresi parfum adiyla birlikte gelse de aksesuar', () => {
  const s = urunleriSirala([
    { handle: 'coffret', title: 'Cristal Oud Coffret Travel Edition' },
    { handle: 'gercek', title: 'Cristal Oud Eau de Parfum' },
  ]);
  assert.equal(s[0], 'gercek');
});

test('cogul eki kelimenin kendisini bozmuyor: candles, mumlar, sets', () => {
  const s = urunleriSirala([
    { handle: 'a', title: 'Scented Candles Trio' },
    { handle: 'b', title: 'Discovery Sets' },
    { handle: 'c', title: 'Naxos Extrait de Parfum' },
  ]);
  assert.equal(s[0], 'c');
});
