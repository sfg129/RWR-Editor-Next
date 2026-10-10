import { describe, expect, it } from 'bun:test';
import { Color, Fog, GridHelper, Scene } from 'three';
import { applyViewportTheme } from '../src/editor/viewport-theme';

describe('viewport theme', () => {
  it('changes the actual rendered background and fog without changing fog distance', () => {
    const scene = new Scene();
    scene.background = new Color(0x11141a);
    scene.fog = new Fog(0x11141a, 110, 260);
    const grid = new GridHelper(140, 140);
    applyViewportTheme(scene, grid, 'light');
    expect(scene.background.getHex()).toBe(0xf2f3f2);
    expect(scene.fog.color.getHex()).toBe(0xf2f3f2);
    expect(scene.fog.near).toBe(110);
    expect(scene.fog.far).toBe(260);
    expect(grid.material.opacity).toBe(0.3);
    applyViewportTheme(scene, grid, 'dark');
    expect(scene.background.getHex()).toBe(0x11141a);
    expect(scene.fog.color.getHex()).toBe(0x11141a);
    expect(grid.material.opacity).toBe(1);
    grid.dispose();
  });
});
