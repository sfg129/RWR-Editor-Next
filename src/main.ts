import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import './styles.css';
import { VoxelAnimationRig } from './animation-rig';
import { cameraRelativeMotion } from './camera-motion';
import { hsvToRgb, hueFromPoint, rgbToHsv, saturationValueFromPoint } from './color-picker';
import { desktopBridge } from './desktop-api';
import { RwrModel, parseAnimations, serializeAnimations } from './rwr-model';
import { applyPreset, applySettingsToDocument, completeInputStyleOnboarding, defaultSettings, loadSettings, saveSettings, shouldShowInputStyleOnboarding } from './settings';
import type { EditorSettings, EditorSnapshot, RwrAnimation, ShortcutAction, ToolId, Vec3, Voxel } from './types';
import { appMarkup } from './ui';

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) throw new Error('应用容器不存在。');
app.innerHTML = appMarkup;

function element<T extends Element>(selector: string): T {
  const found = document.querySelector<T>(selector);
  if (!found) throw new Error(`界面元素不存在：${selector}`);
  return found;
}

const viewport = element<HTMLDivElement>('#viewport');
const emptyState = element<HTMLDivElement>('#emptyState');
const statusText = element<HTMLSpanElement>('#statusText');
const voxelCount = element<HTMLElement>('#voxelCount');
const selectedCount = element<HTMLElement>('#selectedCount');
const boneCount = element<HTMLElement>('#boneCount');
const dirtyState = element<HTMLElement>('#dirtyState');
const modelName = element<HTMLElement>('#modelName');
const modelPath = element<HTMLElement>('#modelPath');
const fileState = element<HTMLElement>('#fileState');
const selectionSummary = element<HTMLElement>('#selectionSummary');
const selectionPosition = element<HTMLElement>('#selectionPosition');
const bindingCount = element<HTMLElement>('#bindingCount');
const unboundCount = element<HTMLElement>('#unboundCount');
const fpsBadge = element<HTMLElement>('#fpsBadge');
const viewModeBadge = element<HTMLElement>('#viewModeBadge');
const colorSwatch = element<HTMLDivElement>('#colorSwatch');
const colorPickerPopover = element<HTMLDivElement>('#colorPickerPopover');
const hueRing = element<HTMLDivElement>('#hueRing');
const hueHandle = element<HTMLSpanElement>('#hueHandle');
const colorSquare = element<HTMLDivElement>('#colorSquare');
const colorSquareHandle = element<HTMLSpanElement>('#colorSquareHandle');
const redSlider = element<HTMLInputElement>('#redSlider');
const greenSlider = element<HTMLInputElement>('#greenSlider');
const blueSlider = element<HTMLInputElement>('#blueSlider');
const redSliderValue = element<HTMLOutputElement>('#redSliderValue');
const greenSliderValue = element<HTMLOutputElement>('#greenSliderValue');
const blueSliderValue = element<HTMLOutputElement>('#blueSliderValue');
const redValue = element<HTMLOutputElement>('#redValue');
const greenValue = element<HTMLOutputElement>('#greenValue');
const blueValue = element<HTMLOutputElement>('#blueValue');
const sculptMode = element<HTMLSelectElement>('#sculptMode');
const activeToolLabel = element<HTMLElement>('#activeToolLabel');
const toolHelp = element<HTMLElement>('#toolHelp');
const deleteSelectionBtn = element<HTMLButtonElement>('#deleteSelectionBtn');
const rebindBtn = element<HTMLButtonElement>('#rebindBtn');
const undoBtn = element<HTMLButtonElement>('#undoBtn');
const redoBtn = element<HTMLButtonElement>('#redoBtn');
const overwriteBtn = element<HTMLButtonElement>('#overwriteBtn');
const saveAsBtn = element<HTMLButtonElement>('#saveAsBtn');
const skeletonToggle = element<HTMLInputElement>('#skeletonToggle');
const modelFileInput = element<HTMLInputElement>('#modelFileInput');
const animationFileInput = element<HTMLInputElement>('#animationFileInput');
const animationSelect = element<HTMLSelectElement>('#animationSelect');
const animationPlayBtn = element<HTMLButtonElement>('#animationPlayBtn');
const animationTime = element<HTMLInputElement>('#animationTime');
const animationClock = element<HTMLElement>('#animationClock');
const animationInfo = element<HTMLElement>('#animationInfo');
const animationVoxelToggle = element<HTMLInputElement>('#animationVoxelToggle');
const animationBindingStatus = element<HTMLElement>('#animationBindingStatus');
const animationWorkspace = element<HTMLDetailsElement>('#animationWorkspace');
const animationSummaryStatus = element<HTMLElement>('#animationSummaryStatus');
const newAnimationBtn = element<HTMLButtonElement>('#newAnimationBtn');
const duplicateAnimationBtn = element<HTMLButtonElement>('#duplicateAnimationBtn');
const deleteAnimationBtn = element<HTMLButtonElement>('#deleteAnimationBtn');
const animationNameInput = element<HTMLInputElement>('#animationNameInput');
const animationEndInput = element<HTMLInputElement>('#animationEndInput');
const animationSpeedInput = element<HTMLInputElement>('#animationSpeedInput');
const animationSpreadInput = element<HTMLInputElement>('#animationSpreadInput');
const animationLoopInput = element<HTMLInputElement>('#animationLoopInput');
const keyframeSelect = element<HTMLSelectElement>('#keyframeSelect');
const keyframeCount = element<HTMLElement>('#keyframeCount');
const addKeyframeBtn = element<HTMLButtonElement>('#addKeyframeBtn');
const duplicateKeyframeBtn = element<HTMLButtonElement>('#duplicateKeyframeBtn');
const deleteKeyframeBtn = element<HTMLButtonElement>('#deleteKeyframeBtn');
const keyframeTimeInput = element<HTMLInputElement>('#keyframeTimeInput');
const particleSelect = element<HTMLSelectElement>('#particleSelect');
const particleXInput = element<HTMLInputElement>('#particleXInput');
const particleYInput = element<HTMLInputElement>('#particleYInput');
const particleZInput = element<HTMLInputElement>('#particleZInput');
const resetParticleBtn = element<HTMLButtonElement>('#resetParticleBtn');
const saveAnimationsBtn = element<HTMLButtonElement>('#saveAnimationsBtn');
const settingsModal = element<HTMLDivElement>('#settingsModal');
const inputStyleModal = element<HTMLDivElement>('#inputStyleModal');
const unsavedModelModal = element<HTMLDivElement>('#unsavedModelModal');
const overwriteModal = element<HTMLDivElement>('#overwriteModal');
const overwriteConfirmCheck = element<HTMLInputElement>('#overwriteConfirmCheck');
const confirmOverwriteBtn = element<HTMLButtonElement>('#confirmOverwriteBtn');
const fileMenuBtn = element<HTMLButtonElement>('#fileMenuBtn');
const fileMenu = element<HTMLDivElement>('#fileMenu');
const lightingQuickSelect = element<HTMLSelectElement>('#lightingQuickSelect');
const toolModeTitle = element<HTMLElement>('#toolModeTitle');
const toolModeHint = element<HTMLElement>('#toolModeHint');

let settings = loadSettings();
applySettingsToDocument(settings);

let model: RwrModel | null = null;
let currentFileName = 'edited_model.xml';
let currentFilePath = '';
let activeTool: ToolId = 'select';
let selectedIds = new Set<string>();
let undoStack: EditorSnapshot[] = [];
let redoStack: EditorSnapshot[] = [];
let animations: RwrAnimation[] = [];
let activeAnimation: RwrAnimation | null = null;
let animationPlaying = false;
let animationElapsed = 0;
let animationRig: VoxelAnimationRig | null = null;
let animationDirty = false;
let currentAnimationFileName = 'animations.xml';
let selectedFrameIndex = 0;
let selectedParticleIndex = 0;
let animationPage: 'preview' | 'edit' = 'preview';
let autosaveTimer = 0;
let pickedColor = { r: 115 / 255, g: 140 / 255, b: 69 / 255 };
let colorPickerHsv = rgbToHsv(pickedColor);
let overwriteResolver: ((confirmed: boolean) => void) | null = null;
const pressedCameraActions = new Set<ShortcutAction>();

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x11141a);
scene.fog = new THREE.Fog(0x11141a, 110, 260);

const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 600);
camera.position.set(42, 38, 54);

