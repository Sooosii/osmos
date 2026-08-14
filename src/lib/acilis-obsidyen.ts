export const OBSIDYEN_SCROLL_SCREENS = 2.2;

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function smoothRange(value: number, start: number, end: number): number {
  const progress = clamp01((value - start) / (end - start));
  return progress * progress * (3 - 2 * progress);
}

export function obsidyenIlerlemesi(
  current: number,
  delta: number,
  viewportHeight: number,
): number {
  const rail = Math.max(1, viewportHeight * OBSIDYEN_SCROLL_SCREENS);
  return clamp01(current + delta / rail);
}

export function obsidyenFazlari(progress: number) {
  const value = clamp01(progress);

  return {
    reveal: smoothRange(value, 0.02, 0.28),
    squeeze:
      smoothRange(value, 0.3, 0.46) * (1 - smoothRange(value, 0.46, 0.66)),
    mist: smoothRange(value, 0.34, 0.52) * (1 - smoothRange(value, 0.72, 0.92)),
    dissolve: smoothRange(value, 0.62, 1),
    spaceReveal: smoothRange(value, 0.76, 1),
    glint: smoothRange(value, 0.04, 0.24) * (1 - smoothRange(value, 0.46, 0.78)),
  };
}
