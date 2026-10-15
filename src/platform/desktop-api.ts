import { invoke } from '@tauri-apps/api/core';
import { withFileDialog } from './file-dialog';
import type { ModelWorkspace, WorkspaceEntry } from '../core/workspace/model-workspace';

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
  openDroppedTextFile(path: string): Promise<OpenedTextFile>;
  takeStartupTextFile(): Promise<OpenedTextFile | null>;
  saveTextFile(defaultName: string, text: string): Promise<SavedTextFile | null>;
  overwriteTextFile(path: string, text: string): Promise<SavedTextFile>;
  chooseWorkspace(): Promise<ModelWorkspace | null>;
  scanWorkspace(path: string): Promise<ModelWorkspace>;
  listWorkspaceDir(path: string): Promise<WorkspaceEntry[]>;
  loadSession(): Promise<string | null>;
  saveSession(text: string): Promise<void>;
  revealFile(path: string): Promise<void>;
} {
  return {
    isAvailable: () => typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window,
    openTextFile: (kind) => withFileDialog(() => invokeCommand<OpenedTextFile | null>('open_text_file', { kind })),
    openDroppedTextFile: (path) => invokeCommand<OpenedTextFile>('open_dropped_text_file', { path }),
    takeStartupTextFile: () => invokeCommand<OpenedTextFile | null>('take_startup_text_file'),
    saveTextFile: (defaultName, text) =>
      withFileDialog(() => invokeCommand<SavedTextFile | null>('save_text_file', { defaultName, text })),
    overwriteTextFile: (path, text) => invokeCommand<SavedTextFile>('overwrite_text_file', { path, text }),
    chooseWorkspace: () => withFileDialog(() => invokeCommand<ModelWorkspace | null>('choose_model_workspace')),
    scanWorkspace: path => invokeCommand<ModelWorkspace>('scan_model_workspace', { path }),
    listWorkspaceDir: path => invokeCommand<WorkspaceEntry[]>('list_model_workspace_dir', { path }),
    loadSession: () => invokeCommand<string | null>('load_editor_session'),
    saveSession: text => invokeCommand<void>('save_editor_session', { text }),
    revealFile: path => invokeCommand<void>('reveal_model_file', { path }),
  };
}

export const desktopBridge = createDesktopBridge();