const renderer = new THREE.WebGLRenderer({ antialias: settings.antialias, powerPreference: 'high-performance' });
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setPixelRatio(Math.min(window.devicePixelRatio, settings.pixelRatio));
renderer.shadowMap.enabled = settings.shadows;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.domElement.className = 'editor-canvas';
viewport.prepend(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.target.set(0, 24, 0);
controls.screenSpacePanning = true;

const ambient = new THREE.HemisphereLight(0xb7c9ff, 0x252015, 1.65);
scene.add(ambient);
const keyLight = new THREE.DirectionalLight(0xffffff, 2.5);
keyLight.position.set(32, 58, 38);
keyLight.castShadow = settings.shadows;
keyLight.shadow.mapSize.set(2048, 2048);
keyLight.shadow.camera.left = -70;
keyLight.shadow.camera.right = 70;
keyLight.shadow.camera.top = 90;
keyLight.shadow.camera.bottom = -20;
scene.add(keyLight);
const rimLight = new THREE.DirectionalLight(0x7297ff, 0.8);
rimLight.position.set(-30, 20, -30);
scene.add(rimLight);
const fillLight = new THREE.AmbientLight(0xffffff, 0.55);
scene.add(fillLight);

const lightingPresets: Record<EditorSettings['lightingPreset'], { ambient: number; fill: number; key: number; rim: number; exposure: number }> = {
  soft: { ambient: 1.2, fill: 0.35, key: 1.3, rim: 0.35, exposure: 0.92 },
  standard: { ambient: 1.65, fill: 0.55, key: 2.2, rim: 0.65, exposure: 1 },
  bright: { ambient: 2.2, fill: 1.05, key: 2.9, rim: 0.85, exposure: 1.08 },
  color: { ambient: 2.8, fill: 1.65, key: 0.25, rim: 0.12, exposure: 1 },
};

const grid = new THREE.GridHelper(140, 140, 0x5e6470, 0x262b34);
grid.position.y = -0.5;
grid.visible = settings.showGrid;
scene.add(grid);

const voxelGroup = new THREE.Group();
const skeletonGroup = new THREE.Group();
scene.add(voxelGroup, skeletonGroup);
let voxelMesh: THREE.InstancedMesh | null = null;
let skeletonPoints: THREE.Points | null = null;
let selectionHelper: THREE.Box3Helper | null = null;
let instanceVoxels: Voxel[] = [];
const poseMatrix = new THREE.Matrix4();
const posePosition = new THREE.Vector3();
const poseRotation = new THREE.Quaternion();
const poseScale = new THREE.Vector3(1, 1, 1);

const raycaster = new THREE.Raycaster();
raycaster.params.Points = { threshold: 1.4 };
const pointer = new THREE.Vector2();
let pointerDown = { x: 0, y: 0 };
let pointerDragged = false;
let cameraLookActive = false;
let cameraLookLast = { x: 0, y: 0 };
let shiftHeld = false;
const cameraLookDirection = new THREE.Vector3();
let boneDragPointerId: number | null = null;
const boneDragPlane = new THREE.Plane();
const boneDragOffset = new THREE.Vector3();
const boneDragIntersection = new THREE.Vector3();
const boneDragNormal = new THREE.Vector3();

const toolCopy: Record<ToolId, { label: string; hint: string; help: string }> = {
  select: { label: '选择', hint: '点击体素进行选择', help: '单击选择体素；按住 Ctrl 可多选。' },
  sculpt: { label: '雕刻', hint: '在表面添加或删除体素', help: '单击相邻表面添加体素；右键删除。可在上方切换左右键。' },
  paint: { label: '绘色', hint: '将当前颜色应用到体素', help: '单击体素应用当前颜色；已有多选时可批量绘色。' },
  picker: { label: '取色', hint: '从模型读取体素颜色', help: '单击模型中的体素，将其颜色设为当前颜色。' },
  move: { label: '移动', hint: '选择后按单位移动体素', help: '选择体素后，使用右侧方向按钮以一个单位移动。' },
};

function resizeRenderer(): void {
  const width = viewport.clientWidth;
  const height = viewport.clientHeight;
  if (!width || !height) return;
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}
new ResizeObserver(resizeRenderer).observe(viewport);
resizeRenderer();

function setStatus(message: string, type: 'normal' | 'success' | 'warning' = 'normal'): void {
  statusText.textContent = message;
  const dot = element<HTMLElement>('.status-dot');
  dot.dataset.state = type;
}

function toast(message: string, type: 'success' | 'warning' | 'normal' = 'normal'): void {
  const region = element<HTMLDivElement>('#toastRegion');
  const item = document.createElement('div');
  item.className = `toast ${type}`;
  item.textContent = message;
  region.appendChild(item);
  window.setTimeout(() => item.classList.add('show'), 10);
  window.setTimeout(() => { item.classList.remove('show'); window.setTimeout(() => item.remove(), 220); }, 3200);
}

function currentColor(): { r: number; g: number; b: number } {
  return { ...pickedColor };
}

function renderCurrentColor(): void {
  const values = [pickedColor.r, pickedColor.g, pickedColor.b].map((value) => Math.max(0, Math.min(255, Math.round(value * 255))));
  redValue.value = String(values[0]);
  greenValue.value = String(values[1]);
  blueValue.value = String(values[2]);
  redSlider.value = String(values[0]); greenSlider.value = String(values[1]); blueSlider.value = String(values[2]);
  redSliderValue.value = String(values[0]); greenSliderValue.value = String(values[1]); blueSliderValue.value = String(values[2]);
  colorSwatch.style.background = `#${values.map((value) => value.toString(16).padStart(2, '0')).join('')}`;
  hueRing.style.setProperty('--picker-hue', String(colorPickerHsv.h));
  const angle = THREE.MathUtils.degToRad(colorPickerHsv.h);
  const ringCenter = 77; const ringRadius = 70;
  hueHandle.style.left = `${ringCenter + Math.sin(angle) * ringRadius}px`;
  hueHandle.style.top = `${ringCenter - Math.cos(angle) * ringRadius}px`;
  colorSquareHandle.style.left = `${colorPickerHsv.s * 100}%`;
  colorSquareHandle.style.top = `${(1 - colorPickerHsv.v) * 100}%`;
  redSlider.style.background = `linear-gradient(to right,rgb(0 ${values[1]} ${values[2]}),rgb(255 ${values[1]} ${values[2]}))`;
  greenSlider.style.background = `linear-gradient(to right,rgb(${values[0]} 0 ${values[2]}),rgb(${values[0]} 255 ${values[2]}))`;
  blueSlider.style.background = `linear-gradient(to right,rgb(${values[0]} ${values[1]} 0),rgb(${values[0]} ${values[1]} 255))`;
}

function setCurrentColor(r: number, g: number, b: number): void {
  pickedColor = { r: Math.max(0, Math.min(1, r)), g: Math.max(0, Math.min(1, g)), b: Math.max(0, Math.min(1, b)) };
  colorPickerHsv = rgbToHsv(pickedColor);
  renderCurrentColor();
}

function setCurrentColorFromHsv(): void {
  pickedColor = hsvToRgb(colorPickerHsv);
  renderCurrentColor();
}

function closeColorPicker(): void {
  colorPickerPopover.classList.add('hidden');
  colorSwatch.setAttribute('aria-expanded', 'false');
}

function toggleColorPicker(): void {
  const opening = colorPickerPopover.classList.contains('hidden');
  colorPickerPopover.classList.toggle('hidden', !opening);
  colorSwatch.setAttribute('aria-expanded', String(opening));
  if (opening) renderCurrentColor();
}

function bindColorPickerSurface(target: HTMLElement, update: (event: PointerEvent) => void): void {
  target.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return;
    event.preventDefault(); event.stopPropagation();
    target.setPointerCapture(event.pointerId); update(event);
  });
  target.addEventListener('pointermove', (event) => {
    if (!target.hasPointerCapture(event.pointerId) || !(event.buttons & 1)) return;
    event.preventDefault(); event.stopPropagation(); update(event);
  });
}

function clearGroup(group: THREE.Group): void {
  for (const child of [...group.children]) {
    group.remove(child);
    if (child instanceof THREE.Mesh || child instanceof THREE.LineSegments || child instanceof THREE.Points) {
      child.geometry.dispose();
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      materials.forEach((material) => material.dispose());
    }
  }
}

function rebuildVoxelMesh(): void {
  clearGroup(voxelGroup);
  voxelMesh = null;
  animationRig = null;
  instanceVoxels = model?.voxels ?? [];
  if (!model || !instanceVoxels.length) { updateSelectionHelper(); return; }

  const geometry = new THREE.BoxGeometry(0.96, 0.96, 0.96);
  const material = settings.lightingPreset === 'color'
    ? new THREE.MeshBasicMaterial()
    : new THREE.MeshLambertMaterial();
  voxelMesh = new THREE.InstancedMesh(geometry, material, instanceVoxels.length);
  voxelMesh.castShadow = settings.shadows;
  voxelMesh.receiveShadow = settings.shadows;
  const matrix = new THREE.Matrix4();
  const color = new THREE.Color();
  instanceVoxels.forEach((voxel, index) => {
    matrix.makeTranslation(voxel.x, voxel.y, voxel.z);
    voxelMesh!.setMatrixAt(index, matrix);
    // RWR 文件中的 RGB 是线性数值；再次按 sRGB 解码会让暗色几乎变黑。
    color.setRGB(voxel.r, voxel.g, voxel.b);
    if (selectedIds.has(voxel.id)) color.lerp(new THREE.Color(settings.accent), 0.38);
    voxelMesh!.setColorAt(index, color);
  });
  voxelMesh.instanceMatrix.needsUpdate = true;
  if (voxelMesh.instanceColor) voxelMesh.instanceColor.needsUpdate = true;
  voxelGroup.add(voxelMesh);
  animationRig = new VoxelAnimationRig(model);
  updateSelectionHelper();
  const positions = activeAnimation ? sampledAnimationPositions(activeAnimation, animationElapsed) : undefined;
  applyVoxelAnimation(positions);
}

function applyVoxelAnimation(animatedPositions?: Vec3[]): void {
  if (!model || !voxelMesh) return;
  const driveVoxels = Boolean(animatedPositions && animationVoxelToggle.checked && animationRig?.boundCount);
  instanceVoxels.forEach((voxel, index) => {
    if (driveVoxels && animationRig!.getPose(index, animatedPositions!, posePosition, poseRotation)) {
      poseMatrix.compose(posePosition, poseRotation, poseScale);
    } else {
      poseMatrix.makeTranslation(voxel.x, voxel.y, voxel.z);
    }
    voxelMesh!.setMatrixAt(index, poseMatrix);
  });
  voxelMesh.instanceMatrix.needsUpdate = true;
  voxelMesh.computeBoundingSphere();
  if (selectionHelper) selectionHelper.visible = !driveVoxels;
}

function skeletonPositions(): Vec3[] {
  return model?.skeleton.map((particle) => ({ x: particle.x, y: particle.y, z: particle.z })) ?? [];
}

function rebuildSkeleton(override?: Vec3[]): void {
  clearGroup(skeletonGroup);
  skeletonPoints = null;
  if (!model || !settings.showSkeleton || !model.skeleton.length) return;
  const positions = override ?? skeletonPositions();
  const byId = new Map(model.skeleton.map((particle, index) => [particle.id, positions[index] ?? particle]));
  const points: number[] = [];
  model.sticks.forEach((stick) => {
    const a = byId.get(stick.a); const b = byId.get(stick.b);
    if (a && b) points.push(a.x, a.y, a.z, b.x, b.y, b.z);
  });
  const lineGeometry = new THREE.BufferGeometry();
  lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
  const lineMaterial = new THREE.LineBasicMaterial({ color: settings.accent, transparent: true, opacity: 0.92, depthTest: false });
  const lines = new THREE.LineSegments(lineGeometry, lineMaterial);
  lines.renderOrder = 4;
  skeletonGroup.add(lines);

  const pointGeometry = new THREE.BufferGeometry();
  pointGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions.flatMap((point) => [point.x, point.y, point.z]), 3));
  const pointMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 1.25, sizeAttenuation: true, depthTest: false });
  const particlePoints = new THREE.Points(pointGeometry, pointMaterial);
  particlePoints.renderOrder = 5;
  skeletonGroup.add(particlePoints);
  skeletonPoints = particlePoints;
  if (animationPage === 'edit' && positions[selectedParticleIndex]) {
    const selected = positions[selectedParticleIndex]!;
    const selectedGeometry = new THREE.BufferGeometry();
    selectedGeometry.setAttribute('position', new THREE.Float32BufferAttribute([selected.x, selected.y, selected.z], 3));
    const selectedMaterial = new THREE.PointsMaterial({ color: settings.accent, size: 2.25, sizeAttenuation: true, depthTest: false });
    const selectedPoint = new THREE.Points(selectedGeometry, selectedMaterial);
    selectedPoint.renderOrder = 6;
    skeletonGroup.add(selectedPoint);
  }
}

