import { describe, expect, it } from 'bun:test';
import { createDesktopBridge, type InvokeCommand } from '../src/platform/desktop-api';
import { fileDialogOpen } from '../src/platform/file-dialog';

describe('Tauri desktop bridge', () => {
  it('locks every chooser against other chooser types and unlocks after cancellation', async () => {
    document.body.innerHTML = '<div id="app"></div>';
    let finish!: (value: null) => void; let calls = 0;
    const bridge = createDesktopBridge((async () => { calls++; return await new Promise<null>(resolve => { finish = resolve; }); }) as InvokeCommand);
    const first = bridge.openTextFile('model');
    expect(fileDialogOpen.value).toBe(true); expect(document.querySelector('#app')!.hasAttribute('inert')).toBe(true);
    expect(await bridge.chooseWorkspace()).toBe(null); expect(await bridge.saveTextFile('model.xml', '<model/>')).toBe(null);
    expect(calls).toBe(1); finish(null); await first;
    expect(fileDialogOpen.value).toBe(false); expect(document.querySelector('#app')!.hasAttribute('inert')).toBe(false);
    expect(document.documentElement.classList.contains('file-dialog-open')).toBe(false);
    document.body.innerHTML = '';
  });
  it('maps platform-neutral file operations to isolated native commands', async () => {
    const calls: Array<{ command: string; args?: Record<string, unknown> }> = [];
    const fakeInvoke: InvokeCommand = async <T>(command: string, args?: Record<string, unknown>) => {
      calls.push({ command, args });
      return null as T;
    };
    const bridge = createDesktopBridge(fakeInvoke);

    await bridge.openTextFile('animation');
    await bridge.openDroppedTextFile('C:/models/dropped.xml');
    await bridge.takeStartupTextFile();
    await bridge.saveTextFile('walk.xml', '<animations/>');
    await bridge.overwriteTextFile('C:/models/soldier.xml', '<model/>');

    expect(calls).toEqual([
      { command: 'open_text_file', args: { kind: 'animation' } },
      { command: 'open_dropped_text_file', args: { path: 'C:/models/dropped.xml' } },
      { command: 'take_startup_text_file', args: undefined },
      { command: 'save_text_file', args: { defaultName: 'walk.xml', text: '<animations/>' } },
      { command: 'overwrite_text_file', args: { path: 'C:/models/soldier.xml', text: '<model/>' } },
    ]);
  });
});
