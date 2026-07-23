import { describe, expect, it } from 'bun:test';
import { saveWindowState, serializeWindowState, shouldStartMaximized } from '../src/platform/window-state';

describe('desktop window state', () => {
  it('maximizes on the first launch and for invalid saved data', () => {
    expect(shouldStartMaximized(null)).toBe(true);
    expect(shouldStartMaximized('not-json')).toBe(true);
    expect(shouldStartMaximized('{"version":2,"maximized":false}')).toBe(true);
  });

  it('restores the maximized state saved at the previous close', () => {
    expect(shouldStartMaximized(serializeWindowState(true))).toBe(true);
    expect(shouldStartMaximized(serializeWindowState(false))).toBe(false);
  });

  it('persists the latest maximized state', () => {
    const stored = new Map<string, string>();
    const storage = {
      setItem: (key: string, value: string) => stored.set(key, value),
    };

    saveWindowState(storage, true);

    expect([...stored.values()]).toEqual([serializeWindowState(true)]);
  });
});
