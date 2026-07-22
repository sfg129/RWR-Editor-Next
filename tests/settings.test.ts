import { beforeEach, describe, expect, it } from 'bun:test';
import {
  applySettingsToDocument,
  completeInputStyleOnboarding,
  defaultSettings,
  loadSettings,
  shouldShowInputStyleOnboarding,
} from '../src/config/settings';

describe('editor settings', () => {
  beforeEach(() => localStorage.clear());

  it('uses readable text and view rotation by default', () => {
    const settings = loadSettings();
    expect(settings.fontSize).toBe(16);
    expect(settings.language).toBe('zh-CN');
    expect(settings.rotationMode).toBe('view');
    expect(settings.voxelDisplayMode).toBe('floating');
    expect(settings.marqueeCompletionAction).toBe('select');
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
      rotationMode: 'view',
      voxelDisplayMode: 'floating',
      marqueeCompletionAction: 'select',
    });
  });

  it('applies the selected font size to the document', () => {
    applySettingsToDocument({ ...defaultSettings, fontSize: 20 });
    expect(document.documentElement.style.getPropertyValue('--font-size')).toBe('20px');
  });

  it('shows the input-style choice once, including for existing installations', () => {
    localStorage.setItem('rwr-editor-settings-v1', JSON.stringify({ theme: 'dark' }));
    localStorage.setItem('rwr-editor-input-style-onboarding-v2', 'complete');
    expect(shouldShowInputStyleOnboarding()).toBe(true);
    completeInputStyleOnboarding();
    expect(shouldShowInputStyleOnboarding()).toBe(false);
  });
});
