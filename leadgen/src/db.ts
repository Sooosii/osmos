/**
 * Veritabanı katmanı — Node 24'ün gömülü `node:sqlite`ı.
 *
 * ⚠️ `better-sqlite3` bilerek seçilmedi: Windows'ta yerel derleme istiyor ve
 * bu boru hattının başka hiçbir bağımlılığı yok. Gömülü sürücüyle `leadgen`
 * `npm install` bile gerektirmiyor.
 *
 * ⚠️ `node:sqlite` `undefined` bağlamayı reddediyor ve `boolean` bilmiyor;
 * sınıra giren her değer bu yüzden `sqlDeger` içinden geçiyor. Bu koruma
 * olmadan tek bir `undefined` bütün çalıştırmayı ortadan ikiye bölüyor.
 */
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import type { Evidence, Lead, Spend, UclyMantik } from './types.ts';

const SEMA = `
CREATE TABLE IF NOT EXISTS leads (
  id                  INTEGER PRIMARY KEY,
  domain              TEXT NOT NULL UNIQUE,
  shop_name           TEXT,
  platform            TEXT NOT NULL DEFAULT 'bilinmiyor',
  email               TEXT,
  instagram           TEXT,
  country             TEXT,
  product_count       INTEGER,
  has_similar_feature INTEGER,
  segment             TEXT NOT NULL DEFAULT 'bilinmiyor',
  olcek               TEXT NOT NULL DEFAULT 'bilinmiyor',
  score               INTEGER NOT NULL DEFAULT 0,
  durum               TEXT NOT NULL DEFAULT 'yeni',
  source              TEXT NOT NULL,
  notes               TEXT,
  seed_url            TEXT,
  updated_at          TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS evidence (
  id          INTEGER PRIMARY KEY,
  lead_id     INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  kind        TEXT NOT NULL,
  url         TEXT NOT NULL,
  snippet     TEXT NOT NULL,
  http_status INTEGER,
  fetched_at  TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS evidence_lead ON evidence(lead_id, kind);

CREATE TABLE IF NOT EXISTS temas (
  id      INTEGER PRIMARY KEY,
  domain  TEXT NOT NULL,
  kanal   TEXT NOT NULL,
  sonuc   TEXT NOT NULL,
  not_    TEXT,
  tarih   TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS temas_domain ON temas(domain);

CREATE TABLE IF NOT EXISTS spend (
  id      INTEGER PRIMARY KEY,
  run_id  TEXT NOT NULL,
  actor   TEXT NOT NULL,
  unit    TEXT NOT NULL,
  units   REAL NOT NULL,
  usd     REAL NOT NULL,
  at      TEXT NOT NULL
);
`;

type SqlDeger = string | number | null;

/** `undefined` ve `boolean`ı SQLite'ın anladığı biçime indirir. */
function sqlDeger(v: string | number | boolean | null | undefined): SqlDeger {
  if (v === undefined || v === null) return null;
  if (typeof v === 'boolean') return v ? 1 : 0;
  return v;
}

/**
 * Eksik sütunları ekler — şemanın ileri doğru göçü.
 *
 * ⚠️ `CREATE TABLE IF NOT EXISTS` var olan bir tabloya sütun EKLEMEZ, sessizce
 * atlar. Yeni bir sütun eklendiğinde eski veritabanı olduğu gibi kalır ve ilk
 * yazma denemesi "table leads has no column named …" diye patlar.
 *
 * Bu, dev makinesinde bir dakikalık sıkıntı ama sahibin veritabanında
 * SAATLERCE gezme emeği duruyor: göç yoksa tek çıkış yolu dosyayı silip her
 * şeyi baştan taramak olur. Deponun kendi dersi de aynı yöne bakıyor —
 * geç uygulanan bir göç bir kez canlıda 500 verdirmişti.
 *
 * Yalnız EKLEME yapılıyor: sütun silme ya da tip değiştirme yok, o yüzden
 * geri dönülemez bir şey olmuyor.
 */
