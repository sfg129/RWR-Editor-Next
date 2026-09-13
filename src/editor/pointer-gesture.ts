export interface ScreenPoint {
  x: number;
  y: number;
}

export const POINTER_DRAG_THRESHOLD = 5;

export function exceedsPointerDragThreshold(start: ScreenPoint, current: ScreenPoint): boolean {
  return Math.hypot(current.x - start.x, current.y - start.y) > POINTER_DRAG_THRESHOLD;
}
