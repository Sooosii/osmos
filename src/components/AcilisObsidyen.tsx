'use client';

import { useEffect, useRef, type CSSProperties } from 'react';
import { obsidyenFazlari, obsidyenIlerlemesi } from '@/lib/acilis-obsidyen';
import { prefersReducedMotion } from '@/lib/motion';
import styles from './AcilisObsidyen.module.css';

interface AcilisObsidyenProps {
  readonly onEngage: () => void;
  readonly onComplete: () => void;
}

const MIST_PARTICLES = [
  { x: 2, y: 38, size: 6, drift: -2, lift: -4 },
  { x: 5, y: 36, size: 3, drift: -7, lift: -10 },
  { x: 7, y: 40, size: 8, drift: -10, lift: 1 },
  { x: 10, y: 34, size: 4, drift: -13, lift: -8 },
  { x: 12, y: 42, size: 5, drift: -16, lift: 7 },
  { x: 15, y: 37, size: 10, drift: -19, lift: -2 },
  { x: 18, y: 31, size: 3, drift: -23, lift: -13 },
  { x: 20, y: 44, size: 7, drift: -27, lift: 9 },
  { x: 23, y: 35, size: 5, drift: -31, lift: -7 },
  { x: 26, y: 40, size: 11, drift: -35, lift: 4 },
  { x: 29, y: 32, size: 4, drift: -39, lift: -12 },
  { x: 32, y: 43, size: 6, drift: -43, lift: 10 },
] as const;

type MistStyle = CSSProperties & {
  '--mist-x': string;
  '--mist-y': string;
  '--mist-size': string;
  '--mist-drift': string;
  '--mist-lift': string;
};

/** Siyah cam, pirinc ve deriden kurulan tek karelik OSMOS girisi. */
export function AcilisObsidyen({ onEngage, onComplete }: AcilisObsidyenProps) {
  const rootRef = useRef<HTMLDivElement>(null);
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
    if (!root) {
      onCompleteRef.current();
      return;
    }

    let targetProgress = 0;
    let drawnProgress = 0;
    let frameId: number | null = null;
    let height = Math.max(1, root.getBoundingClientRect().height);
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

    const apply = (progress: number) => {
      const phase = obsidyenFazlari(progress);
      const objectAlpha = phase.reveal * (1 - phase.dissolve);

      root.style.setProperty('--obs-backdrop', String(1 - phase.spaceReveal));
      root.style.setProperty('--obs-object', String(objectAlpha));
      root.style.setProperty('--obs-rest', String(1 - phase.squeeze));
      root.style.setProperty('--obs-squeezed', String(phase.squeeze));
      root.style.setProperty('--obs-mist', String(phase.mist * (1 - phase.dissolve)));
      root.style.setProperty('--obs-glint', String(phase.glint * (1 - phase.dissolve)));
      root.style.setProperty('--obs-blur', `${phase.dissolve * 4}px`);
      root.style.setProperty(
        '--obs-scale',
        String(0.975 + phase.reveal * 0.025 + phase.dissolve * 0.07),
      );
      root.style.setProperty('--obs-rise', `${phase.dissolve * -2.5}vh`);
      root.style.setProperty('--obs-mist-drift', `${phase.mist * -7}vw`);
    };

    const tick = () => {
      frameId = null;
      const distance = targetProgress - drawnProgress;
      drawnProgress =
        Math.abs(distance) < 0.0008 ? targetProgress : drawnProgress + distance * 0.22;
      apply(drawnProgress);

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
      targetProgress = obsidyenIlerlemesi(targetProgress, delta, height);
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
      height = Math.max(1, root.getBoundingClientRect().height);
      apply(drawnProgress);
    };

    apply(0);
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
      data-opening-kind="obsidyen"
      aria-hidden="true"
      className={styles.root}
      style={{ touchAction: 'none' }}
    >
      <div className={styles.backdrop} />
      <div className={styles.stage}>
        <div data-obsidyen-frame="rest" className={`${styles.frame} ${styles.rest}`} />
        <div
          data-obsidyen-frame="squeezed"
          className={`${styles.frame} ${styles.squeezed}`}
        />
        <div className={styles.glint} />
        <div className={styles.mist}>
          {MIST_PARTICLES.map((particle, index) => (
            <span
              key={`${particle.x}-${particle.y}`}
              className={styles.particle}
              style={
                {
                  '--mist-x': `${particle.x}%`,
                  '--mist-y': `${particle.y}%`,
                  '--mist-size': `${particle.size}px`,
                  '--mist-drift': `${particle.drift - index * 0.4}px`,
                  '--mist-lift': `${particle.lift}px`,
                } as MistStyle
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
}
