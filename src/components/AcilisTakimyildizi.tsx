'use client';

import { useEffect, useRef } from 'react';
import { useDict } from '@/i18n/LocaleProvider';
import { takimyildizFazlari, takimyildizIlerlemesi } from '@/lib/acilis-takimyildizi';
import { takimyildizSahnesi } from '@/lib/acilis-takimyildizi-geometri';
import { prefersReducedMotion } from '@/lib/motion';
import styles from './AcilisTakimyildizi.module.css';

interface AcilisTakimyildiziProps {
  readonly onEngage: () => void;
  readonly onComplete: () => void;
}

const BACKGROUND = '#030305';

function wheelDeltaPixels(event: WheelEvent, viewportHeight: number): number {
  if (event.deltaMode === 1) return event.deltaY * 16;
  if (event.deltaMode === 2) return event.deltaY * viewportHeight;
  return event.deltaY;
}

/** OSMOS yıldızlarını tek nefeste doğrudan canlı koku uzayına açan eşik. */
export function AcilisTakimyildizi({ onEngage, onComplete }: AcilisTakimyildiziProps) {
  const copy = useDict().openingGate;
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onEngageRef = useRef(onEngage);
  const onCompleteRef = useRef(onComplete);
  const requestCompletionRef = useRef<() => void>(() => undefined);

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
        width * 0.5,
        height * 0.5,
        0,
        width * 0.5,
        height * 0.5,
        Math.max(width, height) * 0.74,
      );
      backgroundGradient.addColorStop(0, '#111019');
      backgroundGradient.addColorStop(0.56, '#07070b');
      backgroundGradient.addColorStop(1, BACKGROUND);
    };

    const cutAperture = (aperture: number) => {
      if (aperture <= 0) return;
      const centerX = width * 0.5;
      const centerY = height * 0.5;
      const farthestCorner = Math.hypot(width * 0.5, height * 0.5);
      const outerRadius = farthestCorner * 1.48 * aperture;
      const innerRadius = outerRadius * 0.74;
      const apertureGradient = context.createRadialGradient(
        centerX,
        centerY,
        innerRadius,
        centerX,
        centerY,
        outerRadius,
      );
      apertureGradient.addColorStop(0, 'rgb(0 0 0 / 1)');
      apertureGradient.addColorStop(0.78, 'rgb(0 0 0 / 0.96)');
      apertureGradient.addColorStop(1, 'rgb(0 0 0 / 0)');

      context.save();
      context.globalAlpha = 1;
      context.globalCompositeOperation = 'destination-out';
      context.fillStyle = apertureGradient;
      context.fillRect(0, 0, width, height);
      context.restore();
    };

    const draw = (progress: number) => {
      const scene = takimyildizSahnesi(progress, { width, height });
      const phases = takimyildizFazlari(progress);
      root.style.setProperty('--opening-hint', String(phases.hint));
      context.clearRect(0, 0, width, height);

      if (backgroundGradient) {
        context.globalAlpha = 1;
        context.fillStyle = backgroundGradient;
        context.fillRect(0, 0, width, height);
      }

      context.save();
      context.globalCompositeOperation = 'screen';
      for (const node of scene.nodes) {
        context.globalAlpha = node.alpha;
        context.fillStyle = node.color;
        context.shadowBlur = node.nodeIndex % 7 === 0 ? node.radius * 4.5 : 0;
        context.shadowColor = node.color;
        context.beginPath();
        context.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        context.fill();
      }
      context.restore();

      cutAperture(scene.aperture);
      context.globalAlpha = 1;
      context.globalCompositeOperation = 'source-over';
      root.style.setProperty('--opening-root-bg', '0');
    };

    const tick = () => {
      frameId = null;
      const distance = targetProgress - drawnProgress;
      drawnProgress =
        Math.abs(distance) < 0.0008 ? targetProgress : drawnProgress + distance * 0.24;
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

    const requestCompletion = () => {
      engage();
      targetProgress = 1;
      schedule();
    };

    requestCompletionRef.current = requestCompletion;

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      moveTarget(wheelDeltaPixels(event, height));
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
      requestCompletion();
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
      requestCompletionRef.current = () => undefined;
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
      className={styles.root}
      style={{ touchAction: 'none' }}
    >
      <canvas ref={canvasRef} aria-hidden="true" className={styles.canvas} />
      <div className={styles.invitation} aria-hidden="true">
        <span className={styles.scrollHint}>{copy.scrollHint}</span>
        <span className={styles.touchHint}>{copy.touchHint}</span>
        <span className={styles.gesture} />
      </div>
      <button
        type="button"
        className={styles.skip}
        onClick={() => requestCompletionRef.current()}
      >
        {copy.skip}
      </button>
    </div>
  );
}
