/** `leads_ranked.csv` — puana göre sıralı tam liste. */
import type { DatabaseSync } from 'node:sqlite';
import { tumLeadler } from '../db.ts';
import { puanla } from '../score.ts';
import { csvYaz } from './csv.ts';

const BASLIKLAR = [
  'domain', 'shop_name', 'platform', 'email', 'instagram', 'ulke',
  'urun_sayisi', 'benzer_urun_ozelligi', 'segment', 'olcek', 'skor', 'durum',
  'kaynak', 'notlar', 'puan_dokumu',
] as const;

/** Üçlü mantığı insanın okuyabileceği hale getirir. */
function benzerMetni(v: boolean | null): string {
  if (v === null) return 'bakilmadi';
  return v ? 'var' : 'yok';
}

export function yazLeadsCsv(db: DatabaseSync, yol: string): number {
  const leadler = tumLeadler(db);
  const satirlar = leadler.map((l) => {
    const d = puanla(l);
    const dokum = Object.entries(d.kalemler).filter(([, v]) => v > 0).map(([k, v]) => `${k}+${v}`).join(' ');
    return [
      l.domain, l.shop_name, l.platform, l.email, l.instagram, l.country,
      l.product_count, benzerMetni(l.has_similar_feature as boolean | null), l.segment,
      l.olcek, l.score, l.durum, l.source, l.notes, dokum || 'sifir',
    ];
  });
  csvYaz(yol, BASLIKLAR, satirlar);
  return satirlar.length;
}
