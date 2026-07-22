import { describe, expect, it } from 'bun:test';
import { sampleAnimationPositions } from '../src/core/animation/sample-animation';
import type { RwrAnimation } from '../src/core/types';

const animation: RwrAnimation = {
  name: 'running',
  loop: true,
  end: 1,
  speed: 1,
  speedSpread: 0,
  frames: [
    { time: 0, positions: [{ x: 0, y: 2, z: 4 }] },
    { time: 1, positions: [{ x: 10, y: 6, z: 0 }] },
  ],
};

describe('animation sampling', () => {
  it('interpolates positions between adjacent frames', () => {
    expect(sampleAnimationPositions(animation, 0.25, [])).toEqual([{ x: 2.5, y: 3, z: 3 }]);
  });

  it('uses the supplied skeleton pose when an animation has no frames', () => {
    const fallback = [{ x: 1, y: 2, z: 3 }];
    expect(sampleAnimationPositions({ ...animation, frames: [] }, 0, fallback)).toBe(fallback);
  });
});
