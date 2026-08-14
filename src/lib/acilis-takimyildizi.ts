export const TAKIMYILDIZ_SCROLL_SCREENS = 2.2;

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
  const squeezeIn = smoothRange(value, 0.3, 0.46);
  const squeezeOut = smoothRange(value, 0.46, 0.66);

  return {
    assemble: smoothRange(value, 0.02, 0.3),
    squeeze: squeezeIn * (1 - squeezeOut),
    mist: smoothRange(value, 0.34, 0.52) * (1 - smoothRange(value, 0.76, 0.96)),
    dissolve: smoothRange(value, 0.6, 1),
    reveal: smoothRange(value, 0.77, 1),
  };
}
