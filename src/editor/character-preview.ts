import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import previewAnimationsXml from '../assets/character-preview-animations.xml?raw';
import { VoxelAnimationRig } from '../core/animation/animation-rig';
import { sampleAnimationPositions } from '../core/animation/sample-animation';
import { cameraRelativeMotion } from '../core/camera/camera-motion';
import { RwrModel, parseAnimations } from '../core/model/rwr-model';
import type { RwrAnimation } from '../core/types';
import { isNativeControlTarget, isTextEntryTarget, releasePressedActions } from './focus-policy';

type NoticeKind = 'success' | 'warning' | 'normal';
type LightingPreset = 'soft' | 'standard' | 'bright' | 'color';
type CameraAction = 'forward' | 'back' | 'left' | 'right';

interface CharacterPreviewOptions {
  root: HTMLDivElement;
  trigger: HTMLButtonElement;
  getModel: () => RwrModel | null;
  notify: (message: string, type?: NoticeKind) => void;
  getCameraSpeed: () => number;
}

const previewAnimationDefinitions = [
  { id: 'still', sourceName: 'still', label: 'still' },
  { id: 'running', sourceName: 'running', label: 'running' },
  { id: 'running-no-weapon', sourceName: 'running, no weapon?', label: 'running, no weapon' },
  { id: 'crouch-still', sourceName: 'crouch still', label: 'crouch still' },
  { id: 'crouch-forward', sourceName: 'crouching forwards', label: 'crouch forward' },
  { id: 'prone', sourceName: 'prone', label: 'prone' },
  { id: 'prone-forward', sourceName: 'prone, moving forwards', label: 'prone forward' },
] as const;

type PreviewAnimationId = (typeof previewAnimationDefinitions)[number]['id'];

const parsedPreviewAnimations = new Map(
  parseAnimations(previewAnimationsXml).map((animation) => [animation.name, animation]),
);
const previewAnimations = new Map<PreviewAnimationId, RwrAnimation>(
  previewAnimationDefinitions.map(({ id, sourceName }) => {
    const animation = parsedPreviewAnimations.get(sourceName);
    if (!animation) throw new Error(`内置 ${sourceName} 动画无法读取。`);
    return [id, animation];
  }),
);
const runningAnimation = previewAnimations.get('running')!;

const fixedCameraPreset = {
  position: { x: 125.2567, y: 177.1605, z: -173.7044 },
  target: { x: 73.9476, y: 111.4062, z: -98.069 },
  fov: 38,
  near: 0.056,
  far: 784,
} as const;

const lightingPresets: Record<
  LightingPreset,
  { hemisphere: number; fill: number; key: number; rim: number; exposure: number }
> = {
  soft: { hemisphere: 1.25, fill: 0.3, key: 1.45, rim: 0.3, exposure: 0.92 },
  standard: { hemisphere: 1.6, fill: 0.5, key: 2.15, rim: 0.55, exposure: 1 },
  bright: { hemisphere: 2.1, fill: 0.9, key: 2.85, rim: 0.75, exposure: 1.08 },
  color: { hemisphere: 2.6, fill: 1.4, key: 0.3, rim: 0.1, exposure: 1 },
};

function child<T extends Element>(root: ParentNode, selector: string): T {
  const found = root.querySelector<T>(selector);
  if (!found) throw new Error(`人物预览界面元素不存在：${selector}`);
  return found;
}

