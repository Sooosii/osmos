export const TAKIMYILDIZ_SCROLL_SCREENS = 0.9;

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function smoothRange(value: number, start: number, end: number): number {
  const t = clamp01((value - start) / (end - start));
  return t * t * (3 - 2 * t);
}

export function takimyildizIlerlemesi(
  current: number,
  deltaPixels: number,
  viewportHeight: number,
): number {
  if (viewportHeight <= 0) return clamp01(current);
  return clamp01(current + deltaPixels / (viewportHeight * TAKIMYILDIZ_SCROLL_SCREENS));
}

export function takimyildizFazlari(progress: number) {
  const value = clamp01(progress);

  return {
    hint: 1 - smoothRange(value, 0, 0.18),
    gather: smoothRange(value, 0.12, 0.48),
    release: smoothRange(value, 0.42, 0.86),
    reveal: smoothRange(value, 0.52, 1),
  };
}
