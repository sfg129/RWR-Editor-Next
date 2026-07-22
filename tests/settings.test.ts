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
    expect(settings.rotationMode).toBe('view');
  });

  it('adds new defaults when loading settings saved by an older version', () => {
    localStorage.setItem('rwr-editor-settings-v1', JSON.stringify({ theme: 'light', uiScale: 110 }));
    const settings = loadSettings();
    expect(settings).toMatchObject({ theme: 'light', uiScale: 110, fontSize: 16, rotationMode: 'view' });
  });

  it('applies the selected font size to the document', () => {
    applySettingsToDocument({ ...defaultSettings, fontSize: 20 });
    expect(document.documentElement.style.getPropertyValue('--font-size')).toBe('20px');
  });

  it('shows the input-style choice once, including for existing installations', () => {
    localStorage.setItem('rwr-editor-settings-v1', JSON.stringify({ theme: 'dark' }));
    expect(shouldShowInputStyleOnboarding()).toBe(true);
    completeInputStyleOnboarding();
    expect(shouldShowInputStyleOnboarding()).toBe(false);
  });
});
