import { describe, expect, it } from 'bun:test';
import { createDesktopBridge, type InvokeCommand } from '../src/platform/desktop-api';

describe('Tauri desktop bridge', () => {
  it('maps platform-neutral file operations to isolated native commands', async () => {
    const calls: Array<{ command: string; args?: Record<string, unknown> }> = [];
    const fakeInvoke: InvokeCommand = async <T>(command: string, args?: Record<string, unknown>) => {
      calls.push({ command, args });
      return null as T;
    };
    const bridge = createDesktopBridge(fakeInvoke);

    await bridge.openTextFile('animation');
    await bridge.saveTextFile('walk.xml', '<animations/>');
    await bridge.overwriteTextFile('C:/models/soldier.xml', '<model/>');

    expect(calls).toEqual([
      { command: 'open_text_file', args: { kind: 'animation' } },
      { command: 'save_text_file', args: { defaultName: 'walk.xml', text: '<animations/>' } },
      { command: 'overwrite_text_file', args: { path: 'C:/models/soldier.xml', text: '<model/>' } },
    ]);
  });
});
