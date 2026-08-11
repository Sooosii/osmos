import { describe, expect, test } from 'vitest';
import { PERFUMES, getPerfume } from '@/data/perfumes';
import { characterVector, nearestNeighbors, similarity } from '@/lib/similarity';
import { MIN_NOSE_PERFUMES, NEXT_COUNT, noseOf, noseReport } from '@/lib/nose';

/**
 * Burun raporu.
 *
 * Sayılar elle uydurulmuyor: kurgular veriden **türetiliyor** (en yakın /
 * en uzak komşu). Parfüm eklendiğinde sınamalar kendiliğinden yeni veriye
 * uyuyor; sabit kimlik yazılsaydı 53. parfümde kırılırlardı.
 */

const anchor = PERFUMES[0];

/** Çapaya en çok benzeyen `count` parfüm. */
function closest(count: number): string[] {
  return nearestNeighbors(anchor, PERFUMES, count).map((n) => n.perfume.id);
}

/** Çapaya en az benzeyen parfüm. */
function farthest(): string {
  return [...PERFUMES]
    .filter((perfume) => perfume.id !== anchor.id)
    .sort((a, b) => similarity(anchor, a) - similarity(anchor, b))[0].id;
}

describe('noseReport — kapi', () => {
  test('MIN_NOSE_PERFUMES altinda rapor YOK', () => {
    /*
      Tek parfümle rapor "sen %100 bu parfümsün" derdi — bilgi değil
      papağanlık. Sayfa bu durumda davet satırı çiziyor.
    */
    const ids = closest(MIN_NOSE_PERFUMES - 2);
    expect(noseReport([anchor.id, ...ids], [], [])).toBeNull();
  });

  test('MIN_NOSE_PERFUMES ile rapor cikiyor', () => {
    const ids = [anchor.id, ...closest(MIN_NOSE_PERFUMES - 1)];
    expect(noseReport(ids, [], [])?.count).toBe(MIN_NOSE_PERFUMES);
  });

  test('veride olmayan kimlik sessizce eleniyor', () => {
    const ids = [anchor.id, ...closest(MIN_NOSE_PERFUMES - 1)];
    const report = noseReport([...ids, 'yok-boyle-bir-parfum'], [], []);
    expect(report?.count).toBe(MIN_NOSE_PERFUMES);
  });

  test('yinelenen kimlik bir kez sayiliyor', () => {
    const ids = [anchor.id, ...closest(MIN_NOSE_PERFUMES - 1)];
    expect(noseReport([...ids, anchor.id], [], [])?.count).toBe(MIN_NOSE_PERFUMES);
  });
});

describe('noseOf', () => {
  test('burun her eksende okunanlarin ARASINDA kaliyor', () => {
    /*
      ⚠️ Bu bir matematik garantisi, gözlem değil: birleşik burnun karakter
      vektörü, okunan parfümlerin karakter vektörlerinin **dışbükey
      bileşimi** (ağırlıklar `ölçek × toplam nota ağırlığı`). Dolayısıyla
      hiçbir eksende onların dışına çıkamaz.

      Sınama bunu tutuyor çünkü garanti bozulursa rapor kişiye, koleksiyonunda
      hiç olmayan bir uç karakter atfeder — sessizce ve inandırıcı biçimde.
    */
    const ids = [anchor.id, ...closest(4)];
    const nose = noseOf(ids, []);
    expect(nose).not.toBeNull();

    const mine = characterVector(nose!);
    const theirs = ids.map((id) => characterVector(getPerfume(id)));

    for (let axis = 0; axis < 4; axis += 1) {
      const column = theirs.map((vector) => vector[axis]);
      expect(mine[axis]).toBeGreaterThanOrEqual(Math.min(...column) - 1e-9);
      expect(mine[axis]).toBeLessThanOrEqual(Math.max(...column) + 1e-9);
    }
  });

  test('bos girdide null', () => {
    expect(noseOf([], [])).toBeNull();
    expect(noseOf(['yok-boyle'], [])).toBeNull();
  });

  test('nota agirliklari 0–1 araliginda kaliyor', () => {
    /* `PerfumeNote.weight` sözleşmesi: motor bu aralığı varsayıyor. */
    const nose = noseOf([anchor.id, ...closest(6)], [])!;
    for (const note of nose.notes) {
      expect(note.weight).toBeGreaterThan(0);
      expect(note.weight).toBeLessThanOrEqual(1);
    }
  });

  test('TOP 4 CIFT AGIRLIK — olculuyor', () => {
    /*
      ⚠️ Kararın kendisi: Top 4 bir **iddia**, raf bir **kayıt**. Yirmi raf
      kaydı, özenle seçilmiş dördü boğmamalı. Ağırlık kalkarsa bu sınama
      düşer.
    */
    const others = closest(3);
    const ids = [anchor.id, ...others];

    const plain = noseOf(ids, [])!;
    const favoured = noseOf(ids, [anchor.id])!;

    expect(similarity(favoured, anchor)).toBeGreaterThan(similarity(plain, anchor));
  });
});

