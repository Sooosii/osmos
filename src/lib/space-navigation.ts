export const WARP_DURATION_MS = 450;

interface NavigableSpace {
  readonly id: number;
  readonly marks: readonly { readonly id: string }[];
}

export function resolveSpaceId(
  spaces: readonly NavigableSpace[],
  requestedSpace: string | null,
  markId: string | null,
): number {
  if (markId) {
    const owner = spaces.find((space) => space.marks.some((mark) => mark.id === markId));
    if (owner) return owner.id;
  }

  const parsed = requestedSpace === null ? Number.NaN : Number(requestedSpace);
  if (Number.isInteger(parsed) && spaces.some((space) => space.id === parsed)) return parsed;
  return spaces[0]?.id ?? 1;
}

export function adjacentSpaceId(
  spaces: readonly NavigableSpace[],
  currentId: number,
  direction: -1 | 1,
): number | null {
  const currentIndex = spaces.findIndex((space) => space.id === currentId);
  if (currentIndex < 0) return null;
  return spaces[currentIndex + direction]?.id ?? null;
}

export function searchForSpace(current: URLSearchParams, targetSpaceId: number): string {
  const next = new URLSearchParams(current);
  next.delete('mark');
  next.delete('feel');
  if (targetSpaceId === 1) next.delete('space');
  else next.set('space', String(targetSpaceId));
  const query = next.toString();
  return query ? `?${query}` : '';
}

export function searchForPerfume(spaceId: number, perfumeId: string): string {
  const search = new URLSearchParams();
  if (spaceId !== 1) search.set('space', String(spaceId));
  search.set('mark', perfumeId);
  return `?${search.toString()}`;
}

export interface WarpFrame {
  readonly progress: number;
  readonly showTarget: boolean;
  readonly done: boolean;
}

export function warpFrame(elapsedMs: number): WarpFrame {
  const progress = Math.min(1, Math.max(0, elapsedMs / WARP_DURATION_MS));
  return {
    progress,
    showTarget: progress >= 0.5,
    done: progress >= 1,
  };
}