export class CharacterPreviewController {
  private readonly viewport: HTMLDivElement;
  private readonly closeButton: HTMLButtonElement;
  private readonly animationSelect: HTMLSelectElement;
  private readonly liveIndicator: HTMLElement;
  private readonly worldBadge: HTMLElement;
  private readonly lightingSelect: HTMLSelectElement;
  private readonly voxelSizeInput: HTMLInputElement;
  private readonly voxelSizeValue: HTMLOutputElement;
  private readonly fixedCameraInput: HTMLInputElement;
  private readonly cameraHint: HTMLElement;
  private readonly status: HTMLElement;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(38, 1, 0.1, 1200);
  private readonly renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: 'high-performance',
  });
  private readonly controls: OrbitControls;
  private readonly characterGroup = new THREE.Group();
  private readonly hemisphere = new THREE.HemisphereLight(0xc8dcff, 0x38511f, 1.6);
  private readonly keyLight = new THREE.DirectionalLight(0xfff3d8, 2.15);
  private readonly rimLight = new THREE.DirectionalLight(0x91b9ff, 0.55);
  private readonly fillLight = new THREE.AmbientLight(0xffffff, 0.5);
  private readonly fixedPosition = new THREE.Vector3(
    fixedCameraPreset.position.x,
    fixedCameraPreset.position.y,
    fixedCameraPreset.position.z,
  );
  private readonly fixedTarget = new THREE.Vector3(
    fixedCameraPreset.target.x,
    fixedCameraPreset.target.y,
    fixedCameraPreset.target.z,
  );
  private readonly motion = new THREE.Vector3();
  private readonly cameraLookDirection = new THREE.Vector3();
  private readonly poseMatrix = new THREE.Matrix4();
  private readonly posePosition = new THREE.Vector3();
  private readonly poseRotation = new THREE.Quaternion();
  private readonly poseScale = new THREE.Vector3(1, 1, 1);
  private readonly pressed = new Set<CameraAction>();
  private readonly resizeObserver: ResizeObserver;
  private model: RwrModel | null = null;
  private rig: VoxelAnimationRig | null = null;
  private voxelMesh: THREE.InstancedMesh | null = null;
  private ground: THREE.Mesh | null = null;
  private animation: RwrAnimation = runningAnimation;
  private elapsed = 0;
  private lastFrame = performance.now();
  private shiftHeld = false;
  private rotatingModel = false;
  private cameraLookActive = false;
  private rotationPointerId = -1;
  private rotationLastX = 0;
  private rotationLastY = 0;

  constructor(private readonly options: CharacterPreviewOptions) {
    const { root } = options;
    this.viewport = child(root, '#characterPreviewViewport');
    this.closeButton = child(root, '#closeCharacterPreviewBtn');
    this.animationSelect = child(root, '#characterPreviewAnimation');
    this.liveIndicator = child(root, '#characterPreviewLiveIndicator');
    this.worldBadge = child(root, '#characterPreviewWorldBadge');
    this.lightingSelect = child(root, '#characterPreviewLighting');
    this.voxelSizeInput = child(root, '#characterPreviewVoxelSize');
    this.voxelSizeValue = child(root, '#characterPreviewVoxelSizeValue');
    this.fixedCameraInput = child(root, '#characterPreviewFixedCamera');
    this.cameraHint = child(root, '#characterPreviewCameraHint');
    this.status = child(root, '#characterPreviewStatus');

    this.scene.background = new THREE.Color(0x8fb9d0);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.NoToneMapping;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.domElement.className = 'character-preview-canvas';
    this.viewport.prepend(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.screenSpacePanning = true;
    this.controls.minDistance = 8;
    this.controls.maxDistance = 660;
    this.controls.enableRotate = false;

    this.keyLight.position.set(42, 82, 54);
    this.keyLight.castShadow = true;
    this.keyLight.shadow.mapSize.set(2048, 2048);
    this.keyLight.shadow.camera.left = -90;
    this.keyLight.shadow.camera.right = 90;
    this.keyLight.shadow.camera.top = 110;
    this.keyLight.shadow.camera.bottom = -25;
    this.rimLight.position.set(-46, 34, -58);
    this.scene.add(this.characterGroup, this.hemisphere, this.keyLight, this.rimLight, this.fillLight);
    this.applyLighting();

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(this.viewport);
    this.bindEvents();
    requestAnimationFrame((now) => this.animate(now));
  }

  isOpen(): boolean {
    return !this.options.root.classList.contains('hidden');
  }

  open(): boolean {
    const model = this.options.getModel();
    if (!model) {
      this.options.notify('请先载入人物模型，再打开人物效果预览。', 'warning');
      return false;
    }
    if (!model.skeleton.length) {
      this.options.notify('当前模型没有骨骼，无法播放人物预览动画。', 'warning');
      return false;
    }

    const rig = new VoxelAnimationRig(model);
    if (!rig.boundCount) {
      this.options.notify('当前模型尚未绑定体素与骨骼，请先完成骨骼绑定。', 'warning');
      return false;
    }

    this.model = model;
    this.rig = rig;
    this.animationSelect.value = 'running';
    this.animation = runningAnimation;
    this.fixedCameraInput.checked = true;
    this.updateAnimationUi();
    this.elapsed = 0;
    this.characterGroup.rotation.set(0, 0, 0);
    this.rebuildWorld();
    this.options.root.classList.remove('hidden');
    this.options.trigger.textContent = '关闭预览';
    this.options.trigger.classList.add('preview-open');
    this.options.trigger.setAttribute('aria-expanded', 'true');
    this.lastFrame = performance.now();
    requestAnimationFrame(() => {
      this.resize();
      this.frameCharacter();
      this.viewport.focus({ preventScroll: true });
    });
    return true;
  }

  close(): void {
    if (!this.isOpen()) return;
    this.options.root.classList.add('hidden');
    this.options.trigger.textContent = '预览人物模型效果';
    this.options.trigger.classList.remove('preview-open');
    this.options.trigger.setAttribute('aria-expanded', 'false');
    this.releaseInput();
    this.options.trigger.focus({ preventScroll: true });
  }

  private bindEvents(): void {
    this.options.trigger.addEventListener('click', () => (this.isOpen() ? this.close() : this.open()));
    this.closeButton.addEventListener('click', () => this.close());
    this.options.root.addEventListener('pointerdown', (event) => {
      if (isNativeControlTarget(event.target)) this.releaseInput();
      if (event.target === this.options.root) this.close();
    });
    this.options.root.addEventListener('focusin', (event) => {
      if (isNativeControlTarget(event.target)) this.releaseInput();
    });
    this.lightingSelect.addEventListener('change', () => this.applyLighting());
    this.animationSelect.addEventListener('change', () => {
      const id = this.animationSelect.value as PreviewAnimationId;
      this.animation = previewAnimations.get(id) ?? runningAnimation;
      this.elapsed = 0;
      this.updateAnimationUi();
    });
    this.voxelSizeInput.addEventListener('input', () => {
      this.voxelSizeValue.value = `${Number(this.voxelSizeInput.value).toFixed(2)}×`;
      this.applyPose();
    });
    this.fixedCameraInput.addEventListener('change', () => this.applyCameraMode());

    this.renderer.domElement.addEventListener('pointerdown', (event) => {
      if (event.button !== 0) return;
      event.preventDefault();
      this.rotationPointerId = event.pointerId;
      this.rotationLastX = event.clientX;
      this.rotationLastY = event.clientY;
      if (this.fixedCameraInput.checked) this.rotatingModel = true;
      else this.cameraLookActive = true;
      this.renderer.domElement.setPointerCapture(event.pointerId);
    });
    this.renderer.domElement.addEventListener('pointermove', (event) => {
      if (event.pointerId !== this.rotationPointerId || !(event.buttons & 1)) return;
      const deltaX = event.clientX - this.rotationLastX;
      const deltaY = event.clientY - this.rotationLastY;
      this.rotationLastX = event.clientX;
      this.rotationLastY = event.clientY;
      if (this.rotatingModel) this.characterGroup.rotation.y += deltaX * 0.012;
      else if (this.cameraLookActive) this.rotateCameraView(deltaX, deltaY);
    });
    this.renderer.domElement.addEventListener('pointerup', (event) => {
      if (event.pointerId !== this.rotationPointerId) return;
      this.rotatingModel = false;
      this.cameraLookActive = false;
      if (this.renderer.domElement.hasPointerCapture(event.pointerId))
        this.renderer.domElement.releasePointerCapture(event.pointerId);
      this.rotationPointerId = -1;
    });
    this.renderer.domElement.addEventListener('pointercancel', (event) => {
      if (event.pointerId !== this.rotationPointerId) return;
      this.rotatingModel = false;
      this.cameraLookActive = false;
      this.rotationPointerId = -1;
    });

    window.addEventListener(
      'keydown',
      (event) => {
        if (!this.isOpen()) return;
        if (event.key === 'Escape') {
          event.preventDefault();
          event.stopImmediatePropagation();
          this.close();
          return;
        }
        if (event.key === 'Shift') this.shiftHeld = true;
        const action = this.cameraAction(event.code);
        if (!action || isTextEntryTarget(event.target)) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        if (!this.fixedCameraInput.checked) this.pressed.add(action);
      },
      { capture: true },
    );
    window.addEventListener(
      'keyup',
      (event) => {
        if (event.key === 'Shift') this.shiftHeld = false;
        const action = this.cameraAction(event.code);
        if (action) this.pressed.delete(action);
      },
      { capture: true },
    );
    window.addEventListener('blur', () => this.releaseInput());
  }

  private cameraAction(code: string): CameraAction | null {
    return (
      (
        {
          KeyW: 'forward',
          KeyS: 'back',
          KeyA: 'left',
          KeyD: 'right',
        } as Partial<Record<string, CameraAction>>
      )[code] ?? null
    );
  }

  private releaseInput(): void {
    releasePressedActions(this.pressed);
    this.shiftHeld = false;
    this.rotatingModel = false;
    this.cameraLookActive = false;
    this.rotationPointerId = -1;
  }

  private clearCharacter(): void {
    for (const child of [...this.characterGroup.children]) {
      this.characterGroup.remove(child);
      if (!(child instanceof THREE.Mesh)) continue;
      child.geometry.dispose();
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      materials.forEach((material) => material.dispose());
    }
    if (this.ground) {
      this.scene.remove(this.ground);
      this.ground.geometry.dispose();
      const material = this.ground.material;
      (Array.isArray(material) ? material : [material]).forEach((item) => item.dispose());
      this.ground = null;
    }
    this.voxelMesh = null;
  }

  private rebuildWorld(): void {
    if (!this.model) return;
    this.clearCharacter();
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    // Instance colors already multiply into the material color. Enabling
    // vertexColors here would also require a per-vertex color attribute on
    // BoxGeometry; without one, the shader multiplies the voxels to black.
    const material = new THREE.MeshLambertMaterial();
    this.voxelMesh = new THREE.InstancedMesh(geometry, material, this.model.voxels.length);
    this.voxelMesh.castShadow = true;
    this.voxelMesh.receiveShadow = true;
    const color = new THREE.Color();
    this.model.voxels.forEach((voxel, index) => {
      color.setRGB(voxel.r, voxel.g, voxel.b);
      this.voxelMesh!.setColorAt(index, color);
    });
    if (this.voxelMesh.instanceColor) this.voxelMesh.instanceColor.needsUpdate = true;
    this.characterGroup.add(this.voxelMesh);

    const { min, max, center } = this.model.bounds;
    this.characterGroup.position.set(-center.x, -min.y + 0.5, -center.z);
    const worldSize = Math.max(240, (max.x - min.x + max.z - min.z) * 5) * 3;
    const groundGeometry = new THREE.PlaneGeometry(worldSize, worldSize);
    const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x4f7d35 });
    this.ground = new THREE.Mesh(groundGeometry, groundMaterial);
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.receiveShadow = true;
    this.scene.add(this.ground);
    this.applyPose();
  }

  private frameCharacter(): void {
    if (!this.model) return;
    const { min, max } = this.model.bounds;
    const width = Math.max(max.x - min.x + 1, max.z - min.z + 1, 12);
    const height = Math.max(max.y - min.y + 1, 18);
    const extent = Math.max(width, height);
    this.controls.target.set(0, height * 0.48, 0);
    this.camera.position.set(extent * 1.22, height * 0.72, extent * 1.58);
    this.camera.near = Math.max(0.05, extent / 1000);
    this.camera.far = Math.max(600, extent * 14);
    this.camera.updateProjectionMatrix();
    this.controls.update();
    this.applyCameraMode();
  }

  private applyPose(): void {
    if (!this.model || !this.voxelMesh || !this.rig) return;
    const fallback = this.model.skeleton.map((particle) => ({ x: particle.x, y: particle.y, z: particle.z }));
    const positions = sampleAnimationPositions(this.animation, this.elapsed, fallback);
    const size = Number(this.voxelSizeInput.value);
    this.poseScale.setScalar(size);
    this.model.voxels.forEach((voxel, index) => {
      if (this.rig!.getPose(index, positions, this.posePosition, this.poseRotation)) {
        this.poseMatrix.compose(this.posePosition, this.poseRotation, this.poseScale);
      } else {
        this.posePosition.set(voxel.x, voxel.y, voxel.z);
        this.poseRotation.identity();
        this.poseMatrix.compose(this.posePosition, this.poseRotation, this.poseScale);
      }
      this.voxelMesh!.setMatrixAt(index, this.poseMatrix);
    });
    this.voxelMesh.instanceMatrix.needsUpdate = true;
    this.voxelMesh.computeBoundingSphere();
  }

  private applyLighting(): void {
    const preset = lightingPresets[this.lightingSelect.value as LightingPreset] ?? lightingPresets.standard;
    this.hemisphere.intensity = preset.hemisphere;
    this.fillLight.intensity = preset.fill;
    this.keyLight.intensity = preset.key;
    this.rimLight.intensity = preset.rim;
    this.renderer.toneMappingExposure = preset.exposure;
  }

  private updateAnimationUi(): void {
    const definition =
      previewAnimationDefinitions.find(({ id }) => id === this.animationSelect.value) ??
      previewAnimationDefinitions[1];
    const looping = this.animation.frames.length > 1 && this.animation.loop;
    const title = definition.label.toUpperCase();
    this.liveIndicator.lastChild!.textContent = looping ? `${title} LOOP` : title;
    this.worldBadge.textContent = `GRASS TEST WORLD / ${title}`;
    if (!this.model || !this.rig) return;
    const animationParticles = this.animation.frames[0]?.positions.length ?? 0;
    this.status.textContent =
      this.model.skeleton.length === animationParticles
        ? `${this.rig.boundCount} 个已绑定体素正在跟随 ${definition.label} 动画。`
        : `模型有 ${this.model.skeleton.length} 个骨骼点；${definition.label} 预设提供 ${animationParticles} 个。`;
  }

  private applyCameraMode(): void {
    const fixed = this.fixedCameraInput.checked;
    this.releaseInput();
    this.controls.enabled = !fixed;
    this.controls.enableRotate = false;
    this.controls.enablePan = !fixed;
    this.controls.enableZoom = !fixed;
    if (fixed) {
      this.camera.position.copy(this.fixedPosition);
      this.controls.target.copy(this.fixedTarget);
      this.camera.fov = fixedCameraPreset.fov;
      this.camera.near = fixedCameraPreset.near;
      this.camera.far = fixedCameraPreset.far;
      this.camera.updateProjectionMatrix();
      this.camera.lookAt(this.fixedTarget);
    }
    this.cameraHint.textContent = fixed
      ? '固定镜头 · 左键拖动旋转人物模型'
      : 'WASD 移动 · Shift 加速 · 左键转动视角 · 滚轮缩放';
    this.viewport.dataset.fixedCamera = String(fixed);
    this.viewport.focus({ preventScroll: true });
  }

  private rotateCameraView(deltaX: number, deltaY: number): void {
    const distance = Math.max(0.1, this.camera.position.distanceTo(this.controls.target));
    this.camera.getWorldDirection(this.cameraLookDirection);
    let yaw = Math.atan2(this.cameraLookDirection.x, -this.cameraLookDirection.z);
    let pitch = Math.asin(THREE.MathUtils.clamp(this.cameraLookDirection.y, -1, 1));
    const sensitivity = 0.004 * this.options.getCameraSpeed();
    yaw += deltaX * sensitivity;
    pitch = THREE.MathUtils.clamp(pitch - deltaY * sensitivity, -Math.PI * 0.49, Math.PI * 0.49);
    this.cameraLookDirection.set(
      Math.sin(yaw) * Math.cos(pitch),
      Math.sin(pitch),
      -Math.cos(yaw) * Math.cos(pitch),
    );
    this.controls.target.copy(this.camera.position).addScaledVector(this.cameraLookDirection, distance);
    this.camera.lookAt(this.controls.target);
  }

  private moveCamera(delta: number): void {
    if (this.fixedCameraInput.checked) return;
    const forward = Number(this.pressed.has('forward')) - Number(this.pressed.has('back'));
    const right = Number(this.pressed.has('right')) - Number(this.pressed.has('left'));
    if (!forward && !right) return;
    cameraRelativeMotion(this.motion, this.camera.quaternion, forward, right);
    const boost = this.shiftHeld ? 2 : 1;
    const distance =
      Math.max(8, this.camera.position.distanceTo(this.controls.target) * 0.45) *
      this.options.getCameraSpeed() *
      boost *
      delta;
    this.motion.multiplyScalar(distance);
    this.camera.position.add(this.motion);
    this.controls.target.add(this.motion);
  }

  private resize(): void {
    const width = this.viewport.clientWidth;
    const height = this.viewport.clientHeight;
    if (!width || !height) return;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  private animate(now: number): void {
    requestAnimationFrame((next) => this.animate(next));
    const delta = Math.min(0.1, (now - this.lastFrame) / 1000);
    this.lastFrame = now;
    if (!this.isOpen() || !this.model) return;
    this.elapsed = (this.elapsed + delta * this.animation.speed) % Math.max(this.animation.end, 0.001);
    this.moveCamera(delta);
    this.controls.update();
    this.applyPose();
    this.renderer.render(this.scene, this.camera);
  }
}
