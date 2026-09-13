import type { EditorSettings } from '../core/types';

const STORAGE_KEY = 'rwr-editor-settings-v1';

export const defaultSettings: EditorSettings = {
  language: 'zh-CN',
  theme: 'dark',
  performancePreset: 'balanced',
  antialias: true,
  shadows: true,
  pixelRatio: 1.5,
  showGrid: true,
  showSkeleton: true,
  lightingPreset: 'bright',
  cameraSpeed: 1,
  voxelDisplayMode: 'floating',
  autosave: true,
  confirmDelete: true,
  confirmOverwrite: true,
  accent: '#f0b84b',
  brightness: 100,
  uiScale: 100,
  fontSize: 16,
  shortcuts: {
    newModel: 'Ctrl+N',
    openModel: 'Ctrl+O',
    overwrite: 'Ctrl+Alt+S',
    saveAs: 'Ctrl+S',
    undo: 'Ctrl+Z',
    redo: 'Ctrl+Y',
    deleteSelection: 'Delete',
    toolSelect: '1',
    toolSculpt: '2',
    toolPaint: '3',
    toolPicker: '4',
    toolMove: '5',
    marqueeThrough: 'Ctrl+1',
    marqueeVisible: 'Ctrl+2',
    cameraForward: 'W',
    cameraBack: 'S',
    cameraLeft: 'A',
    cameraRight: 'D',
  },
};

export function loadSettings(): EditorSettings {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as Partial<EditorSettings> & {
      rotationMode?: unknown;
      marqueeCompletionAction?: unknown;
    };
    const {
      rotationMode: _obsoleteRotationMode,
      marqueeCompletionAction: _obsoleteMarqueeCompletionAction,
      ...compatibleStored
    } = stored;
    return {
      ...defaultSettings,
      ...compatibleStored,
      language: stored.language === 'en' ? 'en' : 'zh-CN',
      theme: stored.theme === 'light' ? 'light' : 'dark',
      voxelDisplayMode: stored.voxelDisplayMode === 'grid' ? 'grid' : 'floating',
      fontSize: stored.fontSize === 18 || stored.fontSize === 20 ? stored.fontSize : 16,
      shortcuts: { ...defaultSettings.shortcuts, ...stored.shortcuts },
    };
  } catch {
    return { ...defaultSettings, shortcuts: { ...defaultSettings.shortcuts } };
  }
}

export function saveSettings(settings: EditorSettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function applySettingsToDocument(settings: EditorSettings): void {
  const root = document.documentElement;
  root.dataset.theme = settings.theme;
  root.style.setProperty('--accent', settings.accent);
  root.style.setProperty('--app-brightness', `${settings.brightness}%`);
  root.style.setProperty('--ui-scale', String(settings.uiScale / 100));
  root.style.setProperty('--font-size', `${settings.fontSize}px`);
}

export function applyPreset(settings: EditorSettings): EditorSettings {
  if (settings.performancePreset === 'quality') {
    return { ...settings, antialias: true, shadows: true, pixelRatio: 2 };
  }
  if (settings.performancePreset === 'performance') {
    return { ...settings, antialias: false, shadows: false, pixelRatio: 1 };
  }
  return { ...settings, antialias: true, shadows: true, pixelRatio: 1.5 };
}
