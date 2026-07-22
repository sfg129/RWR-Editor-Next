import * as THREE from 'three';
import type { RwrModel } from './rwr-model';
import type { Vec3 } from './types';

const EPSILON = 1e-8;

/**
 * Read-only preview rig. It maps each voxel to its skeleton constraint and
 * calculates a pose without changing the model's stored voxel coordinates.
 */
export class VoxelAnimationRig {
  readonly boundCount: number;
  private readonly constraintByVoxel: Array<number | null>;
  private readonly particleIndexById: Map<string, number>;
  private readonly bindAxis = new THREE.Vector3();
  private readonly animatedAxis = new THREE.Vector3();
  private readonly bindDirection = new THREE.Vector3();
  private readonly animatedDirection = new THREE.Vector3();
  private readonly radial = new THREE.Vector3();
  private readonly bindPoint = new THREE.Vector3();
  private readonly bindA = new THREE.Vector3();
  private readonly animatedA = new THREE.Vector3();

  constructor(private readonly model: RwrModel) {
    this.particleIndexById = new Map(model.skeleton.map((particle, index) => [particle.id, index]));
    const constraintById = new Map<string, number>();
    for (const group of model.bindings) {
      if (!model.sticks[group.constraintIndex]) continue;
      for (const id of group.voxelIds) {
        if (!constraintById.has(id)) constraintById.set(id, group.constraintIndex);
      }
    }
    this.constraintByVoxel = model.voxels.map((voxel) => constraintById.get(voxel.id) ?? null);
    this.boundCount = this.constraintByVoxel.filter((constraint) => constraint !== null).length;
  }

  getPose(
    voxelIndex: number,
    animatedPositions: Vec3[],
    targetPosition: THREE.Vector3,
    targetRotation: THREE.Quaternion,
  ): boolean {
    const voxel = this.model.voxels[voxelIndex];
    const constraintIndex = this.constraintByVoxel[voxelIndex];
    if (!voxel || constraintIndex == null) return false;

    const stick = this.model.sticks[constraintIndex];
    if (!stick) return false;
    const aIndex = this.particleIndexById.get(stick.a);
    const bIndex = this.particleIndexById.get(stick.b);
    if (aIndex === undefined || bIndex === undefined) return false;

    const bindA = this.model.skeleton[aIndex];
    const bindB = this.model.skeleton[bIndex];
    const animatedA = animatedPositions[aIndex] ?? bindA;
    const animatedB = animatedPositions[bIndex] ?? bindB;
    if (!bindA || !bindB || !animatedA || !animatedB) return false;

    this.bindA.set(bindA.x, bindA.y, bindA.z);
    this.animatedA.set(animatedA.x, animatedA.y, animatedA.z);
    this.bindAxis.set(bindB.x - bindA.x, bindB.y - bindA.y, bindB.z - bindA.z);
    this.animatedAxis.set(animatedB.x - animatedA.x, animatedB.y - animatedA.y, animatedB.z - animatedA.z);
    const bindLengthSquared = this.bindAxis.lengthSq();
    const animatedLengthSquared = this.animatedAxis.lengthSq();

    if (bindLengthSquared < EPSILON || animatedLengthSquared < EPSILON) {
      targetRotation.identity();
      targetPosition.set(
        voxel.x + animatedA.x - bindA.x,
        voxel.y + animatedA.y - bindA.y,
        voxel.z + animatedA.z - bindA.z,
      );
      return true;
    }

    const along = this.bindPoint.set(voxel.x, voxel.y, voxel.z).sub(this.bindA).dot(this.bindAxis) / bindLengthSquared;
    this.bindPoint.copy(this.bindA).addScaledVector(this.bindAxis, along);
    this.radial.set(voxel.x, voxel.y, voxel.z).sub(this.bindPoint);
    this.bindDirection.copy(this.bindAxis).normalize();
    this.animatedDirection.copy(this.animatedAxis).normalize();
    targetRotation.setFromUnitVectors(this.bindDirection, this.animatedDirection);
    this.radial.applyQuaternion(targetRotation);
    targetPosition.copy(this.animatedA).addScaledVector(this.animatedAxis, along).add(this.radial);
    return true;
  }
}