function updateSelectionHelper(): void {
  if (selectionHelper) {
    scene.remove(selectionHelper);
    selectionHelper.geometry.dispose();
    const materials = Array.isArray(selectionHelper.material) ? selectionHelper.material : [selectionHelper.material];
    materials.forEach((material) => material.dispose());
    selectionHelper = null;
  }
  if (!model || !selectedIds.size) return;
  const selected = model.voxels.filter((voxel) => selectedIds.has(voxel.id));
  if (!selected.length) return;
  const box = new THREE.Box3();
  selected.forEach((voxel) => box.expandByPoint(new THREE.Vector3(voxel.x, voxel.y, voxel.z)));
  box.min.addScalar(-0.55); box.max.addScalar(0.55);
  selectionHelper = new THREE.Box3Helper(box, new THREE.Color(settings.accent));
  selectionHelper.renderOrder = 6;
  scene.add(selectionHelper);
}

function updateStats(): void {
  voxelCount.textContent = String(model?.voxels.length ?? 0);
  selectedCount.textContent = String(selectedIds.size);
  boneCount.textContent = String(model?.skeleton.length ?? 0);
  bindingCount.textContent = String(model?.bindings.length ?? 0);
  const bound = new Set<string>();
  model?.bindings.forEach((group) => group.voxelIds.forEach((id) => bound.add(id)));
  unboundCount.textContent = String(model ? model.voxels.filter((voxel) => !bound.has(voxel.id)).length : 0);
  dirtyState.textContent = !model ? '未加载' : model.dirty ? '有未保存修改' : '已载入';
  dirtyState.classList.toggle('dirty', Boolean(model?.dirty));
  fileState.textContent = !model ? '—' : model.dirty ? '已修改' : currentFilePath ? '已保存' : '未命名';
  selectionSummary.textContent = selectedIds.size ? `已选择 ${selectedIds.size} 个体素` : '未选择体素';
  const selected = model?.voxels.filter((voxel) => selectedIds.has(voxel.id)) ?? [];
  if (selected.length === 1) {
    const voxel = selected[0]!;
    selectionPosition.textContent = `X ${voxel.x}  ·  Y ${voxel.y}  ·  Z ${voxel.z}`;
  } else if (selected.length > 1) {
    const xs = selected.map((v) => v.x); const ys = selected.map((v) => v.y); const zs = selected.map((v) => v.z);
    selectionPosition.textContent = `范围 ${Math.max(...xs) - Math.min(...xs) + 1} × ${Math.max(...ys) - Math.min(...ys) + 1} × ${Math.max(...zs) - Math.min(...zs) + 1}`;
  } else selectionPosition.textContent = '—';
  deleteSelectionBtn.disabled = !selectedIds.size;
  saveAsBtn.disabled = !model;
  overwriteBtn.disabled = !model || !currentFilePath;
  rebindBtn.disabled = !model?.skeleton.length;
  undoBtn.disabled = !undoStack.length;
  redoBtn.disabled = !redoStack.length;
  updateAnimationBindingStatus();
}

function updateAnimationBindingStatus(): void {
  const total = model?.voxels.length ?? 0;
  const bound = animationRig?.boundCount ?? 0;
  animationVoxelToggle.disabled = !model?.skeleton.length || bound === 0;
  if (!model) animationBindingStatus.textContent = '请先载入模型';
  else if (!model.skeleton.length) animationBindingStatus.textContent = '模型没有骨骼';
  else if (!bound) animationBindingStatus.textContent = '没有可用的体素绑定';
  else if (bound === total) animationBindingStatus.textContent = `${bound} / ${total} 个体素已绑定`;
  else animationBindingStatus.textContent = `${bound} / ${total} 已绑定 · ${total - bound} 个保持原位`;
}

function frameModel(): void {
  if (!model || !model.voxels.length) return;
  const { min, max, center } = model.bounds;
  const size = Math.max(max.x - min.x, max.y - min.y, max.z - min.z, 10);
  controls.target.set(center.x, center.y, center.z);
  camera.position.set(center.x + size * 1.1, center.y + size * 0.78, center.z + size * 1.35);
  camera.near = Math.max(0.05, size / 1000);
  camera.far = Math.max(400, size * 12);
  camera.updateProjectionMatrix();
  controls.update();
}

function loadModelText(text: string, name: string, path = ''): void {
  try {
    model = RwrModel.parse(text);
    currentFileName = name;
    currentFilePath = path;
    selectedIds.clear(); undoStack = []; redoStack = [];
    modelName.textContent = name;
    modelPath.textContent = path || '未命名模型 · 请使用“另存为”';
    emptyState.classList.add('hidden');
    rebuildVoxelMesh(); renderAnimationPose(); frameModel(); updateStats(); updateAnimationEditor();
    setStatus(`已载入 ${model.voxels.length} 个体素`, 'success');
    toast(`模型已载入：${name}`, 'success');
  } catch (error) {
    const message = error instanceof Error ? error.message : '无法读取模型。';
    setStatus(message, 'warning'); toast(message, 'warning');
  }
}

function loadAnimationText(text: string, name: string): void {
  try {
    animations = parseAnimations(text);
    activeAnimation = animations[0] ?? null;
    currentAnimationFileName = name;
    animationDirty = false;
    selectedFrameIndex = 0;
    updateAnimationSelect();
    animationPlayBtn.disabled = !activeAnimation || !model?.skeleton.length;
    animationTime.disabled = !activeAnimation;
    animationElapsed = 0; animationPlaying = false; animationPlayBtn.textContent = '▶';
    updateAnimationUi(); renderAnimationPose(); updateAnimationEditor();
    animationWorkspace.open = true;
    toast(`已载入 ${animations.length} 个动画`, 'success');
  } catch (error) {
    toast(error instanceof Error ? error.message : '无法读取动画文件。', 'warning');
  }
}

function clonePositions(positions: Vec3[]): Vec3[] {
  return positions.map((position) => ({ ...position }));
}

function cloneAnimation(animation: RwrAnimation, name: string): RwrAnimation {
  return {
    ...animation,
    name,
    frames: animation.frames.map((frame) => ({ time: frame.time, positions: clonePositions(frame.positions) })),
  };
}

function uniqueAnimationName(base: string): string {
  const names = new Set(animations.map((animation) => animation.name));
  if (!names.has(base)) return base;
  let number = 2;
  while (names.has(`${base} ${number}`)) number += 1;
  return `${base} ${number}`;
}

function currentKeyframe(): RwrAnimation['frames'][number] | null {
  return activeAnimation?.frames[selectedFrameIndex] ?? null;
}

function ensureFramePositions(frame: RwrAnimation['frames'][number]): void {
  if (!model) return;
  while (frame.positions.length < model.skeleton.length) {
    const particle = model.skeleton[frame.positions.length]!;
    frame.positions.push({ x: particle.x, y: particle.y, z: particle.z });
  }
}

function updateAnimationSelect(): void {
  const activeIndex = activeAnimation ? animations.indexOf(activeAnimation) : -1;
  animationSelect.replaceChildren();
  if (!animations.length) {
    const option = document.createElement('option');
    option.textContent = '未载入动画文件'; animationSelect.appendChild(option);
  } else {
    animations.forEach((animation, index) => {
      const option = document.createElement('option');
      option.value = String(index); option.textContent = `${animation.name} · ${animation.frames.length} 帧`;
      animationSelect.appendChild(option);
    });
  }
  animationSelect.disabled = !animations.length;
  if (activeIndex >= 0) animationSelect.value = String(activeIndex);
}

function updateAnimationWorkspaceStatus(): void {
  animationSummaryStatus.textContent = animations.length
    ? `${animations.length} 个动画${animationDirty ? ' · 未导出' : ''}`
    : '未载入动画';
  animationInfo.textContent = animations.length
    ? `${currentAnimationFileName} · 共 ${animations.length} 个动画${animationDirty ? ' · 有未导出修改' : ''}`
    : '载入动画 XML 后可同步预览骨骼与体素。';
  saveAnimationsBtn.disabled = !animations.length;
}

function markAnimationDirty(): void {
  animationDirty = true;
  updateAnimationWorkspaceStatus();
}

function updateAnimationEditor(): void {
  const animation = activeAnimation;
  const hasAnimation = Boolean(animation);
  duplicateAnimationBtn.disabled = !hasAnimation;
  deleteAnimationBtn.disabled = !hasAnimation;
  [animationNameInput, animationEndInput, animationSpeedInput, animationSpreadInput, animationLoopInput].forEach((input) => { input.disabled = !hasAnimation; });
  if (animation) {
    animationNameInput.value = animation.name;
    animationEndInput.value = String(animation.end);
    animationSpeedInput.value = String(animation.speed);
    animationSpreadInput.value = String(animation.speedSpread);
    animationLoopInput.checked = animation.loop;
  } else {
    animationNameInput.value = ''; animationEndInput.value = ''; animationSpeedInput.value = ''; animationSpreadInput.value = ''; animationLoopInput.checked = false;
  }

  keyframeSelect.replaceChildren();
  const frames = animation?.frames ?? [];
  selectedFrameIndex = Math.max(0, Math.min(selectedFrameIndex, frames.length - 1));
  frames.forEach((frame, index) => {
    const option = document.createElement('option');
    option.value = String(index); option.textContent = `第 ${index + 1} 帧 · ${frame.time.toFixed(3)}s`;
    keyframeSelect.appendChild(option);
  });
  if (!frames.length) {
    const option = document.createElement('option'); option.textContent = '没有关键帧'; keyframeSelect.appendChild(option);
  }
  keyframeSelect.disabled = !frames.length;
  if (frames.length) keyframeSelect.value = String(selectedFrameIndex);
  keyframeCount.textContent = `${frames.length} 帧`;
  const canEditFrames = Boolean(animation && model?.skeleton.length);
  addKeyframeBtn.disabled = !canEditFrames;
  duplicateKeyframeBtn.disabled = !canEditFrames || !frames.length;
  deleteKeyframeBtn.disabled = !canEditFrames || frames.length <= 1;
  keyframeTimeInput.disabled = !frames.length;
  keyframeTimeInput.value = frames[selectedFrameIndex] ? String(frames[selectedFrameIndex]!.time) : '';

  const previousParticle = selectedParticleIndex;
  particleSelect.replaceChildren();
  model?.skeleton.forEach((particle, index) => {
    const option = document.createElement('option');
    option.value = String(index); option.textContent = `${index + 1}. ${particle.name || `骨骼点 ${particle.id}`}`;
    particleSelect.appendChild(option);
  });
  if (!model?.skeleton.length) {
    const option = document.createElement('option'); option.textContent = '请先载入带骨骼的模型'; particleSelect.appendChild(option);
  }
  selectedParticleIndex = Math.max(0, Math.min(previousParticle, (model?.skeleton.length ?? 1) - 1));
  particleSelect.disabled = !canEditFrames || !frames.length;
  if (model?.skeleton.length) particleSelect.value = String(selectedParticleIndex);
  updateParticleFields();
  updateAnimationWorkspaceStatus();
  updateBoneEditingState();
}

