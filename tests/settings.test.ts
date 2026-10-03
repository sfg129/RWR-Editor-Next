import { beforeEach, describe, expect, it } from 'bun:test';
import { applySettingsToDocument, defaultSettings, loadSettings } from '../src/config/settings';

describe('editor settings', () => {
  beforeEach(() => localStorage.clear());

  it('uses readable text and editor defaults', () => {
    const settings = loadSettings();
    expect(settings.fontSize).toBe(16);
    expect(settings.language).toBe('zh-CN');
    expect('rotationMode' in settings).toBe(false);
    expect('marqueeCompletionAction' in settings).toBe(false);
    expect(settings.voxelDisplayMode).toBe('grid');
    expect(settings.shortcuts.marqueeThrough).toBe('Ctrl+1');
    expect(settings.shortcuts.marqueeVisible).toBe('Ctrl+2');
  });

  it('adds new defaults when loading settings saved by an older version', () => {
    localStorage.setItem('rwr-editor-settings-v1', JSON.stringify({ theme: 'light', uiScale: 110 }));
    const settings = loadSettings();
    expect(settings).toMatchObject({
      theme: 'light',
      uiScale: 110,
      fontSize: 16,
      voxelDisplayMode: 'grid',
    });
  });

  it('applies the selected font size to the document', () => {
    applySettingsToDocument({ ...defaultSettings, fontSize: 20 });
    expect(document.documentElement.style.getPropertyValue('--font-size')).toBe('20px');
  });

  it('forces removed settings to their fixed defaults without losing supported preferences', () => {
    localStorage.setItem(
      'rwr-editor-settings-v1',
      JSON.stringify({
        performancePreset: 'quality',
        antialias: true,
        shadows: false,
        pixelRatio: 2,
        showGrid: false,
        lightingPreset: 'bright',
        cameraSpeed: 2,
        voxelDisplayMode: 'floating',
        autosave: false,
        confirmDelete: true,
        confirmOverwrite: true,
        brightness: 80,
        theme: 'light',
        fontSize: 17,
        showSkeleton: false,
        shortcuts: { toolSelect: '9' },
      }),
    );
    expect(loadSettings()).toMatchObject({
      performancePreset: 'balanced',
      antialias: false,
      shadows: true,
      pixelRatio: 1,
      showGrid: true,
      lightingPreset: 'standard',
      cameraSpeed: 1,
      voxelDisplayMode: 'grid',
      autosave: true,
      confirmDelete: false,
      confirmOverwrite: false,
      brightness: 100,
      theme: 'light',
      fontSize: 17,
      showSkeleton: false,
      shortcuts: { toolSelect: '9' },
    });
  });

  it('clamps font size to the slider range and preserves color proofing', () => {
    for (const [stored, expected] of [
      [8, 12],
      [24, 20],
      [17.7, 18],
    ]) {
      localStorage.setItem(
        'rwr-editor-settings-v1',
        JSON.stringify({ fontSize: stored, lightingPreset: 'color' }),
      );
      expect(loadSettings()).toMatchObject({ fontSize: expected, lightingPreset: 'color' });
    }
  });

  it('drops the obsolete rotation choice from older saved settings', () => {
    localStorage.setItem(
      'rwr-editor-settings-v1',
      JSON.stringify({ theme: 'dark', rotationMode: 'scene', marqueeCompletionAction: 'select' }),
    );
    const settings = loadSettings();
    expect('rotationMode' in settings).toBe(false);
    expect('marqueeCompletionAction' in settings).toBe(false);
  });
  it('removes shortcuts for the retired picker and move tools', () => {
    localStorage.setItem(
      'rwr-editor-settings-v1',
      JSON.stringify({ shortcuts: { toolPicker: '4', toolMove: '5', toolPaint: '7' } }),
    );
    const settings = loadSettings();
    expect('toolPicker' in settings.shortcuts).toBe(false);
    expect('toolMove' in settings.shortcuts).toBe(false);
    expect(settings.shortcuts.toolPaint).toBe('7');
  });
});