function eksikSutunlariEkle(db: DatabaseSync): void {
  const beklenen: readonly (readonly [string, string])[] = [
    ['olcek', "TEXT NOT NULL DEFAULT 'bilinmiyor'"],
    ['seed_url', 'TEXT'],
  ];
  const mevcut = new Set(
    (db.prepare('PRAGMA table_info(leads)').all() as unknown as { name: string }[]).map((r) => r.name),
  );
  for (const [ad, tanim] of beklenen) {
    if (!mevcut.has(ad)) db.exec(`ALTER TABLE leads ADD COLUMN ${ad} ${tanim}`);
  }
}

export function acVeritabani(yol: string): DatabaseSync {
  mkdirSync(dirname(yol), { recursive: true });
  const db = new DatabaseSync(yol);
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec(SEMA);
  eksikSutunlariEkle(db);
  return db;
}

/**
 * Alan adı üstünden ekler ya da günceller.
 *
 * ⚠️ `COALESCE(excluded.x, leads.x)` kalıbı bilerek: zenginleştirici bir turda
 * e-postayı bulup diğerinde bulamayabilir (site o an 503 verir). Düz `SET`
 * olsaydı ikinci tur ilk turun bulduğunu **silerdi** — ve bu, kaybı sessiz
 * olduğu için ancak CSV'de fark edilirdi.
 */
export function upsertLead(db: DatabaseSync, lead: Partial<Lead> & { domain: string }): number {
  const simdi = new Date().toISOString();
  db.prepare(`
    INSERT INTO leads (domain, shop_name, platform, email, instagram, country,
                       product_count, has_similar_feature, segment, olcek, score,
                       durum, source, notes, seed_url, updated_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    ON CONFLICT(domain) DO UPDATE SET
      shop_name           = COALESCE(excluded.shop_name, leads.shop_name),
      platform            = CASE WHEN excluded.platform = 'bilinmiyor' THEN leads.platform ELSE excluded.platform END,
      email               = COALESCE(excluded.email, leads.email),
      instagram           = COALESCE(excluded.instagram, leads.instagram),
      country             = COALESCE(excluded.country, leads.country),
      product_count       = COALESCE(excluded.product_count, leads.product_count),
      has_similar_feature = COALESCE(excluded.has_similar_feature, leads.has_similar_feature),
      segment             = CASE WHEN excluded.segment = 'bilinmiyor' THEN leads.segment ELSE excluded.segment END,
      olcek               = CASE WHEN excluded.olcek = 'bilinmiyor' THEN leads.olcek ELSE excluded.olcek END,
      score               = excluded.score,
      durum               = excluded.durum,
      notes               = COALESCE(excluded.notes, leads.notes),
      seed_url            = COALESCE(excluded.seed_url, leads.seed_url),
      updated_at          = excluded.updated_at
  `).run(
    lead.domain,
    sqlDeger(lead.shop_name), sqlDeger(lead.platform ?? 'bilinmiyor'),
    sqlDeger(lead.email), sqlDeger(lead.instagram), sqlDeger(lead.country),
    sqlDeger(lead.product_count), sqlDeger(lead.has_similar_feature as UclyMantik),
    sqlDeger(lead.segment ?? 'bilinmiyor'), sqlDeger(lead.olcek ?? 'bilinmiyor'), sqlDeger(lead.score ?? 0),
    sqlDeger(lead.durum ?? 'yeni'), sqlDeger(lead.source ?? 'bilinmiyor'),
    sqlDeger(lead.notes), sqlDeger(lead.seed_url), simdi,
  );
  const satir = db.prepare('SELECT id FROM leads WHERE domain = ?').get(lead.domain) as { id: number };
  return satir.id;
}

export function ekleKanit(db: DatabaseSync, k: Omit<Evidence, 'fetched_at'> & { fetched_at?: string }): void {
  db.prepare('INSERT INTO evidence (lead_id, kind, url, snippet, http_status, fetched_at) VALUES (?,?,?,?,?,?)')
    .run(k.lead_id, k.kind, k.url, k.snippet.slice(0, 2000), sqlDeger(k.http_status), k.fetched_at ?? new Date().toISOString());
}

