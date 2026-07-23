import * as THREE from 'three';
import type { RwrModel } from '../model/rwr-model';
import type { Vec3 } from '../types';

const EPSILON = 1e-8;
const TORSO_PARTICLE_NAMES = new Set([
  'righthip',
  'lefthip',
  'midspine',
  'rightshoulder',
  'leftshoulder',
  'neck',
]);

interface TorsoLandmarks {
  rightShoulder: number;
  leftShoulder: number;
  rightHip: number;
  leftHip: number;
  midSpine: number;
}

interface HeadLandmarks {
  neck: number;
  head: number;
}

function normalizedParticleName(name: string): string {
  return name.toLowerCase().replace(/[\s_-]+/g, '');
}

function findTorsoLandmarks(model: RwrModel): TorsoLandmarks | null {
  const indexByName = new Map(
    model.skeleton.map((particle, index) => [normalizedParticleName(particle.name), index]),
  );
  const rightShoulder = indexByName.get('rightshoulder');
  const leftShoulder = indexByName.get('leftshoulder');
  const rightHip = indexByName.get('righthip');
  const leftHip = indexByName.get('lefthip');
  const midSpine = indexByName.get('midspine');
  if (
    rightShoulder === undefined ||
    leftShoulder === undefined ||
    rightHip === undefined ||
    leftHip === undefined ||
    midSpine === undefined
  ) {
    return null;
  }
  return { rightShoulder, leftShoulder, rightHip, leftHip, midSpine };
}

function findHeadLandmarks(model: RwrModel): HeadLandmarks | null {
  const indexByName = new Map(
    model.skeleton.map((particle, index) => [normalizedParticleName(particle.name), index]),
  );
  const neck = indexByName.get('neck');
  const head = indexByName.get('head');
  return neck === undefined || head === undefined ? null : { neck, head };
}

function createTorsoFrame(
  model: RwrModel,
  positions: Vec3[],
  landmarks: TorsoLandmarks,
  targetOrigin: THREE.Vector3,
  targetOrientation: THREE.Quaternion,
): boolean {
  const positionAt = (index: number): Vec3 | undefined => positions[index] ?? model.skeleton[index];
  const rightShoulder = positionAt(landmarks.rightShoulder);
  const leftShoulder = positionAt(landmarks.leftShoulder);
  const rightHip = positionAt(landmarks.rightHip);
  const leftHip = positionAt(landmarks.leftHip);
  const midSpine = positionAt(landmarks.midSpine);
  if (!rightShoulder || !leftShoulder || !rightHip || !leftHip || !midSpine) return false;

  const shoulderAxis = new THREE.Vector3(
    leftShoulder.x - rightShoulder.x,
    leftShoulder.y - rightShoulder.y,
    leftShoulder.z - rightShoulder.z,
  );
  const hipAxis = new THREE.Vector3(leftHip.x - rightHip.x, leftHip.y - rightHip.y, leftHip.z - rightHip.z);
  if (shoulderAxis.lengthSq() < EPSILON || hipAxis.lengthSq() < EPSILON) return false;
  shoulderAxis.normalize();
  hipAxis.normalize();
  if (shoulderAxis.dot(hipAxis) < 0) hipAxis.negate();

  const lateral = shoulderAxis.add(hipAxis).normalize();
  const shoulderCenter = new THREE.Vector3(
    (rightShoulder.x + leftShoulder.x) / 2,
    (rightShoulder.y + leftShoulder.y) / 2,
    (rightShoulder.z + leftShoulder.z) / 2,
  );
  const hipCenter = new THREE.Vector3(
    (rightHip.x + leftHip.x) / 2,
    (rightHip.y + leftHip.y) / 2,
    (rightHip.z + leftHip.z) / 2,
  );
  const vertical = shoulderCenter.sub(hipCenter);
  vertical.addScaledVector(lateral, -vertical.dot(lateral));
  if (vertical.lengthSq() < EPSILON) return false;
  vertical.normalize();

  const forward = new THREE.Vector3().crossVectors(lateral, vertical);
  if (forward.lengthSq() < EPSILON) return false;
  forward.normalize();
  vertical.crossVectors(forward, lateral).normalize();

  targetOrigin.set(midSpine.x, midSpine.y, midSpine.z);
  targetOrientation.setFromRotationMatrix(new THREE.Matrix4().makeBasis(lateral, vertical, forward));
  return true;
}

