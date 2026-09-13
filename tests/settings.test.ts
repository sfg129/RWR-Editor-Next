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
    expect(settings.voxelDisplayMode).toBe('floating');
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
      voxelDisplayMode: 'floating',
    });
  });

  it('applies the selected font size to the document', () => {
    applySettingsToDocument({ ...defaultSettings, fontSize: 20 });
    expect(document.documentElement.style.getPropertyValue('--font-size')).toBe('20px');
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
});
