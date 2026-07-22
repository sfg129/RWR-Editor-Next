export interface ScreenRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export function normalizeScreenRect(startX: number, startY: number, endX: number, endY: number): ScreenRect {
  return {
    left: Math.min(startX, endX),
    top: Math.min(startY, endY),
    right: Math.max(startX, endX),
    bottom: Math.max(startY, endY),
  };
}

export function rectangleOverlapRatio(selection: ScreenRect, target: ScreenRect): number {
  const targetWidth = Math.max(0, target.right - target.left);
  const targetHeight = Math.max(0, target.bottom - target.top);
  const targetArea = targetWidth * targetHeight;
  if (!targetArea) return 0;

  const width = Math.max(0, Math.min(selection.right, target.right) - Math.max(selection.left, target.left));
  const height = Math.max(0, Math.min(selection.bottom, target.bottom) - Math.max(selection.top, target.top));
  return (width * height) / targetArea;
}

export function resolveMarqueeCompletionTool(
  action: EditorSettings['marqueeCompletionAction'],
  previousTool: NonMarqueeToolId,
): NonMarqueeToolId | null {
  if (action === 'select') return 'select';
  if (action === 'previous') return previousTool;
  return null;
}
import type { EditorSettings, ToolId } from '../core/types';

export type NonMarqueeToolId = Exclude<ToolId, 'marquee'>;