function createHeadOrientation(
  model: RwrModel,
  positions: Vec3[],
  landmarks: HeadLandmarks,
  torsoOrientation: THREE.Quaternion,
  targetOrientation: THREE.Quaternion,
): boolean {
  const neck = positions[landmarks.neck] ?? model.skeleton[landmarks.neck];
  const head = positions[landmarks.head] ?? model.skeleton[landmarks.head];
  if (!neck || !head) return false;

  const vertical = new THREE.Vector3(head.x - neck.x, head.y - neck.y, head.z - neck.z);
  if (vertical.lengthSq() < EPSILON) return false;
  vertical.normalize();

  const lateral = new THREE.Vector3(1, 0, 0).applyQuaternion(torsoOrientation);
  lateral.addScaledVector(vertical, -lateral.dot(vertical));
  if (lateral.lengthSq() < EPSILON) {
    lateral.set(0, 0, 1).applyQuaternion(torsoOrientation);
    lateral.addScaledVector(vertical, -lateral.dot(vertical));
  }
  if (lateral.lengthSq() < EPSILON) return false;
  lateral.normalize();

  const forward = new THREE.Vector3().crossVectors(lateral, vertical).normalize();
  lateral.crossVectors(vertical, forward).normalize();
  targetOrientation.setFromRotationMatrix(new THREE.Matrix4().makeBasis(lateral, vertical, forward));
  return true;
}

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
  private readonly worldOffset = new THREE.Vector3();
  private readonly bindPoint = new THREE.Vector3();
  private readonly bindA = new THREE.Vector3();
  private readonly animatedA = new THREE.Vector3();
  private torsoLandmarks: TorsoLandmarks | null;
  private readonly torsoConstraintIndexes = new Set<number>();
  private readonly torsoBindOrigin = new THREE.Vector3();
  private readonly torsoBindOrientation = new THREE.Quaternion();
  private readonly torsoBindOrientationInverse = new THREE.Quaternion();
  private readonly torsoPoseOrigin = new THREE.Vector3();
  private readonly torsoPoseOrientation = new THREE.Quaternion();
  private readonly torsoPoseRotation = new THREE.Quaternion();
  private readonly torsoVoxelOffset = new THREE.Vector3();
  private readonly torsoPoseValues = new Float64Array(15);
  private torsoPoseInitialized = false;
  private torsoPoseAvailable = false;
  private torsoPoseRevision = 0;
  private headLandmarks: HeadLandmarks | null = null;
  private readonly headConstraintIndexes = new Set<number>();
  private readonly headBindOrigin = new THREE.Vector3();
  private readonly headBindOrientationInverse = new THREE.Quaternion();
  private readonly headPoseOrigin = new THREE.Vector3();
  private readonly headPoseOrientation = new THREE.Quaternion();
  private readonly headPoseRotation = new THREE.Quaternion();
  private readonly headVoxelOffset = new THREE.Vector3();
  private readonly headPoseValues = new Float64Array(6);
  private headPoseInitialized = false;
  private headPoseAvailable = false;
  private headTorsoPoseRevision = -1;

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

    this.torsoLandmarks = findTorsoLandmarks(model);
    if (this.torsoLandmarks) {
      const torsoParticleIds = new Set(
        model.skeleton
          .filter((particle) => TORSO_PARTICLE_NAMES.has(normalizedParticleName(particle.name)))
          .map((particle) => particle.id),
      );
      model.sticks.forEach((stick, index) => {
        if (torsoParticleIds.has(stick.a) && torsoParticleIds.has(stick.b)) {
          this.torsoConstraintIndexes.add(index);
        }
      });
      if (
        createTorsoFrame(
          model,
          model.skeleton,
          this.torsoLandmarks,
          this.torsoBindOrigin,
          this.torsoBindOrientation,
        )
      ) {
        this.torsoBindOrientationInverse.copy(this.torsoBindOrientation).invert();
        this.headLandmarks = findHeadLandmarks(model);
        if (this.headLandmarks) {
          const neckParticle = model.skeleton[this.headLandmarks.neck]!;
          const headParticle = model.skeleton[this.headLandmarks.head]!;
          const bindHeadOrientation = new THREE.Quaternion();
          this.headBindOrigin.set(neckParticle.x, neckParticle.y, neckParticle.z);
          if (
            createHeadOrientation(
              model,
              model.skeleton,
              this.headLandmarks,
              this.torsoBindOrientation,
              bindHeadOrientation,
            )
          ) {
            this.headBindOrientationInverse.copy(bindHeadOrientation).invert();
            model.sticks.forEach((stick, index) => {
              if (
                (stick.a === neckParticle.id && stick.b === headParticle.id) ||
                (stick.a === headParticle.id && stick.b === neckParticle.id)
              ) {
                this.headConstraintIndexes.add(index);
              }
            });
          } else {
            this.headLandmarks = null;
          }
        }
      } else {
        this.torsoLandmarks = null;
        this.torsoConstraintIndexes.clear();
      }
    }
  }

  private prepareTorsoPose(animatedPositions: Vec3[]): boolean {
    if (!this.torsoLandmarks) return false;
    const indexes = [
      this.torsoLandmarks.rightShoulder,
      this.torsoLandmarks.leftShoulder,
      this.torsoLandmarks.rightHip,
      this.torsoLandmarks.leftHip,
      this.torsoLandmarks.midSpine,
    ];
    let changed = !this.torsoPoseInitialized;
    indexes.forEach((index, landmarkIndex) => {
      const position = animatedPositions[index] ?? this.model.skeleton[index]!;
      const offset = landmarkIndex * 3;
      if (
        this.torsoPoseValues[offset] !== position.x ||
        this.torsoPoseValues[offset + 1] !== position.y ||
        this.torsoPoseValues[offset + 2] !== position.z
      ) {
        changed = true;
      }
      this.torsoPoseValues[offset] = position.x;
      this.torsoPoseValues[offset + 1] = position.y;
      this.torsoPoseValues[offset + 2] = position.z;
    });
    if (!changed) return this.torsoPoseAvailable;

    this.torsoPoseInitialized = true;
    this.torsoPoseAvailable = createTorsoFrame(
      this.model,
      animatedPositions,
      this.torsoLandmarks,
      this.torsoPoseOrigin,
      this.torsoPoseOrientation,
    );
    if (this.torsoPoseAvailable) {
      this.torsoPoseRotation
        .copy(this.torsoPoseOrientation)
        .multiply(this.torsoBindOrientationInverse)
        .normalize();
    }
    this.torsoPoseRevision += 1;
    return this.torsoPoseAvailable;
  }

  private prepareHeadPose(animatedPositions: Vec3[]): boolean {
    if (!this.headLandmarks || !this.prepareTorsoPose(animatedPositions)) return false;
    const indexes = [this.headLandmarks.neck, this.headLandmarks.head];
    let changed = !this.headPoseInitialized || this.headTorsoPoseRevision !== this.torsoPoseRevision;
    indexes.forEach((index, landmarkIndex) => {
      const position = animatedPositions[index] ?? this.model.skeleton[index]!;
      const offset = landmarkIndex * 3;
      if (
        this.headPoseValues[offset] !== position.x ||
        this.headPoseValues[offset + 1] !== position.y ||
        this.headPoseValues[offset + 2] !== position.z
      ) {
        changed = true;
      }
      this.headPoseValues[offset] = position.x;
      this.headPoseValues[offset + 1] = position.y;
      this.headPoseValues[offset + 2] = position.z;
    });
    if (!changed) return this.headPoseAvailable;

    this.headPoseInitialized = true;
    this.headTorsoPoseRevision = this.torsoPoseRevision;
    this.headPoseAvailable = createHeadOrientation(
      this.model,
      animatedPositions,
      this.headLandmarks,
      this.torsoPoseOrientation,
      this.headPoseOrientation,
    );
    if (!this.headPoseAvailable) return false;

    this.headPoseRotation
      .copy(this.headPoseOrientation)
      .multiply(this.headBindOrientationInverse)
      .normalize();
    this.headPoseOrigin
      .copy(this.headBindOrigin)
      .sub(this.torsoBindOrigin)
      .applyQuaternion(this.torsoPoseRotation)
      .add(this.torsoPoseOrigin);
    return true;
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

    if (this.headConstraintIndexes.has(constraintIndex) && this.prepareHeadPose(animatedPositions)) {
      targetRotation.copy(this.headPoseRotation);
      this.headVoxelOffset
        .set(voxel.x, voxel.y, voxel.z)
        .sub(this.headBindOrigin)
        .applyQuaternion(targetRotation);
      targetPosition.copy(this.headPoseOrigin).add(this.headVoxelOffset);
      return true;
    }

    if (this.torsoConstraintIndexes.has(constraintIndex) && this.prepareTorsoPose(animatedPositions)) {
      targetRotation.copy(this.torsoPoseRotation);
      this.torsoVoxelOffset
        .set(voxel.x, voxel.y, voxel.z)
        .sub(this.torsoBindOrigin)
        .applyQuaternion(targetRotation);
      targetPosition.copy(this.torsoPoseOrigin).add(this.torsoVoxelOffset);
      return true;
    }

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

    const along =
      this.bindPoint.set(voxel.x, voxel.y, voxel.z).sub(this.bindA).dot(this.bindAxis) / bindLengthSquared;
    this.bindPoint.copy(this.bindA).addScaledVector(this.bindAxis, along);
    this.worldOffset.set(voxel.x, voxel.y, voxel.z).sub(this.bindPoint);

    // RWR bindings deform voxel centres by interpolating the two particles of
    // a constraint. Rotating every binding group as an independent rigid bone
    // makes adjacent torso groups diverge (for example, the two halves of a
    // backpack follow the left/right hip constraints). Preserve the original
    // world-space offset so neighbouring groups remain visually continuous.
    targetRotation.identity();
    targetPosition.copy(this.animatedA).addScaledVector(this.animatedAxis, along).add(this.worldOffset);
    return true;
  }
}
