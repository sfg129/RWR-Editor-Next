import { describe, expect, it } from 'bun:test';
import { advanceAnimation, animationDuration, resumeAnimationAt } from '../src/core/animation/playback';
import type { RwrAnimation } from '../src/core/types';

const animation: RwrAnimation = {
  name: 'test',
  loop: false,
  end: 1,
  speed: 2,
  speedSpread: 0,
  frames: [
    { time: 0, positions: [] },
    { time: 1, positions: [] },
  ],
};
describe('animation playback', () => {
  it('advances at the selected speed and pauses at the final pose', () => {
    expect(advanceAnimation(animation, 0, 0.1)).toEqual({ elapsed: 0.2, playing: true });
    expect(advanceAnimation(animation, 0.9, 0.1)).toEqual({ elapsed: 1, playing: false });
    expect(advanceAnimation(animation, 1, 0.1)).toEqual({ elapsed: 1, playing: false });
  });
  it('restarts completed clips while resuming a paused clip in place', () => {
    expect(resumeAnimationAt(animation, 1)).toBe(0);
    expect(resumeAnimationAt(animation, 0.3)).toBe(0.3);
  });
  it('loops without losing overshoot and supports missing end values', () => {
    const clip = { ...animation, loop: true, end: 0 };
    expect(animationDuration(clip)).toBe(1);
    expect(advanceAnimation(clip, 0.9, 0.1).elapsed).toBeCloseTo(0.1);
  });
  it('handles zero-length animations without division by zero', () => {
    expect(advanceAnimation({ ...animation, end: 0, frames: [] }, 0, 1)).toEqual({
      elapsed: 0,
      playing: false,
    });
  });
});
