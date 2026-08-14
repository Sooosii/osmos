'use client';

import { useEffect, useRef } from 'react';
import { takimyildizIlerlemesi } from '@/lib/acilis-takimyildizi';
import { takimyildizSahnesi } from '@/lib/acilis-takimyildizi-geometri';
import { prefersReducedMotion } from '@/lib/motion';

interface AcilisTakimyildiziProps {
  readonly onEngage: () => void;
  readonly onComplete: () => void;
}

const BACKGROUND = '#050507';
const EDGE = '#c9bfb4';

/** OSMOS uzayına, verinin kendi renkleriyle çizilen tek hafif giriş hareketi. */
export function AcilisTakimyildizi({ onEngage, onComplete }: AcilisTakimyildiziProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onEngageRef = useRef(onEngage);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onEngageRef.current = onEngage;
    onCompleteRef.current = onComplete;
  }, [onComplete, onEngage]);

  useEffect(() => {
    if (prefersReducedMotion()) {
      onCompleteRef.current();
      return;
    }

    const root = rootRef.current;
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!root || !canvas || !context) {
      onCompleteRef.current();
      return;
    }

    let targetProgress = 0;
    let drawnProgress = 0;
    let frameId: number | null = null;
    let width = 1;
    let height = 1;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    let backgroundGradient: CanvasGradient | null = null;
    let engaged = false;
    let completed = false;
    let pointerId: number | null = null;
    let pointerY = 0;

    const engage = () => {
      if (engaged) return;
      engaged = true;
      onEngageRef.current();
    };

    const complete = () => {
      if (completed) return;
      completed = true;
      onCompleteRef.current();
    };

    const sizeCanvas = () => {
      const box = root.getBoundingClientRect();
      width = Math.max(1, Math.round(box.width));
      height = Math.max(1, Math.round(box.height));
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);

      backgroundGradient = context.createRadialGradient(
        width * 0.48,
        height * 0.56,
        0,
        width * 0.48,
        height * 0.56,
        Math.max(width, height) * 0.72,
      );
      backgroundGradient.addColorStop(0, '#11101a');
      backgroundGradient.addColorStop(0.54, '#08080d');
      backgroundGradient.addColorStop(1, BACKGROUND);
    };

    const draw = (progress: number) => {
      const scene = takimyildizSahnesi(progress, { width, height });
      context.clearRect(0, 0, width, height);

      if (backgroundGradient && scene.backdropAlpha > 0) {
        context.globalAlpha = scene.backdropAlpha;
        context.fillStyle = backgroundGradient;
        context.fillRect(0, 0, width, height);
      }

      if (scene.edgeAlpha > 0) {
        context.globalAlpha = scene.edgeAlpha;
        context.strokeStyle = EDGE;
        context.lineWidth = 0.7;
        context.beginPath();
        for (const edge of scene.edges) {
          const from = scene.nodes[edge.from];
          const to = scene.nodes[edge.to];
          context.moveTo(from.x, from.y);
          context.lineTo(to.x, to.y);
        }
        context.stroke();
      }

      for (const node of scene.nodes) {
        context.globalAlpha = node.alpha;
        context.fillStyle = node.color;
        context.beginPath();
        context.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        context.fill();
      }

      for (const particle of scene.mist) {
        if (particle.alpha <= 0) continue;
        context.globalAlpha = particle.alpha;
        context.fillStyle = particle.color;
        context.beginPath();
        context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        context.fill();
      }

      context.globalAlpha = 1;
    };

    const tick = () => {
      frameId = null;
      const distance = targetProgress - drawnProgress;
      drawnProgress =
        Math.abs(distance) < 0.0008 ? targetProgress : drawnProgress + distance * 0.22;
      draw(drawnProgress);

      if (targetProgress >= 1 && drawnProgress >= 0.998) {
        complete();
        return;
      }
      if (Math.abs(targetProgress - drawnProgress) >= 0.0008) {
        frameId = requestAnimationFrame(tick);
      }
    };

    const schedule = () => {
      if (frameId === null) frameId = requestAnimationFrame(tick);
    };

    const moveTarget = (delta: number) => {
      engage();
      targetProgress = takimyildizIlerlemesi(targetProgress, delta, height);
      schedule();
    };

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      moveTarget(event.deltaY);
    };

    const onPointerDown = (event: PointerEvent) => {
      pointerId = event.pointerId;
      pointerY = event.clientY;
      root.setPointerCapture?.(event.pointerId);
    };

    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerId !== pointerId) return;
      event.preventDefault();
      const delta = pointerY - event.clientY;
      pointerY = event.clientY;
      moveTarget(delta);
    };

    const onPointerEnd = (event: PointerEvent) => {
      if (event.pointerId !== pointerId) return;
      pointerId = null;
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (!['ArrowDown', 'PageDown', 'End', 'Enter', ' '].includes(event.key)) return;
      event.preventDefault();
      engage();
      targetProgress = 1;
      schedule();
    };

    const onResize = () => {
      sizeCanvas();
      draw(drawnProgress);
    };

    sizeCanvas();
    draw(0);
    root.addEventListener('wheel', onWheel, { passive: false });
    root.addEventListener('pointerdown', onPointerDown);
    root.addEventListener('pointermove', onPointerMove);
    root.addEventListener('pointerup', onPointerEnd);
    root.addEventListener('pointercancel', onPointerEnd);
    window.addEventListener('keydown', onKeyDown, true);
    window.addEventListener('resize', onResize);

    return () => {
      if (frameId !== null) cancelAnimationFrame(frameId);
      root.removeEventListener('wheel', onWheel);
      root.removeEventListener('pointerdown', onPointerDown);
      root.removeEventListener('pointermove', onPointerMove);
      root.removeEventListener('pointerup', onPointerEnd);
      root.removeEventListener('pointercancel', onPointerEnd);
      window.removeEventListener('keydown', onKeyDown, true);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <div
      ref={rootRef}
      data-opening-gate="true"
      aria-hidden="true"
      className="fixed inset-0 z-70 cursor-ns-resize"
      style={{ touchAction: 'none' }}
    >
      <canvas ref={canvasRef} aria-hidden="true" className="block h-full w-full" />
    </div>
  );
}