function updateParticleFields(): void {
  const frame = currentKeyframe();
  if (frame) ensureFramePositions(frame);
  const position = frame?.positions[selectedParticleIndex];
  const enabled = Boolean(position && model?.skeleton[selectedParticleIndex]);
  [particleXInput, particleYInput, particleZInput].forEach((input) => { input.disabled = !enabled; });
  resetParticleBtn.disabled = !enabled;
  particleXInput.value = position ? String(position.x) : '';
  particleYInput.value = position ? String(position.y) : '';
  particleZInput.value = position ? String(position.z) : '';
}

function selectKeyframe(index: number): void {
  if (!activeAnimation?.frames[index]) return;
  selectedFrameIndex = index;
  const frame = activeAnimation.frames[index]!;
  ensureFramePositions(frame);
  animationPlaying = false; animationPlayBtn.textContent = '▶'; animationElapsed = frame.time;
  updateAnimationUi(); updateAnimationEditor(); renderAnimationPose(frame.positions);
}

function commit(label: string, operation: () => boolean | void): void {
  if (!model) return;
  const before = model.snapshot();
  const result = operation();
  if (result === false) { toast('目标位置被其它体素占用。', 'warning'); return; }
  undoStack.push(before);
  if (undoStack.length > 60) undoStack.shift();
  redoStack = [];
  rebuildVoxelMesh(); updateStats(); scheduleAutosave(); setStatus(label, 'success');
}

function undo(): void {
  if (!model || !undoStack.length) return;
  redoStack.push(model.snapshot());
  model.restore(undoStack.pop()!);
  selectedIds = new Set([...selectedIds].filter((id) => model!.voxels.some((voxel) => voxel.id === id)));
  rebuildVoxelMesh(); updateStats(); setStatus('已撤销上一步');
}

function redo(): void {
  if (!model || !redoStack.length) return;
  undoStack.push(model.snapshot());
  model.restore(redoStack.pop()!);
  selectedIds = new Set([...selectedIds].filter((id) => model!.voxels.some((voxel) => voxel.id === id)));
  rebuildVoxelMesh(); updateStats(); setStatus('已重做');
}

function scheduleAutosave(): void {
  if (!settings.autosave || !model) return;
  window.clearTimeout(autosaveTimer);
  autosaveTimer = window.setTimeout(() => {
    if (!model) return;
    try { localStorage.setItem('rwr-editor-recovery', JSON.stringify({ name: currentFileName, savedAt: Date.now(), xml: model.serialize() })); }
    catch { /* 浏览器配额不足时不影响编辑 */ }
  }, 900);
}

