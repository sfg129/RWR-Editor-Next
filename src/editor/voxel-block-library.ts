import type { Vec3, Voxel } from '../core/types';

const STORAGE_KEY = 'rwr-editor-voxel-block-library-v1';
const COORDINATE_PRECISION = 1_000_000;

export interface StoredBlockVoxel extends Vec3 {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface StoredVoxelBlock {
  id: number;
  sourceName: string;
  createdAt: number;
  voxels: StoredBlockVoxel[];
}

interface StoredVoxelBlockLibrary {
  nextId: number;
  blocks: StoredVoxelBlock[];
}

function normalized(value: number): number {
  return Math.round(value * COORDINATE_PRECISION) / COORDINATE_PRECISION;
}

function coordinateKey(x: number, y: number, z: number): string {
  return `${normalized(x)},${normalized(y)},${normalized(z)}`;
}

function isFiniteVoxel(value: unknown): value is StoredBlockVoxel {
  if (!value || typeof value !== 'object') return false;
  const voxel = value as Partial<StoredBlockVoxel>;
  return [voxel.x, voxel.y, voxel.z, voxel.r, voxel.g, voxel.b, voxel.a].every(
    (item) => typeof item === 'number' && Number.isFinite(item),
  );
}

function emptyLibrary(): StoredVoxelBlockLibrary {
  return { nextId: 1, blocks: [] };
}

function readLibrary(storage: Pick<Storage, 'getItem'>): StoredVoxelBlockLibrary {
  try {
    const parsed = JSON.parse(storage.getItem(STORAGE_KEY) ?? '') as Partial<StoredVoxelBlockLibrary>;
    const blocks = Array.isArray(parsed.blocks)
      ? parsed.blocks.filter((block): block is StoredVoxelBlock =>
          Boolean(
            block &&
            Number.isInteger(block.id) &&
            block.id > 0 &&
            typeof block.sourceName === 'string' &&
            typeof block.createdAt === 'number' &&
            Array.isArray(block.voxels) &&
            block.voxels.length &&
            block.voxels.every(isFiniteVoxel),
          ),
        )
      : [];
    const minimumNextId = Math.max(0, ...blocks.map((block) => block.id)) + 1;
    return {
      nextId:
        Number.isInteger(parsed.nextId) && (parsed.nextId ?? 0) >= minimumNextId
          ? parsed.nextId!
          : minimumNextId,
      blocks,
    };
  } catch {
    return emptyLibrary();
  }
}

export function loadVoxelBlocks(storage: Pick<Storage, 'getItem'> = localStorage): StoredVoxelBlock[] {
  return readLibrary(storage).blocks.sort((a, b) => b.id - a.id);
}

export function persistVoxelBlock(
  voxels: readonly Voxel[],
  sourceName: string,
  storage: Pick<Storage, 'getItem' | 'setItem'> = localStorage,
  createdAt = Date.now(),
): StoredVoxelBlock {
  if (!voxels.length) throw new Error('当前模型没有可复制的体素。');
  const library = readLibrary(storage);
  const block: StoredVoxelBlock = {
    id: library.nextId,
    sourceName,
    createdAt,
    voxels: voxels.map(({ x, y, z, r, g, b, a }) => ({ x, y, z, r, g, b, a })),
  };
  library.nextId += 1;
  library.blocks.push(block);
  storage.setItem(STORAGE_KEY, JSON.stringify(library));
  return block;
}

function ringOffsets(radius: number): Array<{ x: number; z: number }> {
  if (radius === 0) return [{ x: 0, z: 0 }];
  const offsets: Array<{ x: number; z: number }> = [];
  for (let x = -radius; x <= radius; x += 1) {
    offsets.push({ x, z: -radius }, { x, z: radius });
  }
  for (let z = -radius + 1; z < radius; z += 1) {
    offsets.push({ x: -radius, z }, { x: radius, z });
  }
  return offsets;
}

export function findNearestGroundPlacement(
  block: StoredVoxelBlock,
  occupiedVoxels: readonly Pick<Voxel, 'x' | 'y' | 'z'>[],
  targetCenter: Pick<Vec3, 'x' | 'z'>,
): Vec3 {
  const xs = block.voxels.map((voxel) => voxel.x);
  const ys = block.voxels.map((voxel) => voxel.y);
  const zs = block.voxels.map((voxel) => voxel.z);
  const blockCenterX = (Math.min(...xs) + Math.max(...xs)) / 2;
  const blockCenterZ = (Math.min(...zs) + Math.max(...zs)) / 2;
  const y = normalized(-Math.min(...ys));
  const idealX = targetCenter.x - blockCenterX;
  const idealZ = targetCenter.z - blockCenterZ;
  const originX = Math.round(idealX);
  const originZ = Math.round(idealZ);
  const occupied = new Set(occupiedVoxels.map((voxel) => coordinateKey(voxel.x, voxel.y, voxel.z)));

  for (let radius = 0; ; radius += 1) {
    const candidates = ringOffsets(radius)
      .map((offset) => ({ x: originX + offset.x, z: originZ + offset.z }))
      .sort((a, b) => {
        const distanceA = (a.x - idealX) ** 2 + (a.z - idealZ) ** 2;
        const distanceB = (b.x - idealX) ** 2 + (b.z - idealZ) ** 2;
        return distanceA - distanceB || a.x - b.x || a.z - b.z;
      });
    for (const candidate of candidates) {
      const clear = block.voxels.every(
        (voxel) => !occupied.has(coordinateKey(voxel.x + candidate.x, voxel.y + y, voxel.z + candidate.z)),
      );
      if (clear) return { x: candidate.x, y, z: candidate.z };
    }
  }
}

export function translatedBlockVoxels(block: StoredVoxelBlock, translation: Vec3): StoredBlockVoxel[] {
  return block.voxels.map((voxel) => ({
    ...voxel,
    x: normalized(voxel.x + translation.x),
    y: normalized(voxel.y + translation.y),
    z: normalized(voxel.z + translation.z),
  }));
}
