import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AYLIK_TAVAN_USD, butceKapisi, CALISTIRMA_TAVANI_USD, tahminKur } from './butce.ts';
import { ACTORLAR, SONDA, TAM_KADRO } from './actors.ts';

const t = (usd: number) => ({ actor: 'x', birim: 'kayit', adet: 1, birimUsd: usd, toplamUsd: usd });

test('kucuk sonda onay beklemiyor', () => {
  assert.equal(butceKapisi(t(0.02), 0, false).izin, 'evet');
});

test('orta buyuklukte is ONAY istiyor', () => {
  const k = butceKapisi(t(0.90), 0, false);
  assert.equal(k.izin, 'onay-gerek');
  assert.ok(k.sebep.includes('kalan kredi'));
});

test('onay verilince ayni is geciyor', () => {
  assert.equal(butceKapisi(t(0.90), 0, true).izin, 'evet');
});

/*
  Sahibin kuralinin en sert yani: onay bayragi tek calistirma tavanini
  ACMIYOR. Bayrak komut gecmisinden tekrar cagrilabilir; yanlislikla
  eklenmis bir sifir butun aylik krediyi yakardi.
*/
test('tek calistirma tavanini asan is ONAYLA BILE reddediliyor', () => {
  const k = butceKapisi(t(CALISTIRMA_TAVANI_USD + 0.01), 0, true);
  assert.equal(k.izin, 'hayir');
  assert.ok(k.sebep.includes('tek calistirma tavani'));
});

test('aylik kredi bitmisse onayli is de reddediliyor', () => {
  const k = butceKapisi(t(1.00), AYLIK_TAVAN_USD - 0.50, true);
  assert.equal(k.izin, 'hayir');
  assert.ok(k.sebep.includes('aylik kredi yetmiyor'));
});

test('kalan krediye tam oturan is geciyor', () => {
  assert.equal(butceKapisi(t(0.50), AYLIK_TAVAN_USD - 0.50, true).izin, 'evet');
});

test('tahmin sabit ucreti de topluyor', () => {
  const tahmin = tahminKur('a', 'kayit', 1000, 0.0004, 0.016);
  assert.equal(tahmin.toplamUsd, 0.416);
});

/*
  ⚠️ Sahibe sunulan TAM KADRO dagilimi burada civilenmis durumda. Miktar ya
  da actor fiyati degisirse bu sinama once kirmiziya doner — sahip "ucretsiz
  sinirin icinde" diye onayladigi is sessizce ucretliye kaymasin.
*/
test('TAM KADRO ucretsiz aylik tavanin altinda kaliyor', () => {
  const tahminler = (Object.keys(ACTORLAR) as (keyof typeof ACTORLAR)[]).map((ad) => {
    const a = ACTORLAR[ad];
    return tahminKur(a.id, a.birim, TAM_KADRO[ad], a.birimUsd, a.sabitUsd);
  });
  const toplam = tahminler.reduce((s, t) => s + t.toplamUsd, 0);
  assert.ok(toplam < AYLIK_TAVAN_USD, `tam kadro ucretsiz krediyi asti: $${toplam.toFixed(2)}`);
  assert.ok(toplam > 1, `tahmin supheli derecede kucuk: $${toplam.toFixed(2)}`);
  for (const t of tahminler) {
    assert.ok(t.toplamUsd <= CALISTIRMA_TAVANI_USD, `${t.actor} tek calistirma tavanini asiyor: $${t.toplamUsd}`);
  }
});

/* Sonda, onay beklemeyecek kadar kucuk olmali — yoksa akis tikanir. */
test('SONDA miktarlari onay beklemeyecek kadar ucuz', () => {
  for (const ad of Object.keys(ACTORLAR) as (keyof typeof ACTORLAR)[]) {
    const a = ACTORLAR[ad];
    const t = tahminKur(a.id, a.birim, SONDA[ad], a.birimUsd, a.sabitUsd);
    assert.equal(butceKapisi(t, 0, false).izin, 'evet', `${a.id} sondasi onay istiyor: $${t.toplamUsd}`);
  }
});