describe('noseReport — icerik', () => {
  const ids = [anchor.id, ...closest(5)];

  test('aile paylari 1e topluyor', () => {
    const report = noseReport(ids, [], [])!;
    const sum = report.families.reduce((total, entry) => total + entry.share, 0);
    /* En güçlü beş satır gösteriliyor, yani toplam 1'i AŞMAMALI. */
    expect(sum).toBeGreaterThan(0);
    expect(sum).toBeLessThanOrEqual(1 + 1e-9);
  });

  test('aileler gucluden zayifa sirali', () => {
    const report = noseReport(ids, [], [])!;
    const shares = report.families.map((entry) => entry.share);
    expect([...shares].sort((a, b) => b - a)).toEqual(shares);
  });

  test('dort eksen de 0–1 arasinda', () => {
    const report = noseReport(ids, [], [])!;
    expect(report.feel).toHaveLength(4);
    for (const value of report.feel) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(1);
    }
  });

  test('oneri RAFTAKILERI icermiyor', () => {
    /* Zaten bildiğin şeyi önermek boş; istek listesi de öneriden düşüyor. */
    const report = noseReport(ids, [], ids)!;
    for (const id of report.nextIds) {
      expect(ids).not.toContain(id);
    }
    expect(report.nextIds).toHaveLength(NEXT_COUNT);
  });

  test('yabanci gercekten yabanci', () => {
    const alien = farthest();
    const report = noseReport([anchor.id, ...closest(2), alien], [], [])!;
    expect(report.outlierId).toBe(alien);
  });

  test('dar koleksiyon genis koleksiyondan DAHA DAR', () => {
    const tight = noseReport([anchor.id, ...closest(2)], [], [])!;
    const loose = noseReport([anchor.id, closest(1)[0], farthest()], [], [])!;
    expect(tight.breadth).toBeLessThan(loose.breadth);
  });

  test('genislik 0–1 arasinda', () => {
    const report = noseReport(ids, [], [])!;
    expect(report.breadth).toBeGreaterThanOrEqual(0);
    expect(report.breadth).toBeLessThanOrEqual(1);
  });
});

describe('noseReport — kararlilik', () => {
  test('ayni girdi ayni cikti — rastgelelik yok', () => {
    const ids = [anchor.id, ...closest(4)];
    expect(noseReport(ids, [], [])).toEqual(noseReport(ids, [], []));
  });

  test('girdi SIRASI sonucu degistirmiyor', () => {
    /*
      Raf "yeniden eskiye" okunuyor; kişi bir parfümü raftan çıkarıp geri
      koyduğunda raporunun değişmesi anlamsız olurdu.
    */
    const ids = [anchor.id, ...closest(4)];
    expect(noseReport([...ids].reverse(), [], [])).toEqual(noseReport(ids, [], []));
  });
});
