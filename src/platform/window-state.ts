const WINDOW_STATE_KEY = 'rwr-editor-next-window-state-v1';

interface SavedWindowState {
  version: 1;
  maximized: boolean;
}

export function shouldStartMaximized(rawState: string | null): boolean {
  if (rawState === null) return true;
  try {
    const parsed = JSON.parse(rawState) as Partial<SavedWindowState>;
    return parsed.version === 1 && typeof parsed.maximized === 'boolean' ? parsed.maximized : true;
  } catch {
    return true;
  }
}

export function serializeWindowState(maximized: boolean): string {
  return JSON.stringify({ version: 1, maximized } satisfies SavedWindowState);
}

export async function initializeWindowState(): Promise<void> {
  if (typeof window === 'undefined' || !('__TAURI_INTERNALS__' in window)) return;

  try {
    const { getCurrentWindow } = await import('@tauri-apps/api/window');
    const appWindow = getCurrentWindow();
    const savedState = localStorage.getItem(WINDOW_STATE_KEY);

    if (shouldStartMaximized(savedState)) await appWindow.maximize();
    else if (await appWindow.isMaximized()) await appWindow.unmaximize();

    await appWindow.onCloseRequested(async () => {
      localStorage.setItem(WINDOW_STATE_KEY, serializeWindowState(await appWindow.isMaximized()));
    });
  } catch (error) {
    console.warn('Unable to restore the desktop window state.', error);
  }
}
