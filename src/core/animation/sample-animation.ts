import type { RwrAnimation, Vec3 } from '../types';

export function sampleAnimationPositions(animation: RwrAnimation, time: number, fallback: Vec3[]): Vec3[] {
  if (!animation.frames.length) return fallback;
  const nextIndex = animation.frames.findIndex((frame) => frame.time >= time);
  if (nextIndex === -1) return animation.frames.at(-1)?.positions ?? fallback;
  if (nextIndex === 0) return animation.frames[0]?.positions ?? fallback;

  const next = animation.frames[nextIndex]!;
  const previous = animation.frames[nextIndex - 1]!;
  const span = Math.max(0.0001, next.time - previous.time);
  const mix = Math.max(0, Math.min(1, (time - previous.time) / span));
  return previous.positions.map((position, index) => {
    const target = next.positions[index] ?? position;
    return {
      x: position.x + (target.x - position.x) * mix,
      y: position.y + (target.y - position.y) * mix,
      z: position.z + (target.z - position.z) * mix,
    };
  });
}
