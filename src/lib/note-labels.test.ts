import { describe, expect, test } from 'vitest';
import { NOTES } from '@/data/notes';
import { PERFUMES } from '@/data/perfumes';
import {
  CENTER_X,
  CENTER_Y,
  LABEL_FADE_MIN,
  LABEL_RISE,
  NOTE_RADIUS,
  VIEW_HEIGHT,
  discRadius,
  noteSeats,
  projectSeat,
} from './note-orbit';
import { buildNotePage, type NoteMark } from './note-marks';
import { placeLabels, type LabelCandidate, type LabelLayout } from './note-labels';

/**
 * Adların yerleşimi.
 *
 * Buradaki asıl sınama sonuncusu: öne dönmüş parfümün adı bir turun HİÇBİR
 * anında kaybolmuyor. Hata tam olarak oradaydı — ad noktanın üstüne yazılıyor,
 * öndeki nokta merkezdeki diskin altında duruyor, ad diske çarpıp atlanıyordu.
 */

const FONT = 11;

/** Sabit genişlikli yazı — gerçek `measureText` yerine geçiyor. */
function measure(text: string): number {
  return text.length * FONT * 0.6;
}

function layout(overrides: Partial<LabelLayout> = {}): LabelLayout {
  return {
    fontSize: FONT,
    rise: LABEL_RISE,
    padding: 5,
    bottom: VIEW_HEIGHT,
    reserved: [
      {
        x0: CENTER_X - NOTE_RADIUS,
        y0: CENTER_Y - NOTE_RADIUS,
        x1: CENTER_X + NOTE_RADIUS,
        y1: CENTER_Y + NOTE_RADIUS,
      },
    ],
    measure,
    ...overrides,
  };
}

function candidate(overrides: Partial<LabelCandidate> = {}): LabelCandidate {
  return { id: 'a', text: 'Megamare', cx: CENTER_X, cy: 40, discRadius: 16, fade: 0.9, ...overrides };
}

describe('placeLabels', () => {
  test('boş sahnede ad noktanın üstüne yazılıyor', () => {
    const [label] = placeLabels([candidate()], layout());

    expect(label.below).toBe(false);
    expect(label.y).toBe(40 - 16 - LABEL_RISE);
  });

  /* Hatanın ta kendisi: öndeki nokta diskin altında, adı diskin üstüne düşüyor. */
  test('yukarısı merkez diskle çakışan ad atlanmıyor, altına iniyor', () => {
    const front = candidate({ cy: 159, discRadius: 18 });

    const [label] = placeLabels([front], layout());

    expect(label).toBeDefined();
    expect(label.below).toBe(true);
    expect(label.y).toBe(159 + 18 + LABEL_RISE + FONT);
  });

  /*
    Son çare: iki yer de kapalıysa ad merkezin üstüne yazılıyor, susmuyor.
    Merkez diski bir tercih, duvar değil — gerekçesi `note-labels.ts`te.
  */
  test('altı da taşıyorsa ad merkezin üstüne yazılıyor', () => {
    const front = candidate({ cy: 159, discRadius: 18 });

    const [label] = placeLabels([front], layout({ bottom: 180 }));

    expect(label).toBeDefined();
    expect(label.below).toBe(false);
    expect(label.y).toBe(159 - 18 - LABEL_RISE);
  });

  test('başka bir ad varsa son çare de kapanıyor ve ad atlanıyor', () => {
    const blocker = candidate({ id: 'once', cy: 159, discRadius: 18, fade: 0.9 });
    const same = candidate({ id: 'sonra', cy: 159, discRadius: 18, fade: 0.8 });

    const placed = placeLabels([blocker, same], layout({ bottom: 180 }));

    expect(placed.map((label) => label.id)).toEqual(['once']);
  });

  test('öne çıkan önce yerleşiyor', () => {
    const placed = placeLabels(
      [candidate({ id: 'arka', fade: 0.2 }), candidate({ id: 'on', fade: 0.95 })],
      layout(),
    );

    expect(placed[0].id).toBe('on');
  });

  test('aynı yere düşen ikinci ad alta iniyor, üste binmiyor', () => {
    // Merkez diskinden uzakta: sınanan şey iki adın birbirine tepkisi.
    const placed = placeLabels(
      [
        candidate({ id: 'bir', cx: 120, fade: 0.9 }),
        candidate({ id: 'iki', cx: 120, fade: 0.8 }),
      ],
      layout(),
    );

    expect(placed).toHaveLength(2);
    expect(placed[0].below).toBe(false);
    expect(placed[1].below).toBe(true);
  });

  test('yerleşen hiçbir ad bir diğerine binmiyor', () => {
    const crowd = Array.from({ length: 12 }, (_, index) =>
      candidate({ id: `p${index}`, cx: CENTER_X + index * 9, cy: 60 + index * 4, fade: 1 - index * 0.05 }),
    );

    const placed = placeLabels(crowd, layout());
    const boxes = placed.map((label) => ({
      x0: label.x - measure(label.text) / 2 - 5,
      y0: label.y - FONT,
      x1: label.x + measure(label.text) / 2 + 5,
      y1: label.y + FONT * 0.35,
    }));

    for (let i = 0; i < boxes.length; i += 1) {
      for (let j = i + 1; j < boxes.length; j += 1) {
        const a = boxes[i];
        const b = boxes[j];
        expect(a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0).toBe(false);
      }
    }
  });
});

