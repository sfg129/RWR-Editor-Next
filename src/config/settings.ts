import type { EditorSettings } from '../core/types';
import { isAppLanguage } from '../i18n/languages';
import { loadBindings } from '../core/editor/shortcut-bindings';
import type { ShortcutMap } from '../core/types';

const STORAGE_KEY = 'rwr-editor-settings-v1';

// These rendering/behavior settings are no longer user-configurable.
const fixedSettings = {
  performancePreset: 'balanced',
  antialias: true,
  shadows: true,
  pixelRatio: 1,
  showGrid: true,
  cameraSpeed: 1,
  voxelDisplayMode: 'grid',
  autosave: true,
  confirmDelete: false,
  confirmOverwrite: false,
  brightness: 100,
} as const;

export const defaultSettings: EditorSettings = {
  language: 'zh-CN',
  theme: 'dark',
  performancePreset: 'balanced',
  antialias: true,
  shadows: true,
  pixelRatio: 1,
  showGrid: true,
  showSkeleton: true,
  lightingPreset: 'standard',
  cameraSpeed: 1,
  voxelDisplayMode: 'grid',
  autosave: true,
  confirmDelete: false,
  confirmOverwrite: false,
  accent: '#f0b84b',
  brightness: 100,
  uiScale: 100,
  fontSize: 16,
  shortcuts: {
    newModel: 'Ctrl+N',
    openModel: 'Ctrl+O',
    overwrite: 'Ctrl+S',
    saveAs: 'Ctrl+Alt+S',
    undo: 'Ctrl+Z',
    redo: 'Ctrl+Y',
    deleteSelection: 'Delete',
    toolSelect: '1',
    toolSculpt: '2',
    toolPaint: '3',
    marqueeThrough: 'Ctrl+1',
    cameraForward: 'W',
    cameraBack: 'S',
    cameraLeft: 'A',
    cameraRight: 'D',
    closeTab: 'Ctrl+F4', nextTab: 'Ctrl+Tab', previousTab: 'Ctrl+Shift+Tab',
    keepOpen: 'Ctrl+K Enter', pinTab: 'Ctrl+K Shift+Enter', closeSaved: 'Ctrl+K U', closeAll: 'Ctrl+K W',
  },
  secondaryShortcuts: {} as ShortcutMap,
};
defaultSettings.secondaryShortcuts = Object.fromEntries(Object.keys(defaultSettings.shortcuts).map(key => [key, ''])) as ShortcutMap;

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
    const shortcuts = loadBindings(stored.shortcuts, defaultSettings.shortcuts);
    if (!stored.secondaryShortcuts && shortcuts.overwrite === 'Ctrl+Alt+S' && shortcuts.saveAs === 'Ctrl+S') {
      shortcuts.overwrite = defaultSettings.shortcuts.overwrite; shortcuts.saveAs = defaultSettings.shortcuts.saveAs;
    }
    return {
      ...defaultSettings,
      ...compatibleStored,
      ...fixedSettings,
      language: isAppLanguage(stored.language) ? stored.language : 'zh-CN',
      theme: stored.theme === 'light' ? 'light' : 'dark',
      lightingPreset: stored.lightingPreset === 'color' ? 'color' : 'standard',
      fontSize:
        typeof stored.fontSize === 'number' && Number.isFinite(stored.fontSize)
          ? Math.max(12, Math.min(20, Math.round(stored.fontSize)))
          : 16,
      shortcuts,
      secondaryShortcuts: loadBindings(stored.secondaryShortcuts, defaultSettings.secondaryShortcuts),
    };
  } catch {
    return { ...defaultSettings, shortcuts: { ...defaultSettings.shortcuts }, secondaryShortcuts: { ...defaultSettings.secondaryShortcuts } };
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
