import { describe, expect, it } from 'bun:test';
import type { Voxel } from '../src/core/types';
import {
  findNearestGroundPlacement,
  loadVoxelBlocks,
  persistVoxelBlock,
  translatedBlockVoxels,
} from '../src/editor/voxel-block-library';

function voxel(x: number, y: number, z: number): Voxel {
  return { id: `${x}:${y}:${z}`, sourceIndex: null, x, y, z, r: 1, g: 0.5, b: 0, a: 1 };
}

function memoryStorage(): Pick<Storage, 'getItem' | 'setItem'> {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => void values.set(key, value),
  };
}

describe('persistent voxel block library', () => {
  it('assigns stable increasing IDs and loads the newest block by default', () => {
    const storage = memoryStorage();
    expect(persistVoxelBlock([voxel(0, 0, 0)], 'first.xml', storage, 10).id).toBe(1);
    expect(persistVoxelBlock([voxel(1, 0, 0)], 'second.xml', storage, 20).id).toBe(2);
    expect(loadVoxelBlocks(storage).map((block) => block.id)).toEqual([2, 1]);
  });

  it('places a copied block on ground at the nearest collision-free center position', () => {
    const storage = memoryStorage();
    const block = persistVoxelBlock([voxel(0, 2, 0), voxel(1, 2, 0)], 'block.xml', storage);
    const occupied = [voxel(0, 0, 0), voxel(1, 0, 0)];
    const translation = findNearestGroundPlacement(block, occupied, { x: 0.5, z: 0 });
    const pasted = translatedBlockVoxels(block, translation);

    expect(Math.min(...pasted.map((item) => item.y))).toBe(0);
    expect(
      pasted.every(
        (item) => !occupied.some((other) => other.x === item.x && other.y === item.y && other.z === item.z),
      ),
    ).toBe(true);
    const pastedCenterX = (pasted[0]!.x + pasted[1]!.x) / 2;
    const pastedCenterZ = (pasted[0]!.z + pasted[1]!.z) / 2;
    expect((pastedCenterX - 0.5) ** 2 + pastedCenterZ ** 2).toBe(1);
  });
});
