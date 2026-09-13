import { describe, expect, it } from 'bun:test';
import { exceedsPointerDragThreshold, POINTER_DRAG_THRESHOLD } from '../src/editor/pointer-gesture';

describe('pointer gesture classification', () => {
  it('keeps a secondary-button gesture a click within the movement tolerance', () => {
    expect(exceedsPointerDragThreshold({ x: 10, y: 10 }, { x: 13, y: 14 })).toBe(false);
  });

  it('classifies movement beyond the tolerance as a camera drag', () => {
    expect(exceedsPointerDragThreshold({ x: 10, y: 10 }, { x: 10 + POINTER_DRAG_THRESHOLD + 1, y: 10 })).toBe(
      true,
    );
  });
});