function setTool(tool: ToolId): void {
  activeTool = tool;
  document.querySelectorAll<HTMLButtonElement>('[data-tool]').forEach((button) => {
    const active = button.dataset.tool === tool;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  document.querySelectorAll<HTMLElement>('[data-tool-panel]').forEach((panel) => {
    panel.classList.toggle('tool-panel-hidden', !(panel.dataset.toolPanel?.split(' ').includes(tool)));
  });
  activeToolLabel.textContent = toolCopy[tool].label;
  toolModeTitle.textContent = `${toolCopy[tool].label}模式`;
  toolModeHint.textContent = toolCopy[tool].hint;
  toolHelp.textContent = toolCopy[tool].help;
  viewport.dataset.tool = tool;
  if (tool === 'select' || tool === 'move') closeColorPicker();
  setStatus(`工具：${toolCopy[tool].label}`);
}

function updatePointer(event: PointerEvent): void {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
}

function hitVoxel(event: PointerEvent): { voxel: Voxel; index: number; normal: THREE.Vector3 } | null {
  if (!voxelMesh) return null;
  updatePointer(event);
  raycaster.setFromCamera(pointer, camera);
  const hit = raycaster.intersectObject(voxelMesh, false)[0];
  if (!hit || hit.instanceId === undefined) return null;
  const voxel = instanceVoxels[hit.instanceId];
  if (!voxel) return null;
  const normal = hit.face?.normal.clone().round() ?? new THREE.Vector3(0, 1, 0);
  return { voxel, index: hit.instanceId, normal };
}

function boneEditingAvailable(): boolean {
  return animationPage === 'edit' && Boolean(model?.skeleton.length && currentKeyframe() && settings.showSkeleton);
}

function updateBoneEditingState(): void {
  const enabled = boneEditingAvailable();
  renderer.domElement.dataset.boneEditing = String(enabled);
  if (!enabled && boneDragPointerId !== null) endBoneDrag(boneDragPointerId);
}

function hitSkeletonParticle(event: PointerEvent): number | null {
  if (!boneEditingAvailable() || !skeletonPoints) return null;
  updatePointer(event);
  raycaster.setFromCamera(pointer, camera);
  const hit = raycaster.intersectObject(skeletonPoints, false)[0];
  return hit?.index === undefined ? null : hit.index;
}

function beginBoneDrag(event: PointerEvent): boolean {
  if (event.button !== 0) return false;
  const particleIndex = hitSkeletonParticle(event);
  const frame = currentKeyframe();
  if (particleIndex === null || !frame || !model?.skeleton[particleIndex]) return false;
  ensureFramePositions(frame);
  const position = frame.positions[particleIndex];
  if (!position) return false;
  selectedParticleIndex = particleIndex;
  particleSelect.value = String(particleIndex);
  updateParticleFields();
  camera.getWorldDirection(boneDragNormal).normalize();
  boneDragPlane.setFromNormalAndCoplanarPoint(boneDragNormal, new THREE.Vector3(position.x, position.y, position.z));
  updatePointer(event);
  raycaster.setFromCamera(pointer, camera);
  if (!raycaster.ray.intersectPlane(boneDragPlane, boneDragIntersection)) return false;
  boneDragOffset.set(position.x, position.y, position.z).sub(boneDragIntersection);
  boneDragPointerId = event.pointerId;
  controls.enabled = false;
  renderer.domElement.classList.add('dragging-bone');
  renderer.domElement.setPointerCapture(event.pointerId);
  renderAnimationPose(frame.positions);
  event.preventDefault(); event.stopImmediatePropagation();
  return true;
}

function updateBoneDrag(event: PointerEvent): boolean {
  if (boneDragPointerId !== event.pointerId) return false;
  const frame = currentKeyframe();
  const position = frame?.positions[selectedParticleIndex];
  if (!frame || !position) { endBoneDrag(event.pointerId); return true; }
  updatePointer(event);
  raycaster.setFromCamera(pointer, camera);
  if (raycaster.ray.intersectPlane(boneDragPlane, boneDragIntersection)) {
    boneDragIntersection.add(boneDragOffset);
    position.x = boneDragIntersection.x; position.y = boneDragIntersection.y; position.z = boneDragIntersection.z;
    pointerDragged = true;
    updateParticleFields(); markAnimationDirty(); renderAnimationPose(frame.positions);
  }
  event.preventDefault(); event.stopImmediatePropagation();
  return true;
}

function endBoneDrag(pointerId: number): boolean {
  if (boneDragPointerId !== pointerId) return false;
  boneDragPointerId = null;
  controls.enabled = true;
  renderer.domElement.classList.remove('dragging-bone');
  if (renderer.domElement.hasPointerCapture(pointerId)) renderer.domElement.releasePointerCapture(pointerId);
  setStatus(`已编辑骨骼点 ${selectedParticleIndex + 1}`, 'success');
  return true;
}

function handleVoxelAction(event: PointerEvent): void {
  if (!model) return;
  if (activeAnimation && animationVoxelToggle.checked && animationRig?.boundCount) {
    toast('动画体素预览中不可编辑；关闭“体素跟随骨骼”后可继续编辑。', 'warning');
    return;
  }
  const hit = hitVoxel(event);
  if (!hit) {
    if (activeTool === 'select' && !event.ctrlKey) { selectedIds.clear(); rebuildVoxelMesh(); updateStats(); }
    return;
  }
  const { voxel, normal } = hit;
  if (activeTool === 'select' || activeTool === 'move') {
    if (!event.ctrlKey) selectedIds.clear();
    if (event.ctrlKey && selectedIds.has(voxel.id)) selectedIds.delete(voxel.id); else selectedIds.add(voxel.id);
    rebuildVoxelMesh(); updateStats();
    return;
  }
  if (activeTool === 'picker') {
    setCurrentColor(voxel.r, voxel.g, voxel.b);
    toast('已吸取体素颜色', 'success');
    return;
  }
  if (activeTool === 'paint') {
    const ids = selectedIds.size && selectedIds.has(voxel.id) ? new Set(selectedIds) : new Set([voxel.id]);
    commit(`已绘色 ${ids.size} 个体素`, () => { model!.paint(ids, currentColor()); });
    return;
  }
  if (activeTool === 'sculpt') {
    const primaryAdd = sculptMode.value === 'add';
    const add = event.button === 0 ? primaryAdd : !primaryAdd;
    if (add) {
      const position = { x: voxel.x + Math.round(normal.x), y: voxel.y + Math.round(normal.y), z: voxel.z + Math.round(normal.z) };
      commit(`已添加体素 (${position.x}, ${position.y}, ${position.z})`, () => Boolean(model!.addVoxel(position, currentColor())));
    } else {
      commit(`已删除体素 (${voxel.x}, ${voxel.y}, ${voxel.z})`, () => { model!.remove(new Set([voxel.id])); selectedIds.delete(voxel.id); });
    }
  }
}

function moveSelection(delta: Vec3): void {
  if (!model || !selectedIds.size) return;
  commit(`已移动 ${selectedIds.size} 个体素`, () => model!.move(selectedIds, delta));
}

async function openFile(kind: 'model' | 'animation'): Promise<void> {
  if (kind === 'animation' && animationDirty && !window.confirm('当前动画有未导出修改。确定放弃并载入其他动画文件吗？')) return;
  if (desktopBridge.isAvailable()) {
    const result = await desktopBridge.openTextFile(kind);
    if (!result) return;
    if (kind === 'model') loadModelText(result.text, result.name, result.path);
    else loadAnimationText(result.text, result.name);
  } else {
    (kind === 'model' ? modelFileInput : animationFileInput).click();
  }
}

async function saveModelAs(): Promise<boolean> {
  if (!model) return false;
  try {
    const xml = model.serialize();
    const stem = currentFileName.replace(/\.xml$/i, '');
    const defaultName = currentFilePath ? `${stem}_edited.xml` : currentFileName;
    if (desktopBridge.isAvailable()) {
      const result = await desktopBridge.saveTextFile(defaultName, xml);
      if (!result) return false;
      currentFileName = result.name; currentFilePath = result.path;
      modelName.textContent = result.name; modelPath.textContent = result.path;
      model.dirty = false; updateStats(); toast(`已另存为：${result.name}`, 'success'); setStatus(`已保存：${result.path}`, 'success');
    } else {
      const blob = new Blob([xml], { type: 'application/xml;charset=utf-8' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob); link.download = defaultName; link.click(); URL.revokeObjectURL(link.href);
      model.dirty = false; updateStats(); toast(`已导出：${defaultName}`, 'success');
    }
    return true;
  } catch (error) {
    toast(error instanceof Error ? error.message : '导出失败。', 'warning');
    return false;
  }
}

function closeOverwriteModal(confirmed: boolean): void {
  overwriteModal.classList.add('hidden');
  const resolver = overwriteResolver;
  overwriteResolver = null;
  resolver?.(confirmed);
}

function requestOverwriteConfirmation(): Promise<boolean> {
  if (!settings.confirmOverwrite) return Promise.resolve(true);
  element<HTMLElement>('#overwritePath').textContent = `即将替换：${currentFilePath}`;
  overwriteConfirmCheck.checked = false;
  confirmOverwriteBtn.disabled = true;
  overwriteModal.classList.remove('hidden');
  return new Promise((resolve) => { overwriteResolver = resolve; });
}

async function overwriteModel(): Promise<boolean> {
  if (!model || !currentFilePath || !desktopBridge.isAvailable()) return false;
  if (!await requestOverwriteConfirmation()) return false;
  try {
    const result = await desktopBridge.overwriteTextFile(currentFilePath, model.serialize());
    model.dirty = false; updateStats(); toast(`已覆盖保存：${result.name}`, 'success'); setStatus(`已覆盖：${result.path}`, 'success');
    return true;
  } catch (error) {
    toast(error instanceof Error ? error.message : '覆盖保存失败。', 'warning');
    return false;
  }
}

function createNewModel(base: 1 | 8): void {
  model = RwrModel.createNew(base);
  model.dirty = true;
  currentFileName = 'untitled.xml'; currentFilePath = '';
  selectedIds.clear(); undoStack = []; redoStack = [];
  modelName.textContent = 'untitled.xml'; modelPath.textContent = '未命名模型 · 请使用“另存为”';
  emptyState.classList.add('hidden'); unsavedModelModal.classList.add('hidden');
  rebuildVoxelMesh(); renderAnimationPose(); frameModel(); updateStats(); updateAnimationEditor(); setTool('sculpt');
  setStatus(`已创建含 ${base} 个基点体素的新模型`, 'success');
  toast('新模型已创建；保存时请选择目录和文件名。', 'success');
}

function switchAnimationPage(page: 'preview' | 'edit'): void {
  animationPage = page;
  document.querySelectorAll<HTMLButtonElement>('[data-animation-page]').forEach((button) => button.classList.toggle('active', button.dataset.animationPage === page));
  document.querySelectorAll<HTMLElement>('[data-animation-panel]').forEach((panel) => panel.classList.toggle('active', panel.dataset.animationPanel === page));
  updateBoneEditingState();
  renderAnimationPose(page === 'edit' ? currentKeyframe()?.positions : undefined);
}

function createAnimation(): void {
  if (!model?.skeleton.length) {
    toast('请先载入一个带骨骼的模型。', 'warning'); return;
  }
  const animation: RwrAnimation = {
    name: uniqueAnimationName('新动画'), loop: true, end: 1, speed: 1, speedSpread: 0,
    frames: [{ time: 0, positions: clonePositions(skeletonPositions()) }],
  };
  animations.push(animation); activeAnimation = animation; selectedFrameIndex = 0; animationElapsed = 0;
  animationPlaying = false; animationPlayBtn.textContent = '▶'; animationPlayBtn.disabled = false; animationTime.disabled = false;
  markAnimationDirty(); updateAnimationSelect(); updateAnimationUi(); updateAnimationEditor(); renderAnimationPose(animation.frames[0]!.positions);
  animationWorkspace.open = true; switchAnimationPage('edit');
  toast('已创建包含初始关键帧的新动画。', 'success');
}

function duplicateAnimation(): void {
  if (!activeAnimation) return;
  const copy = cloneAnimation(activeAnimation, uniqueAnimationName(`${activeAnimation.name} 副本`));
  animations.push(copy); activeAnimation = copy; selectedFrameIndex = 0; animationElapsed = copy.frames[0]?.time ?? 0;
  markAnimationDirty(); updateAnimationSelect(); updateAnimationUi(); updateAnimationEditor(); renderAnimationPose(copy.frames[0]?.positions);
  toast('动画已复制。', 'success');
}

function deleteAnimation(): void {
  if (!activeAnimation) return;
  if (!window.confirm(`确定删除动画“${activeAnimation.name}”吗？`)) return;
  const index = animations.indexOf(activeAnimation);
  if (index >= 0) animations.splice(index, 1);
  activeAnimation = animations[Math.min(index, animations.length - 1)] ?? null;
  selectedFrameIndex = 0; animationElapsed = 0; animationPlaying = false; animationPlayBtn.textContent = '▶';
  animationPlayBtn.disabled = !activeAnimation || !model?.skeleton.length; animationTime.disabled = !activeAnimation;
  markAnimationDirty(); updateAnimationSelect(); updateAnimationUi(); updateAnimationEditor(); renderAnimationPose();
  toast('动画已删除。', 'success');
}

function addKeyframe(duplicateCurrent = false): void {
  if (!activeAnimation || !model?.skeleton.length) return;
  const current = currentKeyframe();
  const positions = duplicateCurrent && current
    ? clonePositions(current.positions)
    : clonePositions(sampledAnimationPositions(activeAnimation, animationElapsed));
  while (positions.length < model.skeleton.length) {
    const particle = model.skeleton[positions.length]!;
    positions.push({ x: particle.x, y: particle.y, z: particle.z });
  }
  const lastTime = activeAnimation.frames.at(-1)?.time ?? -0.1;
  let time = duplicateCurrent && current ? current.time + 0.1 : animationElapsed;
  if (activeAnimation.frames.some((frame) => Math.abs(frame.time - time) < 0.000001)) time = lastTime + 0.1;
  const frame = { time: Math.max(0, time), positions };
  activeAnimation.frames.push(frame);
  activeAnimation.frames.sort((a, b) => a.time - b.time);
  selectedFrameIndex = activeAnimation.frames.indexOf(frame);
  activeAnimation.end = Math.max(activeAnimation.end, frame.time);
  markAnimationDirty(); updateAnimationSelect(); selectKeyframe(selectedFrameIndex);
  toast(duplicateCurrent ? '关键帧已复制。' : '关键帧已新增。', 'success');
}

function deleteKeyframe(): void {
  if (!activeAnimation || activeAnimation.frames.length <= 1) {
    toast('动画至少需要保留一个关键帧。', 'warning'); return;
  }
  activeAnimation.frames.splice(selectedFrameIndex, 1);
  selectedFrameIndex = Math.min(selectedFrameIndex, activeAnimation.frames.length - 1);
  markAnimationDirty(); updateAnimationSelect(); selectKeyframe(selectedFrameIndex);
  toast('关键帧已删除。', 'success');
}

function updateParticlePosition(): void {
  const frame = currentKeyframe();
  if (!frame) return;
  ensureFramePositions(frame);
  const position = frame.positions[selectedParticleIndex];
  if (!position) return;
  if ([particleXInput, particleYInput, particleZInput].some((input) => input.value.trim() === '')) return;
  const x = Number(particleXInput.value); const y = Number(particleYInput.value); const z = Number(particleZInput.value);
  if (![x, y, z].every(Number.isFinite)) return;
  position.x = x; position.y = y; position.z = z;
  markAnimationDirty(); renderAnimationPose(frame.positions);
}

async function saveAnimationFile(): Promise<void> {
  if (!animations.length) return;
  try {
    const xml = serializeAnimations(animations);
    const stem = currentAnimationFileName.replace(/\.xml$/i, '');
    const defaultName = `${stem}_edited.xml`;
    if (desktopBridge.isAvailable()) {
      const result = await desktopBridge.saveTextFile(defaultName, xml);
      if (!result) return;
      currentAnimationFileName = result.name; animationDirty = false; updateAnimationWorkspaceStatus();
      toast(`动画已导出：${result.name}`, 'success'); setStatus(`动画已保存：${result.path}`, 'success');
    } else {
      const blob = new Blob([xml], { type: 'application/xml;charset=utf-8' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob); link.download = defaultName; link.click(); URL.revokeObjectURL(link.href);
      animationDirty = false; updateAnimationWorkspaceStatus(); toast(`动画已导出：${defaultName}`, 'success');
    }
  } catch (error) {
    toast(error instanceof Error ? error.message : '动画导出失败。', 'warning');
  }
}

async function readInputFile(input: HTMLInputElement, kind: 'model' | 'animation'): Promise<void> {
  const file = input.files?.[0];
  if (!file) return;
  const text = await file.text();
  if (kind === 'model') loadModelText(text, file.name); else loadAnimationText(text, file.name);
  input.value = '';
}

function updateAnimationUi(): void {
  if (!activeAnimation) {
    animationClock.textContent = '0.00s'; return;
  }
  const end = Math.max(activeAnimation.end, activeAnimation.frames.at(-1)?.time ?? 0, 0.001);
  animationTime.value = String(Math.round((animationElapsed / end) * 1000));
  animationClock.textContent = `${animationElapsed.toFixed(2)}s`;
}

function sampledAnimationPositions(animation: RwrAnimation, time: number): Vec3[] {
  if (!animation.frames.length) return skeletonPositions();
  const nextIndex = animation.frames.findIndex((frame) => frame.time >= time);
  if (nextIndex === -1) return animation.frames.at(-1)?.positions ?? skeletonPositions();
  if (nextIndex === 0) return animation.frames[0]?.positions ?? skeletonPositions();
  const next = animation.frames[nextIndex]!;
  const previous = animation.frames[nextIndex - 1]!;
  const span = Math.max(0.0001, next.time - previous.time);
  const mix = Math.max(0, Math.min(1, (time - previous.time) / span));
  return previous.positions.map((position, index) => {
    const target = next.positions[index] ?? position;
    return { x: position.x + (target.x - position.x) * mix, y: position.y + (target.y - position.y) * mix, z: position.z + (target.z - position.z) * mix };
  });
}

function renderAnimationPose(positions?: Vec3[]): void {
  const pose = positions ?? (activeAnimation ? sampledAnimationPositions(activeAnimation, animationElapsed) : undefined);
  rebuildSkeleton(pose);
  applyVoxelAnimation(pose);
}

const shortcutActions: ShortcutAction[] = [
  'newModel', 'openModel', 'overwrite', 'saveAs', 'undo', 'redo', 'deleteSelection',
  'toolSelect', 'toolSculpt', 'toolPaint', 'toolPicker', 'toolMove',
  'cameraForward', 'cameraBack', 'cameraLeft', 'cameraRight',
];

function shortcutFromEvent(event: KeyboardEvent, ignoreShift = false): string | null {
  if (['Control', 'Shift', 'Alt', 'Meta'].includes(event.key)) return null;
  const parts: string[] = [];
  if (event.ctrlKey) parts.push('Ctrl');
  if (event.altKey) parts.push('Alt');
  if (event.shiftKey && !ignoreShift) parts.push('Shift');
  if (event.metaKey) parts.push('Meta');
  const named: Record<string, string> = { ' ': 'Space', Escape: 'Esc' };
  const key = named[event.key] ?? (event.key.length === 1 ? event.key.toUpperCase() : event.key);
  parts.push(key);
  return parts.join('+');
}

function shortcutActionForEvent(event: KeyboardEvent): ShortcutAction | null {
  const shortcut = shortcutFromEvent(event);
  return shortcutActions.find((action) => settings.shortcuts[action] === shortcut) ?? null;
}

function cameraShortcutActionForEvent(event: KeyboardEvent): ShortcutAction | null {
  const cameraActions: ShortcutAction[] = ['cameraForward', 'cameraBack', 'cameraLeft', 'cameraRight'];
  const shortcut = shortcutFromEvent(event, event.shiftKey);
  return cameraActions.find((action) => settings.shortcuts[action] === shortcut) ?? null;
}

function updateShortcutLabels(): void {
  document.querySelectorAll<HTMLElement>('[data-shortcut-label]').forEach((label) => {
    const action = label.dataset.shortcutLabel as ShortcutAction;
    label.textContent = settings.shortcuts[action].replaceAll('+', ' ');
  });
  undoBtn.title = `撤销 (${settings.shortcuts.undo})`;
  redoBtn.title = `重做 (${settings.shortcuts.redo})`;
}

function applySettings(): void {
  saveSettings(settings); applySettingsToDocument(settings);
  const lighting = lightingPresets[settings.lightingPreset];
  ambient.intensity = lighting.ambient;
  fillLight.intensity = lighting.fill;
  keyLight.intensity = lighting.key;
  rimLight.intensity = lighting.rim;
  renderer.toneMappingExposure = lighting.exposure;
  lightingQuickSelect.value = settings.lightingPreset;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, settings.pixelRatio));
  renderer.shadowMap.enabled = settings.shadows;
  keyLight.castShadow = settings.shadows;
  grid.visible = settings.showGrid;
  skeletonToggle.checked = settings.showSkeleton;
  controls.rotateSpeed = settings.cameraSpeed;
  controls.zoomSpeed = settings.cameraSpeed;
  controls.panSpeed = settings.cameraSpeed;
  controls.enableRotate = settings.rotationMode === 'scene';
  viewModeBadge.textContent = settings.rotationMode === 'view' ? '视角旋转 · 透视' : '场景旋转 · 透视';
  renderer.domElement.dataset.rotationMode = settings.rotationMode;
  updateShortcutLabels();
  updateBoneEditingState();
  rebuildVoxelMesh(); renderAnimationPose(); resizeRenderer();
}

function populateSettingsForm(): void {
  element<HTMLSelectElement>('#performancePreset').value = settings.performancePreset;
  element<HTMLSelectElement>('#lightingPreset').value = settings.lightingPreset;
  element<HTMLInputElement>('#antialiasSetting').checked = settings.antialias;
  element<HTMLInputElement>('#shadowsSetting').checked = settings.shadows;
  element<HTMLInputElement>('#pixelRatioSetting').value = String(settings.pixelRatio);
  element<HTMLElement>('#pixelRatioValue').textContent = `${settings.pixelRatio.toFixed(2).replace(/0$/, '')}×`;
  element<HTMLInputElement>('#gridSetting').checked = settings.showGrid;
  element<HTMLInputElement>('#cameraSpeedSetting').value = String(settings.cameraSpeed);
  element<HTMLElement>('#cameraSpeedValue').textContent = `${settings.cameraSpeed.toFixed(2).replace(/0$/, '')}×`;
  element<HTMLSelectElement>('#rotationModeSetting').value = settings.rotationMode;
  element<HTMLInputElement>('#autosaveSetting').checked = settings.autosave;
  element<HTMLInputElement>('#confirmDeleteSetting').checked = settings.confirmDelete;
  element<HTMLInputElement>('#confirmOverwriteSetting').checked = settings.confirmOverwrite;
  element<HTMLSelectElement>('#themeSetting').value = settings.theme;
  element<HTMLInputElement>('#accentSetting').value = settings.accent;
  element<HTMLInputElement>('#brightnessSetting').value = String(settings.brightness);
  element<HTMLElement>('#brightnessValue').textContent = `${settings.brightness}%`;
  element<HTMLInputElement>('#uiScaleSetting').value = String(settings.uiScale);
  element<HTMLElement>('#uiScaleValue').textContent = `${settings.uiScale}%`;
  element<HTMLSelectElement>('#fontSizeSetting').value = String(settings.fontSize);
  element<HTMLSelectElement>('#languageSetting').value = settings.language;
  document.querySelectorAll<HTMLInputElement>('[data-shortcut-input]').forEach((input) => {
    input.value = settings.shortcuts[input.dataset.shortcutInput as ShortcutAction];
  });
}

function bindSettings(): void {
  const close = () => settingsModal.classList.add('hidden');
  element('#settingsBtn').addEventListener('click', () => { populateSettingsForm(); settingsModal.classList.remove('hidden'); });
  element('#closeSettingsBtn').addEventListener('click', close);
  element('#doneSettingsBtn').addEventListener('click', close);
  settingsModal.addEventListener('pointerdown', (event) => { if (event.target === settingsModal) close(); });
  document.querySelectorAll<HTMLButtonElement>('[data-settings-page]').forEach((button) => button.addEventListener('click', () => {
    document.querySelectorAll('[data-settings-page]').forEach((item) => item.classList.toggle('active', item === button));
    document.querySelectorAll<HTMLElement>('[data-page]').forEach((page) => page.classList.toggle('active', page.dataset.page === button.dataset.settingsPage));
  }));
  element<HTMLSelectElement>('#performancePreset').addEventListener('change', (event) => {
    settings.performancePreset = (event.target as HTMLSelectElement).value as EditorSettings['performancePreset'];
    settings = applyPreset(settings); populateSettingsForm(); applySettings();
    toast('性能预设已应用；抗锯齿将在下次启动时完全生效。');
  });
  element<HTMLSelectElement>('#lightingPreset').addEventListener('change', (event) => {
    settings.lightingPreset = (event.target as HTMLSelectElement).value as EditorSettings['lightingPreset'];
    applySettings(); toast('场景光照已切换。', 'success');
  });
  element<HTMLInputElement>('#antialiasSetting').addEventListener('change', (event) => { settings.antialias = (event.target as HTMLInputElement).checked; applySettings(); });
  element<HTMLInputElement>('#shadowsSetting').addEventListener('change', (event) => { settings.shadows = (event.target as HTMLInputElement).checked; applySettings(); });
  element<HTMLInputElement>('#gridSetting').addEventListener('change', (event) => { settings.showGrid = (event.target as HTMLInputElement).checked; applySettings(); });
  element<HTMLInputElement>('#pixelRatioSetting').addEventListener('input', (event) => { settings.pixelRatio = Number((event.target as HTMLInputElement).value); populateSettingsForm(); applySettings(); });
  element<HTMLInputElement>('#cameraSpeedSetting').addEventListener('input', (event) => { settings.cameraSpeed = Number((event.target as HTMLInputElement).value); populateSettingsForm(); applySettings(); });
  element<HTMLSelectElement>('#rotationModeSetting').addEventListener('change', (event) => { settings.rotationMode = (event.target as HTMLSelectElement).value as EditorSettings['rotationMode']; applySettings(); toast(settings.rotationMode === 'view' ? '左键拖动将直接转动视角。' : '左键拖动将围绕场景旋转。', 'success'); });
  element<HTMLInputElement>('#autosaveSetting').addEventListener('change', (event) => { settings.autosave = (event.target as HTMLInputElement).checked; applySettings(); });
  element<HTMLInputElement>('#confirmDeleteSetting').addEventListener('change', (event) => { settings.confirmDelete = (event.target as HTMLInputElement).checked; applySettings(); });
  element<HTMLInputElement>('#confirmOverwriteSetting').addEventListener('change', (event) => { settings.confirmOverwrite = (event.target as HTMLInputElement).checked; applySettings(); });
  element<HTMLSelectElement>('#themeSetting').addEventListener('change', (event) => { settings.theme = (event.target as HTMLSelectElement).value as EditorSettings['theme']; applySettings(); });
  element<HTMLInputElement>('#accentSetting').addEventListener('input', (event) => { settings.accent = (event.target as HTMLInputElement).value; applySettings(); });
  element<HTMLInputElement>('#brightnessSetting').addEventListener('input', (event) => { settings.brightness = Number((event.target as HTMLInputElement).value); populateSettingsForm(); applySettings(); });
  element<HTMLInputElement>('#uiScaleSetting').addEventListener('input', (event) => { settings.uiScale = Number((event.target as HTMLInputElement).value); populateSettingsForm(); applySettings(); });
  element<HTMLSelectElement>('#fontSizeSetting').addEventListener('change', (event) => { settings.fontSize = Number((event.target as HTMLSelectElement).value) as EditorSettings['fontSize']; applySettings(); });
  document.querySelectorAll<HTMLInputElement>('[data-shortcut-input]').forEach((input) => input.addEventListener('keydown', (event) => {
    event.preventDefault(); event.stopPropagation();
    if (event.key === 'Escape') { input.blur(); return; }
    const shortcut = shortcutFromEvent(event);
    if (!shortcut) return;
    const action = input.dataset.shortcutInput as ShortcutAction;
    const duplicate = shortcutActions.find((candidate) => candidate !== action && settings.shortcuts[candidate] === shortcut);
    if (duplicate) { toast(`快捷键 ${shortcut} 已被占用。`, 'warning'); return; }
    settings.shortcuts[action] = shortcut;
    populateSettingsForm(); applySettings(); input.blur();
  }));
  element('#resetSettingsBtn').addEventListener('click', () => { settings = { ...defaultSettings, shortcuts: { ...defaultSettings.shortcuts } }; populateSettingsForm(); applySettings(); toast('设置已恢复默认值', 'success'); });
}

function bindInputStyleOnboarding(): void {
  document.querySelectorAll<HTMLButtonElement>('[data-input-style]').forEach((button) => button.addEventListener('click', () => {
    settings.rotationMode = button.dataset.inputStyle === 'scene' ? 'scene' : 'view';
    completeInputStyleOnboarding();
    inputStyleModal.classList.add('hidden');
    populateSettingsForm(); applySettings();
    toast(settings.rotationMode === 'view' ? '已采用键盘移动视角 + 鼠标操作。' : '已采用纯鼠标操作。', 'success');
  }));
  if (shouldShowInputStyleOnboarding()) {
    inputStyleModal.classList.remove('hidden');
    element<HTMLButtonElement>('[data-input-style="view"]').focus();
  }
}

document.querySelectorAll<HTMLButtonElement>('[data-tool]').forEach((button) => button.addEventListener('click', () => setTool(button.dataset.tool as ToolId)));
colorSwatch.addEventListener('click', (event) => { event.stopPropagation(); toggleColorPicker(); });
bindColorPickerSurface(hueRing, (event) => {
  const rect = hueRing.getBoundingClientRect();
  colorPickerHsv.h = hueFromPoint(event.clientX, event.clientY, rect.left + rect.width / 2, rect.top + rect.height / 2);
  setCurrentColorFromHsv();
});
bindColorPickerSurface(colorSquare, (event) => {
  const rect = colorSquare.getBoundingClientRect();
  const sv = saturationValueFromPoint(event.clientX - rect.left, event.clientY - rect.top, rect.width, rect.height);
  colorPickerHsv = { ...colorPickerHsv, ...sv };
  setCurrentColorFromHsv();
});
[[redSlider, 'r'], [greenSlider, 'g'], [blueSlider, 'b']].forEach(([slider, channel]) => {
  (slider as HTMLInputElement).addEventListener('input', () => {
    const color = currentColor();
    color[channel as 'r' | 'g' | 'b'] = Number((slider as HTMLInputElement).value) / 255;
    setCurrentColor(color.r, color.g, color.b);
  });
});
document.addEventListener('pointerdown', (event) => {
  const target = event.target as Element;
  if (!target.closest('#colorPickerPopover,#colorSwatch')) closeColorPicker();
});
function closeFileMenu(): void {
  fileMenu.classList.add('hidden'); fileMenuBtn.setAttribute('aria-expanded', 'false');
}
function requestNewModel(): void {
  closeFileMenu();
  if (model?.dirty) unsavedModelModal.classList.remove('hidden');
  else createNewModel(1);
}
async function saveBeforeNew(forceSaveAs: boolean): Promise<void> {
  const saved = forceSaveAs || !currentFilePath ? await saveModelAs() : await overwriteModel();
  if (saved) createNewModel(1);
}
fileMenuBtn.addEventListener('click', (event) => {
  event.stopPropagation();
  const willOpen = fileMenu.classList.contains('hidden');
  fileMenu.classList.toggle('hidden', !willOpen); fileMenuBtn.setAttribute('aria-expanded', String(willOpen));
});
document.addEventListener('pointerdown', (event) => { if (!(event.target as Element).closest('.file-menu-wrap')) closeFileMenu(); });
element('#newModelBtn').addEventListener('click', requestNewModel);
element('#emptyNewBtn').addEventListener('click', requestNewModel);
element('#saveBeforeNewBtn').addEventListener('click', () => void saveBeforeNew(false));
element('#saveAsBeforeNewBtn').addEventListener('click', () => void saveBeforeNew(true));
element('#discardBeforeNewBtn').addEventListener('click', () => createNewModel(1));
element('#cancelBeforeNewBtn').addEventListener('click', () => unsavedModelModal.classList.add('hidden'));
unsavedModelModal.addEventListener('pointerdown', (event) => { if (event.target === unsavedModelModal) unsavedModelModal.classList.add('hidden'); });
overwriteConfirmCheck.addEventListener('change', () => { confirmOverwriteBtn.disabled = !overwriteConfirmCheck.checked; });
confirmOverwriteBtn.addEventListener('click', () => closeOverwriteModal(true));
element('#cancelOverwriteBtn').addEventListener('click', () => closeOverwriteModal(false));
overwriteModal.addEventListener('pointerdown', (event) => { if (event.target === overwriteModal) closeOverwriteModal(false); });
element('#openModelBtn').addEventListener('click', () => { closeFileMenu(); void openFile('model'); });
element('#emptyOpenBtn').addEventListener('click', () => void openFile('model'));
element('#openAnimationBtn').addEventListener('click', () => void openFile('animation'));
saveAsBtn.addEventListener('click', () => { closeFileMenu(); void saveModelAs(); });
overwriteBtn.addEventListener('click', () => { closeFileMenu(); void overwriteModel(); });
lightingQuickSelect.addEventListener('change', () => {
  settings.lightingPreset = lightingQuickSelect.value as EditorSettings['lightingPreset'];
  populateSettingsForm(); applySettings(); toast('场景光照已切换。', 'success');
});
undoBtn.addEventListener('click', undo);
redoBtn.addEventListener('click', redo);
modelFileInput.addEventListener('change', () => void readInputFile(modelFileInput, 'model'));
animationFileInput.addEventListener('change', () => void readInputFile(animationFileInput, 'animation'));
element('#clearSelectionBtn').addEventListener('click', () => { selectedIds.clear(); rebuildVoxelMesh(); updateStats(); });
document.querySelectorAll<HTMLButtonElement>('[data-move]').forEach((button) => button.addEventListener('click', () => {
  const [x = 0, y = 0, z = 0] = (button.dataset.move ?? '').split(',').map(Number);
  moveSelection({ x, y, z });
}));
deleteSelectionBtn.addEventListener('click', () => {
  if (!model || !selectedIds.size) return;
  if (settings.confirmDelete && !window.confirm(`确定删除所选的 ${selectedIds.size} 个体素吗？`)) return;
  const ids = new Set(selectedIds);
  commit(`已删除 ${ids.size} 个体素`, () => { model!.remove(ids); selectedIds.clear(); });
});
rebindBtn.addEventListener('click', () => {
  if (!model) return;
  commit('骨骼绑定已重新计算', () => { const count = model!.rebindSkeleton(); toast(`已为 ${count} 个体素重新绑定骨骼`, 'success'); });
});
skeletonToggle.addEventListener('change', () => { settings.showSkeleton = skeletonToggle.checked; applySettings(); });

animationSelect.addEventListener('change', () => {
  activeAnimation = animations[Number(animationSelect.value)] ?? null;
  selectedFrameIndex = 0;
  animationElapsed = activeAnimation?.frames[0]?.time ?? 0; animationPlaying = false; animationPlayBtn.textContent = '▶';
  updateAnimationUi(); updateAnimationEditor(); renderAnimationPose(activeAnimation?.frames[0]?.positions);
});
animationPlayBtn.addEventListener('click', () => {
  if (!activeAnimation) return;
  animationPlaying = !animationPlaying; animationPlayBtn.textContent = animationPlaying ? 'Ⅱ' : '▶';
});
animationTime.addEventListener('input', () => {
  if (!activeAnimation) return;
  animationPlaying = false; animationPlayBtn.textContent = '▶';
  animationElapsed = (Number(animationTime.value) / 1000) * activeAnimation.end;
  renderAnimationPose(sampledAnimationPositions(activeAnimation, animationElapsed)); updateAnimationUi();
});
animationVoxelToggle.addEventListener('change', () => {
  renderAnimationPose();
  toast(animationVoxelToggle.checked ? '体素将跟随骨骼动画。' : '体素已恢复模型初始姿势。', 'success');
});
document.querySelectorAll<HTMLButtonElement>('[data-animation-page]').forEach((button) => button.addEventListener('click', () => switchAnimationPage(button.dataset.animationPage === 'edit' ? 'edit' : 'preview')));
newAnimationBtn.addEventListener('click', createAnimation);
duplicateAnimationBtn.addEventListener('click', duplicateAnimation);
deleteAnimationBtn.addEventListener('click', deleteAnimation);
animationNameInput.addEventListener('input', () => {
  if (!activeAnimation) return;
  activeAnimation.name = animationNameInput.value;
  markAnimationDirty(); updateAnimationSelect();
});
animationNameInput.addEventListener('change', () => {
  if (!activeAnimation) return;
  if (!activeAnimation.name.trim()) activeAnimation.name = uniqueAnimationName('未命名动画');
  animationNameInput.value = activeAnimation.name; updateAnimationSelect();
});
animationEndInput.addEventListener('change', () => {
  if (!activeAnimation) return;
  const lastTime = activeAnimation.frames.at(-1)?.time ?? 0;
  activeAnimation.end = Math.max(lastTime, Number(animationEndInput.value) || 0);
  animationEndInput.value = String(activeAnimation.end); markAnimationDirty(); updateAnimationUi();
});
animationSpeedInput.addEventListener('change', () => {
  if (!activeAnimation) return;
  activeAnimation.speed = Math.max(0.01, Number(animationSpeedInput.value) || 1);
  animationSpeedInput.value = String(activeAnimation.speed); markAnimationDirty();
});
animationSpreadInput.addEventListener('change', () => {
  if (!activeAnimation) return;
  activeAnimation.speedSpread = Math.max(0, Number(animationSpreadInput.value) || 0);
  animationSpreadInput.value = String(activeAnimation.speedSpread); markAnimationDirty();
});
animationLoopInput.addEventListener('change', () => {
  if (!activeAnimation) return;
  activeAnimation.loop = animationLoopInput.checked; markAnimationDirty();
});
keyframeSelect.addEventListener('change', () => selectKeyframe(Number(keyframeSelect.value)));
addKeyframeBtn.addEventListener('click', () => addKeyframe(false));
duplicateKeyframeBtn.addEventListener('click', () => addKeyframe(true));
deleteKeyframeBtn.addEventListener('click', deleteKeyframe);
keyframeTimeInput.addEventListener('change', () => {
  if (!activeAnimation) return;
  const frame = currentKeyframe(); if (!frame) return;
  let frameTime = Math.max(0, Number(keyframeTimeInput.value) || 0);
  while (activeAnimation.frames.some((candidate) => candidate !== frame && Math.abs(candidate.time - frameTime) < 0.000001)) frameTime += 0.001;
  frame.time = frameTime;
  activeAnimation.frames.sort((a, b) => a.time - b.time);
  selectedFrameIndex = activeAnimation.frames.indexOf(frame);
  activeAnimation.end = Math.max(activeAnimation.end, frame.time);
  animationElapsed = frame.time; markAnimationDirty(); updateAnimationSelect(); selectKeyframe(selectedFrameIndex);
});
particleSelect.addEventListener('change', () => {
  selectedParticleIndex = Number(particleSelect.value) || 0;
  updateParticleFields(); renderAnimationPose(currentKeyframe()?.positions);
});
[particleXInput, particleYInput, particleZInput].forEach((input) => input.addEventListener('input', updateParticlePosition));
resetParticleBtn.addEventListener('click', () => {
  const frame = currentKeyframe(); const particle = model?.skeleton[selectedParticleIndex];
  if (!frame || !particle) return;
  ensureFramePositions(frame); frame.positions[selectedParticleIndex] = { x: particle.x, y: particle.y, z: particle.z };
  updateParticleFields(); markAnimationDirty(); renderAnimationPose(frame.positions);
});
saveAnimationsBtn.addEventListener('click', () => void saveAnimationFile());

renderer.domElement.addEventListener('contextmenu', (event) => event.preventDefault());
function rotateCameraView(deltaX: number, deltaY: number): void {
  const distance = Math.max(0.1, camera.position.distanceTo(controls.target));
  camera.getWorldDirection(cameraLookDirection);
  let yaw = Math.atan2(cameraLookDirection.x, -cameraLookDirection.z);
  let pitch = Math.asin(THREE.MathUtils.clamp(cameraLookDirection.y, -1, 1));
  const sensitivity = 0.004 * settings.cameraSpeed;
  yaw += deltaX * sensitivity;
  pitch = THREE.MathUtils.clamp(pitch - deltaY * sensitivity, -Math.PI * 0.49, Math.PI * 0.49);
  cameraLookDirection.set(
    Math.sin(yaw) * Math.cos(pitch),
    Math.sin(pitch),
    -Math.cos(yaw) * Math.cos(pitch),
  );
  controls.target.copy(camera.position).addScaledVector(cameraLookDirection, distance);
  camera.lookAt(controls.target);
}
renderer.domElement.addEventListener('pointerdown', (event) => {
  if (event.button !== 0 && event.button !== 2) return;
  pointerDown = { x: event.clientX, y: event.clientY }; pointerDragged = false;
  if (beginBoneDrag(event)) return;
  if (event.button === 0 && settings.rotationMode === 'view') {
    cameraLookActive = true;
    cameraLookLast = { x: event.clientX, y: event.clientY };
    renderer.domElement.setPointerCapture(event.pointerId);
  }
}, { capture: true });
renderer.domElement.addEventListener('pointermove', (event) => {
  if (updateBoneDrag(event)) return;
  if (Math.hypot(event.clientX - pointerDown.x, event.clientY - pointerDown.y) > 5) pointerDragged = true;
  if (cameraLookActive && (event.buttons & 1)) {
    rotateCameraView(event.clientX - cameraLookLast.x, event.clientY - cameraLookLast.y);
    cameraLookLast = { x: event.clientX, y: event.clientY };
  }
}, { capture: true });
renderer.domElement.addEventListener('pointerup', (event) => {
  if (endBoneDrag(event.pointerId)) { event.preventDefault(); event.stopImmediatePropagation(); return; }
  if (event.button === 0 && cameraLookActive) {
    cameraLookActive = false;
    if (renderer.domElement.hasPointerCapture(event.pointerId)) renderer.domElement.releasePointerCapture(event.pointerId);
  }
  if ((event.button === 0 || event.button === 2) && !pointerDragged) handleVoxelAction(event);
}, { capture: true });
renderer.domElement.addEventListener('pointercancel', (event) => { endBoneDrag(event.pointerId); cameraLookActive = false; }, { capture: true });

viewport.addEventListener('dragover', (event) => { event.preventDefault(); viewport.classList.add('dragging'); });
viewport.addEventListener('dragleave', () => viewport.classList.remove('dragging'));
viewport.addEventListener('drop', (event) => {
  event.preventDefault(); viewport.classList.remove('dragging');
  const file = event.dataTransfer?.files[0];
  if (!file || !file.name.toLowerCase().endsWith('.xml')) return;
  void file.text().then((text) => loadModelText(text, file.name));
});

function runShortcutAction(action: ShortcutAction): void {
  const tools: Partial<Record<ShortcutAction, ToolId>> = {
    toolSelect: 'select', toolSculpt: 'sculpt', toolPaint: 'paint', toolPicker: 'picker', toolMove: 'move',
  };
  if (tools[action]) { setTool(tools[action]!); return; }
  if (action === 'newModel') requestNewModel();
  else if (action === 'openModel') void openFile('model');
  else if (action === 'overwrite') void overwriteModel();
  else if (action === 'saveAs') void saveModelAs();
  else if (action === 'undo') undo();
  else if (action === 'redo') redo();
  else if (action === 'deleteSelection') deleteSelectionBtn.click();
}

function isTextEntryTarget(target: HTMLElement): boolean {
  if (target.closest('textarea,[contenteditable="true"]')) return true;
  const input = target.closest<HTMLInputElement>('input');
  return Boolean(input && ['text', 'number', 'search', 'email', 'url', 'password'].includes(input.type));
}

window.addEventListener('keydown', (event) => {
  if (event.key === 'Shift') shiftHeld = true;
  const target = event.target as HTMLElement;
  if (event.key === 'Escape') {
    closeColorPicker();
    closeFileMenu();
    if (!overwriteModal.classList.contains('hidden')) closeOverwriteModal(false);
    else unsavedModelModal.classList.add('hidden');
  }
  if (!inputStyleModal.classList.contains('hidden') || !settingsModal.classList.contains('hidden') || !overwriteModal.classList.contains('hidden') || !unsavedModelModal.classList.contains('hidden')) return;
  const cameraAction = cameraShortcutActionForEvent(event);
  if (cameraAction && !isTextEntryTarget(target) && !target.closest('[data-shortcut-input]')) {
    event.preventDefault();
    pressedCameraActions.add(cameraAction);
    return;
  }
  if (target.closest('input, select, textarea')) return;
  const action = shortcutActionForEvent(event);
  if (!action) return;
  event.preventDefault();
  if (!event.repeat) runShortcutAction(action);
}, { capture: true });
window.addEventListener('keyup', (event) => {
  if (event.key === 'Shift') shiftHeld = false;
  const action = cameraShortcutActionForEvent(event);
  if (action) pressedCameraActions.delete(action);
}, { capture: true });
window.addEventListener('blur', () => { pressedCameraActions.clear(); shiftHeld = false; cameraLookActive = false; });

bindSettings();
bindInputStyleOnboarding();
setCurrentColor(pickedColor.r, pickedColor.g, pickedColor.b);
applySettings();
updateStats();
updateAnimationEditor();
setTool('select');

let previousFrame = performance.now();
let fpsFrameCount = 0;
let fpsStarted = previousFrame;
const cameraMotion = new THREE.Vector3();
function moveCameraWithKeyboard(delta: number): void {
  const forwardAmount = Number(pressedCameraActions.has('cameraForward')) - Number(pressedCameraActions.has('cameraBack'));
  const rightAmount = Number(pressedCameraActions.has('cameraRight')) - Number(pressedCameraActions.has('cameraLeft'));
  if (!forwardAmount && !rightAmount) return;
  cameraRelativeMotion(cameraMotion, camera.quaternion, forwardAmount, rightAmount);
  const boost = shiftHeld ? 2 : 1;
  const distance = Math.max(8, camera.position.distanceTo(controls.target) * 0.45) * settings.cameraSpeed * boost * delta;
  cameraMotion.multiplyScalar(distance);
  camera.position.add(cameraMotion); controls.target.add(cameraMotion);
}
function animate(now: number): void {
  requestAnimationFrame(animate);
  const delta = Math.min(0.1, (now - previousFrame) / 1000); previousFrame = now;
  moveCameraWithKeyboard(delta);
  controls.update();
  if (animationPlaying && activeAnimation) {
    animationElapsed += delta * activeAnimation.speed;
    if (animationElapsed > activeAnimation.end) {
      if (activeAnimation.loop) animationElapsed %= Math.max(activeAnimation.end, 0.001);
      else { animationElapsed = activeAnimation.end; animationPlaying = false; animationPlayBtn.textContent = '▶'; }
    }
    renderAnimationPose(sampledAnimationPositions(activeAnimation, animationElapsed)); updateAnimationUi();
  }
  renderer.render(scene, camera);
  fpsFrameCount += 1;
  if (now - fpsStarted >= 750) {
    const fps = Math.round((fpsFrameCount * 1000) / (now - fpsStarted));
    fpsBadge.textContent = `${fps} FPS`; fpsFrameCount = 0; fpsStarted = now;
  }
}
requestAnimationFrame(animate);
