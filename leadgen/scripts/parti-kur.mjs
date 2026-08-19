import { readFileSync, writeFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';

/**
 * Ilk partiyi ÖRTÜŞMEYE göre kurar — puana göre değil.
 *
 * Gerekçe ölçüldü: puan 188 dükkânda birden 55 ve sıralama fiilen alfabetik
 * oluyor; üstelik ilk sıralarda parfüm satmayan (Argos) ve tek markalı evler
 * (Amouage, Nishane) çıkıyor. Örtüşme ise "evet derse kaç saatimi yer"
 * sorusunu cevaplıyor: 1 örtüşmeli evet 6-8 saat veri girişi, 9 örtüşmeli
 * evet bir günde kurulur.
 */

function csvOku(metin) {
  const satirlar = [];
  let alan = '';
  let satir = [];
  let tirnakta = false;
  for (let i = 0; i < metin.length; i += 1) {
    const c = metin[i];
    if (tirnakta) {
      if (c === '"') {
        if (metin[i + 1] === '"') { alan += '"'; i += 1; } else { tirnakta = false; }
      } else { alan += c; }
      continue;
    }
    if (c === '"') { tirnakta = true; continue; }
    if (c === ',') { satir.push(alan); alan = ''; continue; }
    if (c === '\n') { satir.push(alan); satirlar.push(satir); satir = []; alan = ''; continue; }
    if (c === '\r') continue;
    alan += c;
  }
  if (alan !== '' || satir.length > 0) { satir.push(alan); satirlar.push(satir); }
  return satirlar;
}

const csv = csvOku(readFileSync('data/outreach.csv', 'utf8'));
const bas = csv[0].map((h) => h.replace(/^﻿/, ''));
const s = (ad) => bas.indexOf(ad);
const taslaklar = new Map();
for (const r of csv.slice(1)) {
  if (r.length !== bas.length) continue;
  if (r[s('kanal')] !== 'dm') continue;
  taslaklar.set(r[s('domain')], {
    dil: r[s('dil')],
    kanit: r[s('kanit_url')],
    acilis: r[s('acilis_cumlesi')],
    taslak: r[s('dm_taslagi')],
  });
}

const db = new DatabaseSync('data/leads.db');
const temas = new Set(db.prepare('SELECT DISTINCT domain FROM temas').all().map((r) => r.domain));

/* Parfüm satmayan işletmeler — şişe/ambalaj toptancıları, belgede sayılı. */
const PARFUM_DEGIL = /glass|ambalaj|hammadde|kozmed|shopify\.com|apkpure|threads|snapchat|gmail|faire/i;

const adaylar = db.prepare(`
  SELECT domain, shop_name, country, product_count, score, segment, instagram,
         marka_ortusmesi, urun_ortusmesi, updated_at
  FROM leads
  WHERE instagram IS NOT NULL
    AND urun_ortusmesi > 0
    AND segment != 'nis-parfum-evi'
`).all()
  .filter((r) => !temas.has(r.domain))
  .filter((r) => !PARFUM_DEGIL.test(r.domain))
  .filter((r) => taslaklar.has(r.domain))
  .filter((r) => taslaklar.get(r.domain).dil !== 'tr')
  /*
    ⚠️ Marka örtüşmesi TAM 1 ise dükkân değil PARFÜM EVİDİR — örtüşen tek marka
    kendisi. Ölçüldü (2026-08-18): kuralın yakaladığı 13 kaydın 12'si gerçekten
    ev (BDK, Nasomatto, Orto Parisi, Zoologist, Atelier Des Ors, Marc Antoine
    Barrois, Carner…). Segment sınıflandırıcısı bunları 'butik-eticaret' diye
    işaretliyor ve ayıramıyor.
    Sıfır AYRI bir durum ve elenmiyor: dekantçıda Shopify vendor alanı dükkânın
    kendi adını taşıyor, marka sayısı o yüzden sıfırlanıyor.
  */
  .filter((r) => r.marka_ortusmesi !== 1)
  .sort((a, b) => b.urun_ortusmesi - a.urun_ortusmesi
    || (b.marka_ortusmesi ?? 0) - (a.marka_ortusmesi ?? 0)
    || b.score - a.score);

/*
  Defter, başlığın kendisini yazıyor. Sebebi ölçüldü: dosya 19 Ağustos'ta
  yeniden kurulduğunda hâlâ "Ilk parti" diyordu — oysa ilk parti çoktan
  gitmişti — ve iki satır arayla hem o günün tarihini hem "Liste 16 Ağustosta
  ölçüldü" cümlesini taşıyordu. Kendi kendisiyle çelişen bir çalışma sayfası,
  sahibi ya gereksiz işe ya da doğru sayıya güvenmemeye iter.
*/
const yazilan = db.prepare('SELECT COUNT(DISTINCT domain) n FROM temas WHERE sonuc = ?').get('gonderildi').n;
/*
  ⚠️ Sayaç DIŞLAMA değil, İZİN listesiyle çalışıyor — ve bu bilinçli. Kural
  şu: yalnız bir İNSANIN verdiği karşılık cevaptır.

  Dışlama listesi ("gonderildi ve otomatik hariç her şey") bir kez yazıldı ve
  ilk yeni sonuç değerinde sessizce yanlışa döndü: `elendi` eklenince eleme
  kararı "cevap" diye sayılacaktı. Sayının dayandığı karar ağır — >=2 cevap
  varsa 233 kişilik liste 15/gün hızına açılıyor — yani şişmesi ucuz değil.
  Yeni bir sonuç değeri eklendiğinde burada GÖRÜNMEZ; sayılması isteniyorsa
  bilerek yazılır.
*/
const cevaplayan = db.prepare(
  "SELECT COUNT(DISTINCT domain) n FROM temas WHERE sonuc IN ('cevap', 'ilgilendi', 'red')",
).get().n;
const olculen = db.prepare('SELECT COUNT(*) n FROM leads WHERE urun_ortusmesi IS NOT NULL').get().n;
const ortusen = db.prepare('SELECT COUNT(*) n FROM leads WHERE urun_ortusmesi > 0').get().n;

const parti = adaylar.slice(0, 10);

const satirlar = [
  '# Sıradaki parti — 10 mesaj',
  '',
  `> Defterden: **${yazilan} dükkâna yazıldı**, ${cevaplayan} tanesi cevap verdi.`,
  '> Karar kuralı `docs/b2b/gonderim-akisi.md` başında: **10 mesaj → oku → karar**',
  '> — iki ya da daha çok cevap: metin çalışıyor, 15/güne çıkılır · bir cevap: tek',
  '> değişken değiştirilip 10 daha · sıfır: aynı metinle devam **edilmez**.',
  '',
  `Parti kuruldu: ${new Date().toISOString().slice(0, 10)} · sırada bekleyen uygun aday: ${adaylar.length}`,
  `· örtüşmesi ölçülen dükkân: ${olculen} · örtüşmesi sıfırdan büyük: ${ortusen}`,
  '',
  '⚠️ **Sıra puana göre DEĞİL, örtüşmeye göre.** Puan "iyi hedef mi" der; örtüşme',
  '"evet derse kaç saatimi yer" der. Nischengold 13 örtüşmeyle bir günde kuruldu;',
  '1 örtüşmeli bir evet 6-8 saatlik veri girişi demek.',
  '',
  '⚠️ **Her mesajdan önce kanıt adresini AÇ.** Sayı tutmuyorsa mesajı gönderme,',
  'atla. Sayılar veritabanındaki son ölçümden geliyor ve her hedefin kendi',
  '**sayım tarihi** yazılı — katalog o tarihten sonra değişmiş olabilir.',
  '',
  '⚠️ Attıktan sonra: `cd leadgen && node src/cli.ts temas <domain> gonderildi`',
  '',
  '---',
  '',
];

parti.forEach((r, i) => {
  const t = taslaklar.get(r.domain);
  satirlar.push(
    `## ${i + 1}. ${r.shop_name || r.domain}`,
    '',
    `- **Instagram:** @${r.instagram}`,
    `- **Alan adı:** ${r.domain}${r.country ? ` · ${r.country}` : ''}`,
    `- **Örtüşen parfüm: ${r.urun_ortusmesi}** · ortak marka ${r.marka_ortusmesi ?? '-'} · katalog ${r.product_count ?? '?'} ürün`,
    `- Sayım tarihi: ${(r.updated_at ?? '').slice(0, 10) || 'bilinmiyor'}`,
    `- **Kanıt adresi:** ${t.kanit}`,
    '',
    '```',
    t.taslak.trim(),
    '```',
    '',
  );
});

writeFileSync('data/ilk-parti.md', satirlar.join('\n'));
console.log(`ilk-parti.md yazildi — ${parti.length} hedef`);
console.log('');
console.log('sira | dukkan                        | ort. | marka | urun | instagram');
parti.forEach((r, i) => {
  console.log(
    String(i + 1).padStart(4) + ' | ' +
    (r.shop_name || r.domain).slice(0, 29).padEnd(29) + ' | ' +
    String(r.urun_ortusmesi).padStart(4) + ' | ' +
    String(r.marka_ortusmesi ?? '-').padStart(5) + ' | ' +
    String(r.product_count ?? '?').padStart(4) + ' | @' + r.instagram,
  );
});
console.log('');
console.log(`toplam uygun aday: ${adaylar.length}`);
