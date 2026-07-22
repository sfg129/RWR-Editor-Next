import { describe, expect, it } from 'bun:test';
import { FileDialogGate } from '../src/editor/file-dialog-gate';

describe('exclusive file dialog gate', () => {
  it('allows only one file chooser until the current chooser closes', () => {
    const states: boolean[] = [];
    const gate = new FileDialogGate((active) => states.push(active));

    expect(gate.tryOpen()).toBe(true);
    expect(gate.tryOpen()).toBe(false);
    expect(gate.isOpen()).toBe(true);
    expect(states).toEqual([true]);

    gate.close();

    expect(gate.isOpen()).toBe(false);
    expect(gate.tryOpen()).toBe(true);
    expect(states).toEqual([true, false, true]);
  });
});
