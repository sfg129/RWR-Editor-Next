import { Color, Fog, FogExp2, type GridHelper, type Scene } from 'three';
import type { EditorSettings } from '../core/types';

export function applyViewportTheme(scene: Scene, grid: GridHelper, theme: EditorSettings['theme']): void {
  const background = theme === 'light' ? 0xf2f3f2 : 0x11141a;
  if (scene.background instanceof Color) scene.background.setHex(background);
  else scene.background = new Color(background);
  if (scene.fog instanceof Fog || scene.fog instanceof FogExp2) scene.fog.color.setHex(background);
  const materials = Array.isArray(grid.material) ? grid.material : [grid.material];
  for (const material of materials) {
    material.transparent = true;
    material.opacity = theme === 'light' ? 0.3 : 1;
  }
}
