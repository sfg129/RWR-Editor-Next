import * as THREE from 'three';

const forward = new THREE.Vector3();
const right = new THREE.Vector3();

/** Calculates a normalized movement direction in the camera's local X/Z plane. */
export function cameraRelativeMotion(
  target: THREE.Vector3,
  cameraQuaternion: THREE.Quaternion,
  forwardAmount: number,
  rightAmount: number,
): THREE.Vector3 {
  forward.set(0, 0, -1).applyQuaternion(cameraQuaternion).normalize();
  right.set(1, 0, 0).applyQuaternion(cameraQuaternion).normalize();
  target.copy(forward).multiplyScalar(forwardAmount).addScaledVector(right, rightAmount);
  if (target.lengthSq() > 0) target.normalize();
  return target;
}
