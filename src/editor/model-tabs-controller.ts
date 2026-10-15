import { documentWorkspace as ui } from './document-workspace';
import { bulkCloseTargets, insertDocumentTab, pathKey, type DocumentTab } from '../core/editor/document-tabs';
import { desktopBridge } from '../platform/desktop-api';
import { RwrModel } from '../core/model/rwr-model';
import type { EditorSnapshot, Vec3 } from '../core/types';
export interface ModelTabState {
  name: string; path: string; model: RwrModel; undo: EditorSnapshot[]; redo: EditorSnapshot[]; selected: string[];
  camera: Vec3; target: Vec3;
}
interface StoredTab { id: string; preview: boolean; pinned: boolean; name: string; path: string; source: string; snapshot: EditorSnapshot; savedSnapshot?: EditorSnapshot; dirty: boolean; undo: EditorSnapshot[]; redo: EditorSnapshot[]; selected: string[]; camera: Vec3; target: Vec3 }
const sessionKey = 'rwr-editor.session.v1';
const dirty = (state: ModelTabState) => state.model.dirty;
export class ModelTabsController {
  tabs: DocumentTab<ModelTabState>[] = [];
  activeId = '';
  private ready = false;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private writes: Promise<void> = Promise.resolve();
  constructor(private adapter: {
    capture(): ModelTabState | undefined; apply(state?: ModelTabState): void;
    confirmClose(): Promise<'save' | 'discard' | 'cancel'>; save(): Promise<boolean>;
    error(error: unknown): void; captureExtras(): unknown; restoreExtras(value: unknown): void;
  }) {
    ui.activate = id => this.activate(id);
    ui.keepOpen = id => { this.keep(id); this.refresh(); };
    ui.pin = id => {
      this.tabs = this.tabs.map(tab => tab.id === id ? { ...tab, pinned: !tab.pinned, preview: false } : tab);
      this.tabs = [...this.tabs.filter(tab => tab.pinned), ...this.tabs.filter(tab => !tab.pinned)]; this.refresh();
    };
    ui.close = id => this.close(id);
    ui.bulkClose = async (kind, id) => {
      this.remember();
      const ids = bulkCloseTargets(this.tabs, kind, id, dirty);
      for (const target of ids) { if (this.tabs.find(tab => tab.id === target)?.pinned) continue; if (!(await this.close(target))) break; }
    };
  }
  remember() {
    const state = this.adapter.capture(), tab = this.tabs.find(item => item.id === this.activeId);
    if (state && tab) { tab.state = state; if (dirty(state)) tab.preview = false; }
  }
  keep(id = this.activeId) { this.tabs = this.tabs.map(tab => tab.id === id ? { ...tab, preview: false } : tab); }
  refresh() {
    this.remember();
    ui.activeId = this.activeId; ui.activePath = this.tabs.find(tab => tab.id === this.activeId)?.state.path ?? '';
    ui.tabs = this.tabs.map(tab => ({ id: tab.id, name: tab.state.name, path: tab.state.path, preview: tab.preview, pinned: !!tab.pinned, dirty: dirty(tab.state) }));
    if (this.ready) { clearTimeout(this.timer); this.timer = setTimeout(() => void this.persist().catch(this.adapter.error), 650); }
  }
  activate(id: string) {
    if (ui.busy || this.activeId === id) return;
    const tab = this.tabs.find(item => item.id === id); if (!tab) return;
    this.remember(); this.activeId = id; this.adapter.apply(tab.state); this.refresh();
  }
  open(state: ModelTabState, permanent = false) {
    if (ui.busy) return;
    this.remember();
    const result = insertDocumentTab(this.tabs, state, dirty);
    this.tabs = result.tabs;
    if (permanent) this.keep(result.id);
    if (result.id !== this.activeId) { this.activeId = result.id; this.adapter.apply(this.tabs.find(tab => tab.id === result.id)!.state); }
    this.refresh();
  }
  async close(id: string): Promise<boolean> {
    if (ui.busy) return false;
    this.remember();
    const tab = this.tabs.find(item => item.id === id); if (!tab) return true;
    if (dirty(tab.state)) {
      this.activate(id); ui.busy = true;
      try {
        const decision = await this.adapter.confirmClose();
        if (decision === 'cancel') return false;
        if (decision === 'save' && !(await this.adapter.save())) return false;
      } finally { ui.busy = false; }
    }
    const index = this.tabs.findIndex(item => item.id === id);
    this.tabs = this.tabs.filter(item => item.id !== id);
    if (id === this.activeId) {
      const next = this.tabs[Math.min(index, this.tabs.length - 1)];
      this.activeId = next?.id ?? ''; this.adapter.apply(next?.state);
    }
    this.refresh(); return true;
  }
  cycle(delta: number) {
    if (!this.tabs.length) return;
    const index = this.tabs.findIndex(tab => tab.id === this.activeId);
    this.activate(this.tabs[(index + delta + this.tabs.length) % this.tabs.length]!.id);
  }
  find(path: string) { return this.tabs.find(tab => pathKey(tab.state.path) === pathKey(path)); }
  async persist() {
    if (!this.ready) return;
    clearTimeout(this.timer); this.remember();
    const tabs: StoredTab[] = this.tabs.map(tab => {
      const state = tab.state;
      return { id: tab.id, preview: tab.preview, pinned: !!tab.pinned, name: state.name, path: state.path, source: state.model.sourceText, snapshot: state.model.snapshot(), savedSnapshot: state.model.savedSnapshot(), dirty: state.model.dirty, undo: state.undo, redo: state.redo, selected: state.selected, camera: state.camera, target: state.target };
    });
    const text = JSON.stringify({ version: 1, activeId: this.activeId, tabs, extras: this.adapter.captureExtras() });
    this.writes = this.writes.catch(() => {}).then(async () => {
      if (desktopBridge.isAvailable()) await desktopBridge.saveSession(text); else localStorage.setItem(sessionKey, text);
    });
    await this.writes;
  }
  async restore(): Promise<boolean> {
    try {
      const raw = desktopBridge.isAvailable() ? await desktopBridge.loadSession() : localStorage.getItem(sessionKey);
      if (!raw) return false;
      const session = JSON.parse(raw) as { version: number; activeId: string; tabs: StoredTab[]; extras: unknown };
      if (session.version !== 1 || typeof session.activeId !== 'string' || !Array.isArray(session.tabs) || new Set(session.tabs.map(tab => tab.id)).size !== session.tabs.length) throw new Error('Invalid editor session');
      const restored: DocumentTab<ModelTabState>[] = [];
      for (const tab of session.tabs) {
        if (![tab.id, tab.name, tab.path, tab.source].every(value => typeof value === 'string') || !Array.isArray(tab.undo) || !Array.isArray(tab.redo) || !Array.isArray(tab.selected)) throw new Error('Invalid editor tab');
        const model = RwrModel.parse(tab.source);
        if (tab.savedSnapshot) model.markSaved(tab.savedSnapshot);
        else if (!tab.dirty) model.markSaved(tab.snapshot);
        model.restore(tab.snapshot);
        restored.push({ id: tab.id, preview: !!tab.preview, pinned: !!tab.pinned, state: { name: tab.name, path: tab.path, model, undo: tab.undo, redo: tab.redo, selected: tab.selected, camera: tab.camera, target: tab.target } });
        if (desktopBridge.isAvailable() && !tab.path.startsWith('untitled:')) {
          try {
            const disk = await desktopBridge.openDroppedTextFile(tab.path);
            if (!tab.savedSnapshot && tab.dirty) model.markSaved(RwrModel.parse(disk.text).snapshot());
          } catch { /* Keep edits; Save As remains available. */ }
        }
      }
      this.tabs = restored; this.adapter.restoreExtras(session.extras);
      this.activeId = this.tabs.find(tab => tab.id === session.activeId)?.id ?? this.tabs[0]?.id ?? '';
      this.adapter.apply(this.tabs.find(tab => tab.id === this.activeId)?.state);
      return true;
    } catch (error) { this.adapter.error(error); return false; }
    finally { this.ready = true; ui.ready = true; this.refresh(); }
  }
}
