/** Lightweight, deterministic canvas transition between perfume spaces. */
export function drawSpaceWarp(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  progress: number,
  direction: -1 | 1,
): void {
  const p = Math.min(1, Math.max(0, progress));
  if (p <= 0 || p >= 1) return;

  const intensity = Math.sin(Math.PI * p);
  const travel = width * (0.04 + intensity * 0.22);

  ctx.save();
  ctx.fillStyle = `rgba(0, 0, 0, ${0.9 * intensity ** 2})`;
  ctx.fillRect(0, 0, width, height);

  ctx.globalCompositeOperation = 'screen';
  ctx.lineCap = 'round';
  for (let index = 0; index < 38; index += 1) {
    const seed = (index * 0.61803398875) % 1;
    const y = seed * height;
    const depth = 0.25 + ((index * 17) % 29) / 29;
    const length = travel * depth;
    const anchor = ((index * 83) % 101) / 101 * width;
    const tail = anchor - direction * length;
    const alpha = intensity * (0.08 + depth * 0.24);

    const gradient = ctx.createLinearGradient(tail, y, anchor, y);
    gradient.addColorStop(0, 'rgba(255,255,255,0)');
    gradient.addColorStop(1, `rgba(255,255,255,${alpha})`);
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 0.4 + depth * 1.2;
    ctx.beginPath();
    ctx.moveTo(tail, y);
    ctx.lineTo(anchor, y);
    ctx.stroke();
  }

  ctx.restore();
}
