import { describe, expect, it } from 'bun:test';
import * as THREE from 'three';
import { VoxelAnimationRig } from '../src/animation-rig';
import { RwrModel, parseAnimations, serializeAnimations } from '../src/rwr-model';

const MODEL = `<?xml version="1.0" encoding="UTF-8"?>
<model>
  <!-- metadata must survive -->
  <voxels>
    <voxel x="0" y="0" z="0" r="1" g="0" b="0" a="0" />
    <voxel x="1" y="0" z="0" r="0" g="1" b="0" a="1" />
  </voxels>
  <skeleton>
    <particle id="10" name="a" x="0" y="0" z="0" invMass="1" bodyAreaHint="1" />
    <particle id="20" name="b" x="2" y="0" z="0" invMass="1" bodyAreaHint="1" />
    <stick a="10" b="20" />
  </skeleton>
  <skeletonVoxelBindings><group constraintIndex="0"><voxel index="0"/><voxel index="1"/></group></skeletonVoxelBindings>
</model>`;

describe('RWR model compatibility', () => {
  it('reads transparent voxels without turning alpha zero into one', () => {
    const model = RwrModel.parse(MODEL);
    expect(model.voxels[0]?.a).toBe(0);
  });

  it('keeps bindings attached to stable voxel identities after movement', () => {
    const model = RwrModel.parse(MODEL);
    const id = model.voxels[0]!.id;
    expect(model.move(new Set([id]), { x: 0, y: 1, z: 0 })).toBe(true);
    const output = model.serialize();
    const reparsed = RwrModel.parse(output);
    expect(reparsed.voxels[0]).toMatchObject({ x: 0, y: 1, z: 0 });
    expect(reparsed.bindings[0]?.voxelIds.size).toBe(2);
  });

  it('removes deleted voxels from skeleton binding references', () => {
    const model = RwrModel.parse(MODEL);
    model.remove(new Set([model.voxels[0]!.id]));
    const reparsed = RwrModel.parse(model.serialize());
    expect(reparsed.voxels).toHaveLength(1);
    expect(reparsed.bindings[0]?.voxelIds.size).toBe(1);
  });

  it('can rebuild all bindings against the nearest skeleton constraint', () => {
    const model = RwrModel.parse(MODEL);
    model.bindings = [];
    expect(model.rebindSkeleton()).toBe(2);
    expect(model.bindings[0]?.voxelIds.size).toBe(2);
  });

  it('preserves non-voxel model content semantically', () => {
    const model = RwrModel.parse(MODEL);
    const output = model.serialize();
    expect(output).toContain('metadata must survive');
    expect(output).toContain('<skeleton>');
    expect(output).toContain('name="a"');
  });

  it('creates valid new models with one or eight centered base voxels', () => {
    const single = RwrModel.createNew(1);
    const block = RwrModel.createNew(8);
    expect(single.voxels).toHaveLength(1);
    expect(single.voxels[0]).toMatchObject({ x: 0, y: 0, z: 0 });
    expect(block.voxels).toHaveLength(8);
    expect(new Set(block.voxels.map((voxel) => `${voxel.x},${voxel.y},${voxel.z}`)).size).toBe(8);
    expect(() => RwrModel.parse(block.serialize())).not.toThrow();
  });
});

describe('RWR animation format', () => {
  it('reads animation metadata and particle positions', () => {
    const animations = parseAnimations(`<animations><animation loop="1" end="0.5" speed="1" comment="walk"><frame time="0"><position x="1" y="2" z="3"/></frame></animation></animations>`);
    expect(animations[0]).toMatchObject({ name: 'walk', loop: true, end: 0.5, speed: 1 });
    expect(animations[0]?.frames[0]?.positions[0]).toEqual({ x: 1, y: 2, z: 3 });
  });

  it('moves bound voxels with their animated skeleton constraint', () => {
    const model = RwrModel.parse(MODEL);
    const rig = new VoxelAnimationRig(model);
    const position = new THREE.Vector3();
    const rotation = new THREE.Quaternion();
    const transformed = rig.getPose(1, [{ x: 0, y: 0, z: 0 }, { x: 0, y: 4, z: 0 }], position, rotation);
    const rotatedAxis = new THREE.Vector3(1, 0, 0).applyQuaternion(rotation);
    expect(transformed).toBe(true);
    expect(rig.boundCount).toBe(2);
    expect(position.x).toBeCloseTo(0);
    expect(position.y).toBeCloseTo(2);
    expect(rotatedAxis.x).toBeCloseTo(0);
    expect(rotatedAxis.y).toBeCloseTo(1);
  });

  it('exports edited animations in the original compatible XML structure', () => {
    const source = parseAnimations(`<animations><animation loop="1" end="0.5" speed="1.2" speed_spread="0.04" comment="edit test"><frame time="0"><position x="1" y="2" z="3"/></frame></animation></animations>`);
    source[0]!.name = 'edited name';
    source[0]!.frames.push({ time: 0.5, positions: [{ x: 4, y: 5, z: 6 }] });
    const output = serializeAnimations(source);
    const reparsed = parseAnimations(output);
    expect(reparsed[0]).toMatchObject({ name: 'edited name', loop: true, end: 0.5, speed: 1.2, speedSpread: 0.04 });
    expect(reparsed[0]?.frames[1]?.positions[0]).toEqual({ x: 4, y: 5, z: 6 });
  });
});
