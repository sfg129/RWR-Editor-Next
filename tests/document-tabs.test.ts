import { describe, expect, it } from 'bun:test';
import { ModelTabsController, type ModelTabState } from '../src/editor/model-tabs-controller';
import { documentWorkspace as ui } from '../src/editor/document-workspace';
import { RwrModel } from '../src/core/model/rwr-model';
import { defaultSettings } from '../src/config/settings';
import { orderedShortcuts, matchShortcut } from '../src/core/editor/shortcuts';
import { flattenWorkspace, revealWorkspacePath, type WorkspaceEntry } from '../src/core/workspace/model-workspace';
const state = (name: string): ModelTabState => ({ name, path: 'C:/models/' + name, model: RwrModel.createNew(1), undo: [], redo: [], selected: [], camera: { x: 20,y: 20,z: 20 }, target: { x: 0,y: 0,z: 0 } });
function setup(decision: 'save' | 'discard' | 'cancel' = 'cancel') {
  let current: ModelTabState | undefined; let confirms = 0;
  ui.busy = false;
  const manager = new ModelTabsController({
    capture: () => current, apply: value => { current = value; },
    confirmClose: async () => { confirms++; return decision; },
    save: async () => { current!.model.dirty = false; return true; },
    error: error => { throw error; }, captureExtras: () => ({ animations: [] }), restoreExtras: () => {},
  });
  return { manager, current: () => current!, confirms: () => confirms };
}
describe('Studio lifecycle adapted to voxel documents', () => {
  it('shows clean opens as previews, but retains an edited tab even after undoing to saved content', () => {
    const { manager, current } = setup(); manager.open(state('first.xml'));
    expect(ui.tabs[0]!.preview).toBe(true); const original = current().model.snapshot();
    current().model.addVoxel({ x: 2, y: 0, z: 0 }, { r: 1, g: 0, b: 0 }); manager.refresh();
    expect(ui.tabs[0]!.preview).toBe(false); expect(ui.tabs[0]!.dirty).toBe(true);
    current().model.restore(original); manager.refresh();
    expect(ui.tabs[0]!.dirty).toBe(false); expect(ui.tabs[0]!.preview).toBe(false);
    manager.open(state('second.xml')); expect(manager.tabs).toHaveLength(2); expect(ui.tabs[1]!.preview).toBe(true);
    manager.keep(); manager.refresh(); expect(ui.tabs[1]!.dirty).toBe(false); expect(ui.tabs[1]!.preview).toBe(false);
  });
  it('persists the saved baseline independently of edits and undo history', async () => {
    localStorage.removeItem('rwr-editor.session.v1'); const first = setup(); await first.manager.restore();
    first.manager.open(state('saved.xml'));
    const original = first.current().model.snapshot();
    first.current().model.addVoxel({ x: 2, y: 0, z: 0 }, { r: 1, g: 0, b: 0 });
    first.current().model.markSaved(); const saved = first.current().model.snapshot(); first.manager.keep();
    first.current().model.restore(original); first.manager.refresh(); expect(ui.tabs[0]!.dirty).toBe(true);
    await first.manager.persist(); const second = setup(); expect(await second.manager.restore()).toBe(true);
    expect(ui.tabs[0]!.dirty).toBe(true); second.current().model.restore(saved); second.manager.refresh();
    expect(ui.tabs[0]!.dirty).toBe(false); expect(ui.tabs[0]!.preview).toBe(false);
    await second.manager.persist(); localStorage.removeItem('rwr-editor.session.v1');
  });
  it('migrates old clean sessions without confusing the original source with the last save', async () => {
    const model = RwrModel.createNew(1), original = model.snapshot();
    model.addVoxel({ x: 2, y: 0, z: 0 }, { r: 1, g: 0, b: 0 }); const saved = model.snapshot();
    localStorage.setItem('rwr-editor.session.v1', JSON.stringify({ version: 1, activeId: 'legacy', tabs: [{ id: 'legacy', name: 'saved.xml', path: 'C:/models/saved.xml', source: model.sourceText, snapshot: saved, dirty: false, preview: false, pinned: false, undo: [original], redo: [], selected: [], camera: {x:0,y:0,z:0}, target:{x:0,y:0,z:0} }] }));
    const session = setup(); expect(await session.manager.restore()).toBe(true); expect(ui.tabs[0]!.dirty).toBe(false);
    session.current().model.restore(original); session.manager.refresh(); expect(ui.tabs[0]!.dirty).toBe(true);
    session.current().model.restore(saved); session.manager.refresh(); expect(ui.tabs[0]!.dirty).toBe(false);
    await session.manager.persist(); localStorage.removeItem('rwr-editor.session.v1');
  });
  it('replaces clean previews, retains dirty or empty-saved tabs, and never duplicates a path', () => {
    const { manager, current } = setup();
    manager.open(state('one.xml')); manager.open(state('two.xml'));
    expect(manager.tabs.map(tab => tab.state.name)).toEqual(['two.xml']);
    current().model.addVoxel({ x: 2, y: 0, z: 0 }, { r: 1, g: 0, b: 0 }); manager.refresh(); manager.open(state('three.xml'));
    expect(manager.tabs.length).toBe(2); expect(manager.tabs[0]!.preview).toBe(false);
    manager.keep(); manager.open(state('four.xml')); expect(manager.tabs.length).toBe(3);
    manager.open(state('TWO.XML')); expect(manager.tabs.length).toBe(3); expect(current().name).toBe('two.xml');
  });
  it('keeps pinned tabs immune to every bulk-close action, but explicit close still confirms changes', async () => {
    const { manager, current, confirms } = setup();
    manager.open(state('pinned.xml'), true); current().model.addVoxel({ x: 2, y: 0, z: 0 }, { r: 1, g: 0, b: 0 }); ui.pin(manager.activeId);
    for (const kind of ['all','saved','others','right'] as const) await ui.bulkClose(kind, 'other');
    expect(manager.tabs.length).toBe(1); expect(confirms()).toBe(0);
    expect(await manager.close(manager.activeId)).toBe(false); expect(confirms()).toBe(1);
    ui.pin(manager.activeId); expect(manager.tabs[0]!.pinned).toBe(false);
  });
  it('restores the selected tab, pins, edited voxel identities and independent undo histories without any confirmation', async () => {
    localStorage.removeItem('rwr-editor.session.v1');
    const first = setup(); await first.manager.restore();
    first.manager.open(state('one.xml'), true);
    const active = first.manager.activeId;
    first.current().undo.push(first.current().model.snapshot());
    const added = first.current().model.addVoxel({ x: 3,y: 0,z: 0 }, { r: 1,g: 1,b: 1 })!;
    ui.pin(active);
    first.manager.open(state('two.xml'), true); first.manager.activate(active);
    await first.manager.persist(); expect(first.confirms()).toBe(0);
    const second = setup(); expect(await second.manager.restore()).toBe(true);
    expect(second.manager.activeId).toBe(active); expect(second.manager.tabs.length).toBe(2);
    expect(second.manager.tabs[0]!.pinned).toBe(true); expect(second.current().model.dirty).toBe(true);
    expect(second.current().model.voxels[1]!.id).toBe(added.id);
    expect(second.current().undo[0]!.voxels.length).toBe(1); expect(second.confirms()).toBe(0);
    expect(second.current().model.addVoxel({ x: 4,y: 0,z: 0 }, { r: 1,g: 1,b: 1 })!.id).not.toBe(added.id);
    await second.manager.persist(); localStorage.removeItem('rwr-editor.session.v1');
  });
});
describe('shortcut ordering', () => {
  it('sorts by complexity, puts Ctrl+1 first among two-key bindings and relegates chords', () => {
    const actions = orderedShortcuts(defaultSettings.shortcuts).map(row => row[0]);
    expect(actions.slice(0,8)).toEqual(['toolSelect','toolSculpt','toolPaint','cameraForward','cameraBack','cameraLeft','cameraRight','deleteSelection']);
    expect(actions[8]).toBe('marqueeThrough');
    expect(actions.indexOf('nextTab')).toBeLessThan(actions.indexOf('saveAs'));
    expect(actions.indexOf('previousTab')).toBeLessThan(actions.indexOf('pinTab'));
    const custom = { ...defaultSettings.shortcuts, undo: 'Alt+Z' };
    expect(orderedShortcuts(custom).findIndex(row=>row[0]==='undo')).toBeGreaterThan(orderedShortcuts(custom).findIndex(row=>row[0]==='nextTab'));
    expect(matchShortcut(defaultSettings.shortcuts,'Ctrl+K').prefix).toBe('Ctrl+K');
    expect(matchShortcut(defaultSettings.shortcuts,'Ctrl+W','Ctrl+K').action).toBe('closeAll');
  });
});
describe('Studio lazy workspace and selected-file reveal', () => {
  it('loads only the containing path and expands its ancestors', async () => {
    const entries: WorkspaceEntry[] = [{ name:'sub', path:'C:/models/sub',isDirectory:true,isModel:false,children:[] }];
    const expanded = new Set<string>(); let loads = 0;
    const found = await revealWorkspacePath(entries,'C:/models/sub/tank.xml',expanded,async entry => { loads++; entry.children = [{name:'tank.xml',path:'C:/models/sub/tank.xml',isDirectory:false,isModel:true,children:[]}]; });
    expect(found).toBe(true); expect(loads).toBe(1);
    expect(flattenWorkspace(entries,expanded).map(row=>row.depth)).toEqual([0,1]);
  });
});
