import { pathKey } from '../editor/document-tabs';
export interface WorkspaceEntry { name: string; path: string; isDirectory: boolean; isModel: boolean; children: WorkspaceEntry[] }
export interface ModelWorkspace { root: string; entries: WorkspaceEntry[] }
export interface WorkspaceRow { entry: WorkspaceEntry; depth: number }
export function flattenWorkspace(entries: WorkspaceEntry[], expanded: ReadonlySet<string>, depth = 0): WorkspaceRow[] {
  const rows: WorkspaceRow[] = [];
  for (const entry of entries) {
    rows.push({ entry, depth });
    if (entry.isDirectory && expanded.has(entry.path)) rows.push(...flattenWorkspace(entry.children, expanded, depth + 1));
  }
  return rows;
}
export async function revealWorkspacePath(entries: WorkspaceEntry[], path: string, expanded: Set<string>, loadChildren: (entry: WorkspaceEntry) => Promise<void>, current: () => boolean = () => true): Promise<boolean> {
  const key = pathKey(path);
  for (const entry of entries) {
    if (!current()) return false;
    const entryKey = pathKey(entry.path).replace(/\/$/, '');
    if (entryKey === key && entry.isModel) return true;
    if (entry.isDirectory && key.startsWith(entryKey + '/')) {
      await loadChildren(entry);
      if (!current()) return false;
      expanded.add(entry.path);
      return revealWorkspacePath(entry.children, path, expanded, loadChildren, current);
    }
  }
  return false;
}
