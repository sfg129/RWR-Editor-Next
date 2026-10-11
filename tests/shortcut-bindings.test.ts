import { describe, it, expect } from 'bun:test';
import { bindingEntries, conflictingBindings, loadBindings, matchBindings, ShortcutCapture } from '../src/core/editor/shortcut-bindings';
import { defaultSettings, loadSettings, saveSettings } from '../src/config/settings';
describe('independent shortcut slots', () => {
  const primary = { open: 'Ctrl+O', save: 'Ctrl+S', close: '' }, secondary = { open: 'Alt+O', save: 'Ctrl+K S', close: '' };
  it('matches either slot, including sequences, and ignores empty settings', () => {
    expect(matchBindings(primary, secondary, 'Ctrl+O').action).toBe('open');
    expect(matchBindings(primary, secondary, 'Alt+O').action).toBe('open');
    expect(matchBindings(primary, secondary, 'Ctrl+K').prefix).toBe('Ctrl+K');
    expect(matchBindings(primary, secondary, 'S', 'Ctrl+K').action).toBe('save');
    expect(matchBindings(primary, secondary, '').action).toBeUndefined();
    expect(bindingEntries(primary, secondary)).toHaveLength(4);
  });
  it('allows duplicates but identifies all colliding slots', () => {
    const duplicate = { ...secondary, open: 'Ctrl+S', close: 'Ctrl+S' };
    expect(conflictingBindings(primary, duplicate)).toEqual(new Set(['Ctrl+S']));
    expect(matchBindings(primary, duplicate, 'Ctrl+S').action).toBe('open');
    expect(conflictingBindings(primary, secondary).size).toBe(0);
  });
  it('loads explicit empty fields and falls back only for missing or invalid fields', () => {
    expect(loadBindings({ open: '',save:null }, primary)).toEqual({open:'',save:'Ctrl+S',close:''});
  });
  it('captures consecutive strokes without joining separate focused edits', () => {
    const capture = new ShortcutCapture();
    expect(capture.stroke('Ctrl+K',100)).toBe('Ctrl+K');
    expect(capture.stroke('W',200)).toBe('Ctrl+K W');
    capture.reset(); expect(capture.stroke('Alt+S',250)).toBe('Alt+S');
    expect(capture.stroke('Ctrl+S',2000)).toBe('Ctrl+S');
  });
  it('swaps the original save defaults, preserves custom bindings and persists cleared second slots', () => {
    localStorage.clear();
    expect(defaultSettings.shortcuts.overwrite).toBe('Ctrl+S');
    expect(defaultSettings.shortcuts.saveAs).toBe('Ctrl+Alt+S');
    localStorage.setItem('rwr-editor-settings-v1', JSON.stringify({shortcuts:{overwrite:'Ctrl+Alt+S',saveAs:'Ctrl+S'}}));
    expect(loadSettings().shortcuts.overwrite).toBe('Ctrl+S');
    localStorage.setItem('rwr-editor-settings-v1', JSON.stringify({shortcuts:{overwrite:'Alt+Q',saveAs:'Ctrl+S'}}));
    expect(loadSettings().shortcuts.overwrite).toBe('Alt+Q');
    const settings = loadSettings(); settings.secondaryShortcuts.openModel='Alt+O'; settings.shortcuts.openModel=''; saveSettings(settings);
    expect(loadSettings().secondaryShortcuts.openModel).toBe('Alt+O');
    expect(loadSettings().shortcuts.openModel).toBe('');
    localStorage.clear();
  });
});
