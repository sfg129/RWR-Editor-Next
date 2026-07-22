import { describe, expect, it } from 'bun:test';
import { isTextEntryTarget, releasePressedActions } from '../src/editor/focus-policy';

describe('camera keyboard focus policy', () => {
  it('keeps camera shortcuts active for selects and non-text controls', () => {
    const select = document.createElement('select');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';

    expect(isTextEntryTarget(select)).toBe(false);
    expect(isTextEntryTarget(checkbox)).toBe(false);
  });

  it('does not capture camera shortcuts while the user is typing', () => {
    const text = document.createElement('input');
    const number = document.createElement('input');
    number.type = 'number';
    const textarea = document.createElement('textarea');

    expect(isTextEntryTarget(text)).toBe(true);
    expect(isTextEntryTarget(number)).toBe(true);
    expect(isTextEntryTarget(textarea)).toBe(true);
  });

  it('releases latched directions when a native control takes focus', () => {
    const pressed = new Set(['cameraForward', 'cameraLeft']);

    releasePressedActions(pressed);

    expect(pressed.size).toBe(0);
  });
});
