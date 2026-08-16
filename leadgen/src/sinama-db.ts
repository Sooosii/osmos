/**
 * Sınamalar için geçici veritabanı — kendi ardını toplayan.
 *
 * ⚠️ Bu dosya bir dağınıklığın karşılığı: sınamalar `data/` içine rastgele
 * adlı veritabanları bırakıyordu ve 143 dosya birikmişti. Hepsi git dışında
 * olduğu için kimse görmüyordu, ama gerçek çıktıların (leads.db, CSV'ler)
 * arasında kaybolmaları an meselesiydi.
 *
 * İki iş yapıyor: dosyaları ayrı bir klasöre topluyor ve süreç biterken
 * siliyor.
 */
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { acVeritabani } from './db.ts';

const KLASOR = join(import.meta.dirname, '..', 'data', 'sinama');
let temizlikKuruldu = false;

/** Süreç nasıl biterse bitsin klasörü siler. */
function temizligiKur(): void {
  if (temizlikKuruldu) return;
  temizlikKuruldu = true;
  const sil = (): void => {
    try {
      rmSync(KLASOR, { recursive: true, force: true });
    } catch {
      /* Silinemezse sınama düşmemeli — dağınıklık hata değil. */
    }
  };
  process.on('exit', sil);
}

/** Yeni, boş, geçici bir veritabanı açar. */
export function geciciVeritabani(): DatabaseSync {
  mkdirSync(KLASOR, { recursive: true });
  temizligiKur();
  const ad = `s-${process.pid}-${Math.random().toString(36).slice(2)}.db`;
  return acVeritabani(join(KLASOR, ad));
}
