import { describe, expect, it } from 'bun:test';
import {
  normalizeScreenRect,
  rectangleOverlapRatio,
  resolveMarqueeCompletionTool,
} from '../src/editor/marquee-selection';

describe('marquee selection geometry', () => {
  it('normalizes a rectangle dragged in any direction', () => {
    expect(normalizeScreenRect(12, 18, 2, 4)).toEqual({ left: 2, top: 4, right: 12, bottom: 18 });
  });

  it('reports how much of the projected voxel is covered', () => {
    const voxel = { left: 0, top: 0, right: 10, bottom: 10 };
    expect(rectangleOverlapRatio({ left: 0, top: 0, right: 5, bottom: 10 }, voxel)).toBe(0.5);
    expect(rectangleOverlapRatio({ left: 0, top: 0, right: 5.1, bottom: 10 }, voxel)).toBeGreaterThan(0.5);
  });

  it('resolves the configured post-selection tool without returning marquee', () => {
    expect(resolveMarqueeCompletionTool('stay', 'paint')).toBeNull();
    expect(resolveMarqueeCompletionTool('select', 'paint')).toBe('select');
    expect(resolveMarqueeCompletionTool('previous', 'paint')).toBe('paint');
  });
});
