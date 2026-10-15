import { describe, expect, it } from 'bun:test';
import { FileDialogGate } from '../src/editor/file-dialog-gate';

describe('exclusive file dialog gate', () => {
  it('suppresses concurrent chooser operations and releases on cancel or failure', async () => {
    const states: boolean[] = []; const gate = new FileDialogGate(active => states.push(active));
    let finish!: (value: null) => void; let duplicateCalls = 0;
    const first = gate.run(() => new Promise<null>(resolve => { finish = resolve; }));
    expect(await gate.run(async () => { duplicateCalls++; return 'unexpected'; })).toBe(null);
    expect(duplicateCalls).toBe(0); expect(gate.isOpen()).toBe(true);
    finish(null); expect(await first).toBe(null); expect(gate.isOpen()).toBe(false);
    await expect(gate.run(async () => { throw new Error('chooser failed'); })).rejects.toThrow('chooser failed');
    expect(gate.isOpen()).toBe(false);
    expect(await gate.run(async () => 'selected')).toBe('selected');
    expect(states).toEqual([true, false, true, false, true, false]);
  });
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
