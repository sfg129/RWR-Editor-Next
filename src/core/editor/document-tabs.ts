// The Studio tab lifecycle, with the document adapter supplied by the voxel editor.
export interface DocumentTab<T> { id: string; preview: boolean; pinned?: boolean; state: T }
export function displayPath(path: string): string {
  let result = path.replaceAll('\\', '/');
  if (result.startsWith('//?/UNC/')) result = '//' + result.slice(8);
  else if (result.startsWith('//?/')) result = result.slice(4);
  return result;
}
export function pathKey(path: string): string { return displayPath(path).toLocaleLowerCase(); }
export function relativePath(path: string, root: string): string {
  const display = displayPath(path), normalizedRoot = displayPath(root).replace(/\/$/, '');
  return display.toLocaleLowerCase().startsWith(normalizedRoot.toLocaleLowerCase() + '/')
    ? display.slice(normalizedRoot.length + 1) : path;
}
export function insertDocumentTab<T extends { path: string }>(tabs: DocumentTab<T>[], state: T, dirty: (state: T) => boolean): { tabs: DocumentTab<T>[]; id: string } {
  const existing = tabs.find(tab => pathKey(tab.state.path) === pathKey(state.path));
  if (existing) return { tabs, id: existing.id };
  const tab: DocumentTab<T> = { id: crypto.randomUUID(), preview: true, state };
  const replaceIndex = tabs.findIndex(item => item.preview && !item.pinned && !dirty(item.state));
  const result = tabs.map(item => item.preview && dirty(item.state) ? { ...item, preview: false } : item);
  if (replaceIndex < 0) result.push(tab); else result.splice(replaceIndex, 1, tab);
  return { tabs: result, id: tab.id };
}
export function bulkCloseTargets<T>(tabs: DocumentTab<T>[], kind: 'others' | 'right' | 'saved' | 'all', id: string, dirty: (state: T) => boolean): string[] {
  const index = tabs.findIndex(tab => tab.id === id);
  return tabs.filter((tab, i) => !tab.pinned && (kind === 'all' || kind === 'saved' && !dirty(tab.state) || kind === 'others' && tab.id !== id || kind === 'right' && i > index)).map(tab => tab.id);
}
