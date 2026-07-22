export type ToolId = 'select' | 'sculpt' | 'paint' | 'picker' | 'move' | 'marquee';

export type ShortcutAction =
  | 'newModel'
  | 'openModel'
  | 'overwrite'
  | 'saveAs'
  | 'undo'
  | 'redo'
  | 'deleteSelection'
  | 'toolSelect'
  | 'toolSculpt'
  | 'toolPaint'
  | 'toolPicker'
  | 'toolMove'
  | 'marqueeThrough'
  | 'marqueeVisible'
  | 'cameraForward'
  | 'cameraBack'
  | 'cameraLeft'
  | 'cameraRight';

export type ShortcutMap = Record<ShortcutAction, string>;

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface Voxel extends Vec3 {
  id: string;
  r: number;
  g: number;
  b: number;
  a: number;
  sourceIndex: number | null;
}

export interface SkeletonParticle extends Vec3 {
  id: string;
  name: string;
  invMass: number;
  bodyAreaHint: number;
}

export interface SkeletonStick {
  a: string;
  b: string;
}

export interface BindingGroup {
  constraintIndex: number;
  voxelIds: Set<string>;
}

export interface EditorSnapshot {
  voxels: Voxel[];
  bindings: Array<{ constraintIndex: number; voxelIds: string[] }>;
}

export interface AnimationFrame {
  time: number;
  positions: Vec3[];
}

export interface RwrAnimation {
  name: string;
  loop: boolean;
  end: number;
  speed: number;
  speedSpread: number;
  frames: AnimationFrame[];
}

export interface EditorSettings {
  language: 'zh-CN' | 'en';
  theme: 'dark' | 'light';
  performancePreset: 'quality' | 'balanced' | 'performance';
  antialias: boolean;
  shadows: boolean;
  pixelRatio: number;
  showGrid: boolean;
  showSkeleton: boolean;
  lightingPreset: 'soft' | 'standard' | 'bright' | 'color';
  cameraSpeed: number;
  rotationMode: 'view' | 'scene';
  voxelDisplayMode: 'floating' | 'grid';
  marqueeCompletionAction: 'stay' | 'select' | 'previous';
  autosave: boolean;
  confirmDelete: boolean;
  confirmOverwrite: boolean;
  accent: string;
  brightness: number;
  uiScale: number;
  fontSize: 16 | 18 | 20;
  shortcuts: ShortcutMap;
}

declare global {
  interface Window {
    __TAURI_INTERNALS__?: unknown;
  }
}
