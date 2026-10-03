import type { RwrAnimation } from '../types';

export function animationDuration(animation: RwrAnimation): number {
  return Math.max(0, animation.end, ...animation.frames.map((frame) => frame.time));
}

export function resumeAnimationAt(animation: RwrAnimation, elapsed: number): number {
  return elapsed >= animationDuration(animation) ? 0 : Math.max(0, elapsed);
}

export function advanceAnimation(
  animation: RwrAnimation,
  elapsed: number,
  delta: number,
): { elapsed: number; playing: boolean } {
  const end = animationDuration(animation);
  if (end <= 0) return { elapsed: 0, playing: false };
  const next = Math.max(0, elapsed + Math.max(0, delta) * Math.max(0, animation.speed));
  if (animation.loop) return { elapsed: next % end, playing: true };
  return { elapsed: Math.min(next, end), playing: next < end };
}