/**
 * Gerçek veri, gerçek yörünge.
 *
 * Uydurma taşıyıcılarla başlanmıştı ve yanlış yere götürdü: ağırlık ile derinliğin
 * bağımsız uçlarını eşleştirmek verinin ürettiği aralığın dışına çıkıyor. Bu
 * bölüm 136 notanın hepsini gerçek parfüm listesiyle dolaşıyor.
 */
describe('gerçek yörüngede', () => {
  function frameAt(carriers: readonly NoteMark[], phase: number): readonly LabelCandidate[] {
    const seats = noteSeats(carriers);
    const byId = new Map(carriers.map((carrier) => [carrier.id, carrier]));

    return seats
      .map((seat) => {
        const node = projectSeat(seat, phase);
        const carrier = byId.get(seat.id);
        return {
          id: seat.id,
          text: carrier?.name ?? '',
          cx: node.x,
          cy: node.y,
          discRadius: discRadius(carrier?.weight ?? 0, node.scale),
          fade: node.fade,
        };
      })
      .filter((entry) => entry.fade >= LABEL_FADE_MIN);
  }

  const pages = NOTES.map((note) => buildNotePage(note, PERFUMES)).filter(
    (page) => page.carriers.length > 0,
  );

  /*
    Hatanın regresyon sınaması ve bu dosyanın var olma sebebi.

    Turun her anında en öne dönmüş parfümün adı yazılmak zorunda: sahnenin öznesi
    o ve ekranda susan da oydu. Eski davranışta `white-musk` turun %49'unda,
    `mango` %48'inde susuyordu.
  */
  test('hiçbir notada, hiçbir karede en öndeki ad susmuyor', () => {
    const silent: string[] = [];

    for (const page of pages) {
      for (let step = 0; step < 60; step += 1) {
        const frame = frameAt(page.carriers, (step / 60) * Math.PI * 2);
        if (frame.length === 0) continue;

        const leader = [...frame].sort((a, b) => b.fade - a.fade)[0];
        const placed = placeLabels(frame, layout());
        if (!placed.some((label) => label.id === leader.id)) silent.push(`${page.id}@${step}`);
      }
    }

    expect(silent).toEqual([]);
  });

  /*
    Alta düşen ad tuvalin dışına çıkamaz. Ölçülen en alt nokta 293.1/296 —
    pay 3 piksel, yani `CENTER_Y`, yarıçaplar veya `HEIGHT_SCALE` değişirse
    burası önce kırılır. Kasıtlı: `note-orbit.ts`in taşma sınamasıyla aynı görev.
  */
  test('alta düşen adlar tuvalin içinde kalıyor', () => {
    for (const page of pages) {
      for (let step = 0; step < 60; step += 1) {
        const placed = placeLabels(frameAt(page.carriers, (step / 60) * Math.PI * 2), layout());
        for (const label of placed) {
          expect(label.y + FONT * 0.35).toBeLessThanOrEqual(VIEW_HEIGHT);
        }
      }
    }
  });
});
