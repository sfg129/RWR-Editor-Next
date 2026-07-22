import * as THREE from 'three';
import { describe, expect, it } from 'bun:test';
import { cameraRelativeMotion } from '../src/core/camera/camera-motion';

describe('camera-relative keyboard movement', () => {
  it('follows the full pitched camera direction instead of flattening to XZ', () => {
    const cameraRotation = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 4, 0, 0));
    const result = cameraRelativeMotion(new THREE.Vector3(), cameraRotation, 1, 0);
    const expected = new THREE.Vector3(0, 0, -1).applyQuaternion(cameraRotation).normalize();

    expect(result.distanceTo(expected)).toBeLessThan(0.000001);
    expect(Math.abs(result.y)).toBeGreaterThan(0.6);
  });

  it('uses the camera-local right direction for strafing', () => {
    const cameraRotation = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.3, 0.8, 0));
    const result = cameraRelativeMotion(new THREE.Vector3(), cameraRotation, 0, 1);
    const expected = new THREE.Vector3(1, 0, 0).applyQuaternion(cameraRotation).normalize();

    expect(result.distanceTo(expected)).toBeLessThan(0.000001);
  });
});
