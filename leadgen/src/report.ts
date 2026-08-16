/**
 * Özet rapor — sahibin istediği dört sayı.
 *
 * ⚠️ Apify harcaması TAHMİNDEN değil `spend` tablosundan okunuyor. Tahminle
 * yazılan bir harcama satırı, bütçe kapısının bütün anlamını yok ederdi.
 */
import type { DatabaseSync } from 'node:sqlite';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { toplamHarcama, tumLeadler } from './db.ts';
import type { Lead } from './types.ts';

function say<T extends string>(liste: readonly Lead[], alan: (l: Lead) => T): ReadonlyMap<T, number> {
  const m = new Map<T, number>();
  for (const l of liste) m.set(alan(l), (m.get(alan(l)) ?? 0) + 1);
  return new Map([...m.entries()].sort((a, b) => b[1] - a[1]));
}

const tablo = (baslik: string, m: ReadonlyMap<string, number>, toplam: number): string =>
  [`| ${baslik} | adet | pay |`, '|---|---:|---:|',
    ...[...m].map(([k, v]) => `| ${k} | ${v} | %${Math.round((v / Math.max(toplam, 1)) * 100)} |`)].join('\n');

export function yazRapor(db: DatabaseSync, yol: string): string {
  const hepsi = tumLeadler(db);
  const epostali = hepsi.filter((l) => l.email !== null && l.email !== '');
  const instali = hepsi.filter((l) => l.instagram !== null && l.instagram !== '');
  const olculen = hepsi.filter((l) => l.durum === 'zenginlestirildi');
  const benzeriYok = hepsi.filter((l) => l.has_similar_feature === false);
  const harcama = toplamHarcama(db);
  const n = hepsi.length;

  const metin = `# OSMOS — müşteri adayı özeti

Üretim tarihi: ${new Date().toISOString().slice(0, 16).replace('T', ' ')}

## Sayılar

| ölçüm | değer |
|---|---:|
| toplam aday | ${n} |
| ölçülebilen (zenginleştirildi) | ${olculen.length} |
| e-postası bulunan | ${epostali.length} (%${Math.round((epostali.length / Math.max(n, 1)) * 100)}) |
| Instagram hesabı bulunan | ${instali.length} |
| **benzer-ürün özelliği olmayan** (asıl hedef) | **${benzeriYok.length}** |
| 60 puan ve üzeri | ${hepsi.filter((l) => l.score >= 60).length} |

## Segment dağılımı

${tablo('segment', say(hepsi, (l) => l.segment), n)}

## Ölçek dağılımı

Sahibin kararı: **kimse elenmiyor**, ölçek yalnız bilgi.

${tablo('ölçek', say(hepsi, (l) => l.olcek), n)}

## Altyapı dağılımı

${tablo('platform', say(hepsi, (l) => l.platform), n)}

## Durum

${tablo('durum', say(hepsi, (l) => l.durum), n)}

## Apify harcaması

**$${harcama.toFixed(2)}** — \`spend\` tablosundan okundu, tahmin değil.
${harcama === 0 ? '\nFaz A ücretsiz kaynaklarla koştu: tek kuruş harcanmadı.' : ''}

## En iyi on aday

| # | domain | skor | segment | e-posta | benzer-ürün |
|---:|---|---:|---|---|---|
${hepsi.slice(0, 10).map((l, i) => `| ${i + 1} | ${l.domain} | ${l.score} | ${l.segment} | ${l.email ?? '—'} | ${l.has_similar_feature === null ? 'bakılmadı' : l.has_similar_feature ? 'var' : 'yok'} |`).join('\n')}
`;

  mkdirSync(dirname(yol), { recursive: true });
  writeFileSync(yol, metin, 'utf8');
  return metin;
}
