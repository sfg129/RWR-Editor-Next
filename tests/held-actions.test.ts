import { describe, expect, it } from 'bun:test';
import { HeldActions } from '../src/editor/held-actions';

const key = (code: string, options: KeyboardEventInit = {}) => new window.KeyboardEvent('keydown', { code, key: code.replace('Key', ''), ...options });

describe('held camera actions', () => {
  it('releases the physical key even when Ctrl was pressed before keyup', () => {
    const held = new HeldActions<string>();
    held.press(key('KeyW'), 'forward');
    held.release(key('KeyW', { ctrlKey: true }));
    expect(held.has('forward')).toBe(false);
  });

  it('stops active movement when a shortcut modifier changes, without requiring another W', () => {
    for (const modifier of ['ctrlKey', 'altKey', 'metaKey'] as const) {
      const held = new HeldActions<string>();
      held.press(key('KeyW'), 'forward');
      held.press(key('KeyA'), 'left');
      held.reconcile(key('ControlLeft', { [modifier]: true }));
      expect(held.has('forward')).toBe(false);
      expect(held.has('left')).toBe(false);
      held.release(key('KeyW', { [modifier]: true }));
      held.release(key('ControlLeft'));
      expect(held.has('forward')).toBe(false);
    }
  });

  it('supports custom modifier bindings and stops if their modifier is released first', () => {
    const held = new HeldActions<string>();
    held.press(key('KeyW', { ctrlKey: true }), 'forward');
    expect(held.has('forward')).toBe(true);
    held.release(key('ControlLeft'));
    expect(held.has('forward')).toBe(false);
    held.release(key('KeyW'));
  });

  it('keeps Shift speed changes from cancelling movement', () => {
    const held = new HeldActions<string>();
    held.press(key('KeyW'), 'forward');
    held.reconcile(key('ShiftLeft', { shiftKey: true }));
    held.release(key('ShiftLeft'));
    expect(held.has('forward')).toBe(true);
    held.release(key('KeyW'));
    expect(held.has('forward')).toBe(false);
  });

  it('tracks two independent bindings for one direction and repeated keydowns', () => {
    const held = new HeldActions<string>();
    held.press(key('KeyW'), 'forward');
    held.press(key('ArrowUp'), 'forward');
    held.press(key('ArrowUp', { repeat: true }), 'forward');
    held.release(key('KeyW'));
    expect(held.has('forward')).toBe(true);
    held.release(key('ArrowUp'));
    expect(held.has('forward')).toBe(false);
  });

  it('clears physical records on blur, control focus, or hidden-page cleanup', () => {
    const held = new HeldActions<string>();
    held.press(key('KeyW'), 'forward');
    held.clear();
    expect(held.has('forward')).toBe(false);
    held.press(key('KeyA'), 'left');
    held.release(key('KeyW'));
    expect(held.has('left')).toBe(true);
  });
});
