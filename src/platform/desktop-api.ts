import { invoke } from '@tauri-apps/api/core';

export type InvokeCommand = <T>(command: string, args?: Record<string, unknown>) => Promise<T>;

export interface OpenedTextFile {
  name: string;
  path: string;
  kind: 'model' | 'animation';
  text: string;
}

export interface SavedTextFile {
  name: string;
  path: string;
}

export function createDesktopBridge(invokeCommand: InvokeCommand = invoke): {
  isAvailable(): boolean;
  openTextFile(kind: 'model' | 'animation'): Promise<OpenedTextFile | null>;
  saveTextFile(defaultName: string, text: string): Promise<SavedTextFile | null>;
  overwriteTextFile(path: string, text: string): Promise<SavedTextFile>;
} {
  return {
    isAvailable: () => typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window,
    openTextFile: (kind) => invokeCommand<OpenedTextFile | null>('open_text_file', { kind }),
    saveTextFile: (defaultName, text) =>
      invokeCommand<SavedTextFile | null>('save_text_file', { defaultName, text }),
    overwriteTextFile: (path, text) => invokeCommand<SavedTextFile>('overwrite_text_file', { path, text }),
  };
}

export const desktopBridge = createDesktopBridge();