export function kanitlar(db: DatabaseSync, leadId: number): readonly Evidence[] {
  return db.prepare('SELECT * FROM evidence WHERE lead_id = ? ORDER BY id').all(leadId) as unknown as Evidence[];
}

export function ekleHarcama(db: DatabaseSync, s: Omit<Spend, 'at'> & { at?: string }): void {
  db.prepare('INSERT INTO spend (run_id, actor, unit, units, usd, at) VALUES (?,?,?,?,?,?)')
    .run(s.run_id, s.actor, s.unit, s.units, s.usd, s.at ?? new Date().toISOString());
}

export function toplamHarcama(db: DatabaseSync): number {
  const r = db.prepare('SELECT COALESCE(SUM(usd), 0) AS t FROM spend').get() as { t: number };
  return r.t;
}

/**
 * SQLite satırını Lead'e çevirir.
 *
 * ⚠️ BU DÖNÜŞÜM ZORUNLU, süs değil. SQLite'ta `boolean` yok: yazarken 1/0'a
 * indiriliyor ve okurken 1/0 olarak geri geliyor. Kod boyunca `=== false`
 * diye bakılan her yer (puanlama, rapor, açılış cümlesi) o zaman SESSİZCE
 * yanlış cevap verir — çünkü `0 === false` yanlıştır.
 *
 * Bir kez yaşandı: "benzer-ürün yok" +20 puanı hiç kimseye verilmedi,
 * rapor da hedef kitleyi 0 kişi gösterdi. Hiçbir yerde hata çıkmadı,
 * yalnızca sayılar sessizce yanlıştı. Sınır tek yerde, burada.
 */
function satirdanLead(satir: Record<string, unknown>): Lead {
  const ham = satir['has_similar_feature'];
  return {
    ...(satir as unknown as Lead),
    has_similar_feature: ham === null || ham === undefined ? null : ham === 1 || ham === true,
  };
}

export function tumLeadler(db: DatabaseSync): readonly Lead[] {
  return db.prepare('SELECT * FROM leads ORDER BY score DESC, domain ASC')
    .all()
    .map((s: unknown) => satirdanLead(s as Record<string, unknown>));
}

/**
 * Temas defteri — kime, hangi kanaldan, ne zaman yazıldı.
 *
 * ⚠️ Ayrı bir tablo, `leads.durum` değil. İkisi bambaşka şeyler: `durum`
 * boru hattının o adayı ölçüp ölçemediğini söylüyor, temas ise sahibin
 * elle yaptığı işi. Aynı sütuna sıkıştırılsalardı bir sonraki
 * zenginleştirme koşusu "kime yazdım" bilgisini silerdi.
 *
 * ⚠️ Asıl işi tekrarı önlemek: aynı kişiye ikinci kez aynı mesajı atmak,
 * hiç atmamaktan kötü.
 */
export function ekleTemas(
  db: DatabaseSync,
  t: { domain: string; kanal: string; sonuc: string; not?: string | null },
): void {
  db.prepare('INSERT INTO temas (domain, kanal, sonuc, not_, tarih) VALUES (?,?,?,?,?)')
    .run(t.domain, t.kanal, t.sonuc, sqlDeger(t.not), new Date().toISOString());
}

/** Daha önce temas kurulmuş alan adları. */
export function temasKurulanlar(db: DatabaseSync): ReadonlySet<string> {
  const satirlar = db.prepare('SELECT DISTINCT domain FROM temas').all() as unknown as { domain: string }[];
  return new Set(satirlar.map((r) => r.domain));
}

/** Temas özeti — rapordaki "kaç kişiye yazıldı, kaç cevap geldi" satırı. */
export function temasOzeti(db: DatabaseSync): ReadonlyMap<string, number> {
  const satirlar = db.prepare('SELECT sonuc, COUNT(*) AS n FROM temas GROUP BY sonuc ORDER BY n DESC')
    .all() as unknown as { sonuc: string; n: number }[];
  return new Map(satirlar.map((r) => [r.sonuc, r.n]));
}
