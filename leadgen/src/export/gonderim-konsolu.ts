/**
 * Gönderim konsolu — partiyi tek yerel sayfada gezilebilir hâle getirir.
 *
 * ⚠️ **Sahibin şikâyetinden doğdu (2026-08-19): "tek tek atmak yoruyor."**
 * Ölçülen iş şuydu: dosyayı aç → hesabı oku → Instagram'a git → hesabı ARA →
 * DM'i aç → metni seç → kopyala → yapıştır → gönder → deftere yaz. Onbeş
 * hedefte bu dokuz adım × 15.
 *
 * Konsol arama ve kopyalama adımlarını siliyor: `ig.me/m/<hesap>` doğrudan o
 * kişinin DM penceresini açıyor (ölçüldü: 302 → `instagram.com/m/<hesap>`),
 * metin tek düğmeyle panoya gidiyor.
 *
 * ⚠️⚠️ **"Gönder"e insan basıyor ve bu pazarlık dışı.** Sahip hesabını verip
 * gönderimi bana bırakmayı önerdi; alınmadı. Instagram soğuk DM'e API vermiyor
 * ve otomatik gönderim hesabı kapattırıyor — kural `gonderim-akisi.md`de
 * yazılı. O hesap 396 hedefin tek kapısı; kaybı bir partiden çok daha pahalı.
 * Bu yüzden sayfa hiçbir şeyi kendiliğinden açmıyor ve sıradakine geçmiyor:
 * otomatik akış, otomatik gönderime giden ilk adımdır.
 */
import { createHash } from 'node:crypto';
import type { PartiHedefi } from './parti-dogrula.ts';

/**
 * HTML metin kaçırma.
 *
 * ⚠️ Dükkân adları gerçek dünyadan geliyor ve içlerinde `&` ile `|` var
 * ("Onyx Fragrance | Authentic Perfume Samples"). Kaçırılmazsa sayfa sessizce
 * bozulur — hata vermez, yalnız yanlış görünür.
 */
export function htmlKacir(metin: string): string {
  return metin
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Veriyi `<script type="application/json">` içine gömmek için kaçırır.
 *
 * ⚠️⚠️ **`<` karakteri `<` olmak ZORUNDA.** JSON'un içindeki bir
 * `</script>` dizisi tarayıcıya betiğin bittiğini söyler ve sayfanın geri
 * kalanı metin olarak akar. Mesaj metni dükkân adı taşıyor, yani bir gün
 * içinde `<` geçmesi an meselesi.
 */
export function jsonGom(veri: unknown): string {
  return JSON.stringify(veri).replace(/</g, '\\u003c');
}

/**
 * `localStorage` anahtarını ayıran damga.
 *
 * ⚠️ **Tarih TEK BAŞINA yetmiyor ve bu ölçülerek görüldü.** 19 Ağustos'ta parti
 * dört kez yeniden kuruldu (ölçüm bitti, süzgeç değişti, iki kötü aday elendi).
 * Dördü de `Parti kuruldu: 2026-08-19` yazıyordu, yani aynı anahtarı
 * paylaşıyorlardı — bir öncekinde işaretlenmiş bir dükkân yeni partide
 * **gönderilmiş gibi** görünür ve atlanırdı. Sessiz bir kayıp: hata vermez,
 * yalnız o dükkâna hiç yazılmaz.
 *
 * Hedef listesinin özeti damgaya giriyor: içerik değişince anahtar değişiyor,
 * aynı parti yeniden üretilince işaretler duruyor.
 */
export function partiDamgasi(tarih: string, alanAdlari: readonly string[]): string {
  const ozet = createHash('sha256').update(alanAdlari.join(',')).digest('hex').slice(0, 8);
  return `${tarih}-${ozet}`;
}

/** DM'i doğrudan açan adres — hesap arama adımını siliyor. */
export function dmAdresi(instagram: string): string {
  return `https://ig.me/m/${encodeURIComponent(instagram.replace(/^@/, ''))}`;
}

export interface KonsolSecenekleri {
  readonly hedefler: readonly PartiHedefi[];
  /** `localStorage` anahtarını ayıran damga — yeni parti eski işaretleri devralmasın. */
  readonly damga: string;
}

export function konsolHtml({ hedefler, damga }: KonsolSecenekleri): string {
  const veri = hedefler.map((h) => ({
    sira: h.sira,
    ad: h.ad,
    instagram: h.instagram,
    domain: h.domain,
    ozet: h.ozet,
    sayimTarihi: h.sayimTarihi,
    kanit: h.kanit,
    mesaj: h.mesaj,
    dm: h.instagram === null ? null : dmAdresi(h.instagram),
  }));

  return `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Gönderim konsolu — ${htmlKacir(damga)}</title>
<style>
  :root { color-scheme: dark; }
  body {
    margin: 0; padding: 24px 16px 96px;
    font: 15px/1.55 ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif;
    background: #0d0d0f; color: #e8e6e3;
  }
  main { max-width: 780px; margin: 0 auto; }
  h1 { font-size: 20px; margin: 0 0 4px; font-weight: 600; }
  .ust { color: #8f8b85; font-size: 13px; margin-bottom: 20px; }
  .kart {
    border: 1px solid #2a2a2e; border-radius: 10px;
    padding: 14px 16px; margin-bottom: 12px; background: #141416;
  }
  .kart[data-gonderildi="1"] { opacity: .45; border-color: #1e3a24; }
  .kart h2 { font-size: 15px; margin: 0 0 2px; font-weight: 600; }
  .meta { color: #8f8b85; font-size: 12.5px; margin-bottom: 10px; }
  .meta a { color: #8f8b85; }
  pre {
    white-space: pre-wrap; word-break: break-word; margin: 0 0 12px;
    background: #0a0a0c; border: 1px solid #232326; border-radius: 8px;
    padding: 10px 12px; font: 13px/1.5 ui-monospace, SFMono-Regular, Consolas, monospace;
    color: #cfcbc5;
  }
  .dugmeler { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
  button, a.dugme {
    font: inherit; font-size: 13px; padding: 7px 12px; border-radius: 7px;
    border: 1px solid #33333a; background: #1c1c20; color: #e8e6e3;
    cursor: pointer; text-decoration: none; display: inline-block;
  }
  button:hover, a.dugme:hover { background: #26262b; }
  a.birincil { background: #23402c; border-color: #2f5c3c; }
  label.isaret { margin-left: auto; display: flex; gap: 6px; align-items: center; color: #8f8b85; font-size: 13px; }
  .sayac { position: fixed; right: 16px; bottom: 16px; background: #1c1c20;
           border: 1px solid #33333a; border-radius: 999px; padding: 8px 16px; font-size: 13px; }
  .defter { margin-top: 28px; }
  .uyari { border-left: 3px solid #6b5a1f; padding-left: 12px; color: #b9b2a3; font-size: 13px; margin: 16px 0 24px; }
</style>
</head>
<body>
<main>
  <h1>Gönderim konsolu</h1>
  <div class="ust">${hedefler.length} hedef · parti ${htmlKacir(damga)}</div>

  <div class="uyari">
    <strong>Gönder'e sen basıyorsun.</strong> Bu sayfa hiçbir şeyi kendiliğinden
    açmıyor ve sıradakine geçmiyor. Her mesajdan önce <em>Kanıtı aç</em> ile
    sayının hâlâ tuttuğunu gör; tutmuyorsa gönderme, atla.
  </div>

  <div id="liste"></div>

  <div class="defter">
    <h2 style="font-size:15px;margin:0 0 8px">Deftere yaz</h2>
    <div class="ust">Işaretlediklerin için. Terminale yapıştır.</div>
    <pre id="komut">—</pre>
    <button id="komutKopyala">Komutu kopyala</button>
  </div>
</main>

<div class="sayac"><span id="ilerleme">0</span> / ${hedefler.length}</div>

<script type="application/json" id="hedefler">${jsonGom(veri)}</script>
<script>
(function () {
  var hedefler = JSON.parse(document.getElementById('hedefler').textContent);
  var ANAHTAR = 'osmos-gonderim-${damga}';
  var durum = JSON.parse(localStorage.getItem(ANAHTAR) || '{}');

  function kaydet() {
    localStorage.setItem(ANAHTAR, JSON.stringify(durum));
    tazele();
  }

  function tazele() {
    var atilan = hedefler.filter(function (h) { return durum[h.domain]; });
    document.getElementById('ilerleme').textContent = atilan.length;
    /*
      ⚠️ Kanal AÇIKÇA yazılıyor (--kanal dm), türetmeye bırakılmıyor. Türetme
      dükkâna hangi kanaldan ulaşılabileceğini söylüyor, mesajın hangi kanaldan
      gittiğini değil; ikisi bir kez ayrıştı ve defter yanlış yazdı.
      Bu sayfadan giden her mesaj DM, o yüzden burada bilinen bir gerçek var.
    */
    document.getElementById('komut').textContent = atilan.length === 0
      ? '—'
      : 'cd leadgen && for d in ' + atilan.map(function (h) { return h.domain; }).join(' ')
        + '; do node src/cli.ts temas "$d" gonderildi "Instagram DM, @soroshzs" --kanal dm; done';
  }

  /*
    Pano yazma her bağlamda çalışmıyor (file:// açılışında engellenebiliyor).
    Düşerse metin SEÇILIYOR, yani Ctrl+C bir tuş uzakta kalıyor — "kopyalanamadı"
    deyip kullanıcıyı metni elle taramaya bırakmak konsolun tek işini boşa
    çıkarırdı.
  */
  function seciliYap(metin) {
    var kutu = document.createElement('textarea');
    kutu.value = metin;
    kutu.style.position = 'fixed';
    kutu.style.opacity = '0';
    document.body.appendChild(kutu);
    kutu.select();
    var oldu = false;
    try { oldu = document.execCommand('copy'); } catch (e) { oldu = false; }
    document.body.removeChild(kutu);
    return oldu;
  }

  function bildir(dugme, metin) {
    var eski = dugme.dataset.eski || dugme.textContent;
    dugme.dataset.eski = eski;
    dugme.textContent = metin;
    setTimeout(function () { dugme.textContent = eski; }, 1400);
  }

  function kopyala(metin, dugme) {
    if (!navigator.clipboard || !window.isSecureContext) {
      bildir(dugme, seciliYap(metin) ? 'kopyalandı ✓' : 'kopyalanamadı — Ctrl+C');
      return;
    }
    navigator.clipboard.writeText(metin).then(function () {
      bildir(dugme, 'kopyalandı ✓');
    }, function () {
      bildir(dugme, seciliYap(metin) ? 'kopyalandı ✓' : 'kopyalanamadı — Ctrl+C');
    });
  }

  var liste = document.getElementById('liste');

  hedefler.forEach(function (h) {
    var kart = document.createElement('div');
    kart.className = 'kart';
    kart.dataset.gonderildi = durum[h.domain] ? '1' : '0';

    var baslik = document.createElement('h2');
    baslik.textContent = h.sira + '. ' + h.ad;
    kart.appendChild(baslik);

    var meta = document.createElement('div');
    meta.className = 'meta';
    meta.textContent = (h.instagram ? '@' + h.instagram + ' · ' : '') + h.domain
      + (h.ozet ? ' · ' + h.ozet : '')
      + (h.sayimTarihi ? ' · sayım ' + h.sayimTarihi : '');
    kart.appendChild(meta);

    var mesaj = document.createElement('pre');
    mesaj.textContent = h.mesaj;
    kart.appendChild(mesaj);

    var dugmeler = document.createElement('div');
    dugmeler.className = 'dugmeler';

    if (h.kanit) {
      var kanit = document.createElement('a');
      kanit.className = 'dugme';
      kanit.href = h.kanit;
      kanit.target = '_blank';
      kanit.rel = 'noopener';
      kanit.textContent = 'Kanıtı aç';
      dugmeler.appendChild(kanit);
    }

    if (h.dm) {
      var dm = document.createElement('a');
      dm.className = 'dugme birincil';
      dm.href = h.dm;
      dm.target = '_blank';
      dm.rel = 'noopener';
      dm.textContent = "DM'i aç";
      dugmeler.appendChild(dm);
    }

    var kop = document.createElement('button');
    kop.textContent = 'Metni kopyala';
    kop.addEventListener('click', function () { kopyala(h.mesaj, kop); });
    dugmeler.appendChild(kop);

    var etiket = document.createElement('label');
    etiket.className = 'isaret';
    var kutu = document.createElement('input');
    kutu.type = 'checkbox';
    kutu.checked = Boolean(durum[h.domain]);
    kutu.addEventListener('change', function () {
      if (kutu.checked) { durum[h.domain] = true; } else { delete durum[h.domain]; }
      kart.dataset.gonderildi = kutu.checked ? '1' : '0';
      kaydet();
    });
    etiket.appendChild(kutu);
    etiket.appendChild(document.createTextNode('gönderildi'));
    dugmeler.appendChild(etiket);

    kart.appendChild(dugmeler);
    liste.appendChild(kart);
  });

  document.getElementById('komutKopyala').addEventListener('click', function (e) {
    kopyala(document.getElementById('komut').textContent, e.target);
  });

  tazele();
})();
</script>
</body>
</html>
`;
}
