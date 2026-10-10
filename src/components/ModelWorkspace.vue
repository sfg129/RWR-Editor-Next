<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { documentWorkspace } from '../editor/document-workspace';
import { desktopBridge } from '../platform/desktop-api';
import { flattenWorkspace, revealWorkspacePath, type ModelWorkspace, type WorkspaceEntry } from '../core/workspace/model-workspace';
import { pathKey } from '../core/editor/document-tabs';
const key = 'rwr-editor.model-workspace.v1';
let prefs: { root?: string; expanded?: string[]; width?: number; previousWidth?: number } = {};
try { const value = JSON.parse(localStorage.getItem(key) ?? '{}'); if (value && typeof value === 'object') prefs = value; } catch {}
const width = ref(Number.isFinite(prefs.width) ? Math.max(0, Math.min(500, prefs.width!)) : 230);
let previousWidth = prefs.previousWidth && prefs.previousWidth >= 160 ? Math.min(500, prefs.previousWidth) : 230;
const workspace = ref<ModelWorkspace>();
const expanded = ref(new Set(Array.isArray(prefs.expanded) ? prefs.expanded : []));
const loaded = new Set<string>(), loading = new Map<string, Promise<void>>();
const tree = ref<HTMLElement>(), splitter = ref<HTMLElement>(), error = ref(''), busy = ref(false);
let token = 0;
const rows = computed(() => flattenWorkspace(workspace.value?.entries ?? [], expanded.value));
function persist() {
  try { localStorage.setItem(key, JSON.stringify({ root: workspace.value?.root ?? prefs.root ?? '', expanded: [...expanded.value], width: width.value, previousWidth })); } catch {}
}
function applyWidth() { document.documentElement.style.setProperty('--model-workspace-width', width.value + 'px'); persist(); }
watch(width, applyWidth, { immediate: true });
async function loadChildren(entry: WorkspaceEntry) {
  if (loaded.has(entry.path)) return;
  const pending = loading.get(entry.path); if (pending) return pending;
  const request = desktopBridge.listWorkspaceDir(entry.path).then(children => { entry.children = children; loaded.add(entry.path); }).finally(() => loading.delete(entry.path));
  loading.set(entry.path, request); await request;
}
async function restoreExpanded(entries: WorkspaceEntry[]) {
  for (const entry of entries) if (entry.isDirectory && expanded.value.has(entry.path)) { await loadChildren(entry); await restoreExpanded(entry.children); }
}
async function revealActive(path = documentWorkspace.activePath) {
  const current = ++token, root = workspace.value;
  if (!path || !root) return;
  try {
    await revealWorkspacePath(root.entries, path, expanded.value, loadChildren, () => current === token && root === workspace.value);
    expanded.value = new Set(expanded.value); persist(); await nextTick();
    if (current === token) tree.value?.querySelector('.workspace-entry.active')?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  } catch (e) { error.value = String(e); }
}
async function choose() {
  busy.value = true;
  try { const result = await desktopBridge.chooseWorkspace(); if (result) { ++token; workspace.value = result; prefs.root = result.root; loaded.clear(); expanded.value = new Set(); error.value = ''; persist(); await revealActive(); } }
  catch (e) { error.value = String(e); } finally { busy.value = false; }
}
async function activate(entry: WorkspaceEntry) {
  try {
    if (entry.isDirectory) {
      if (expanded.value.has(entry.path)) expanded.value.delete(entry.path);
      else { await loadChildren(entry); expanded.value.add(entry.path); }
      expanded.value = new Set(expanded.value); persist();
    } else if (entry.isModel && documentWorkspace.ready) await documentWorkspace.openPath(entry.path);
  } catch (e) { error.value = String(e); }
}
function drag(event: PointerEvent) {
  if (event.button !== 0) return;
  const handle = event.currentTarget as HTMLElement;
  const start = event.clientX, before = width.value; let moved = false;
  handle.setPointerCapture(event.pointerId);
  const move = (next: PointerEvent) => {
    if (next.pointerId !== event.pointerId) return;
    if (Math.abs(next.clientX - start) > 3) moved = true;
    const candidate = before + next.clientX - start;
    width.value = candidate < 110 ? 0 : Math.max(160, Math.min(500, window.innerWidth * .4, candidate));
    if (width.value) previousWidth = width.value;
  };
  const finish = (next: PointerEvent) => {
    if (next.pointerId !== event.pointerId) return;
    handle.removeEventListener('pointermove', move); handle.removeEventListener('pointerup', finish); handle.removeEventListener('pointercancel', cancel);
    if (handle.hasPointerCapture(event.pointerId)) handle.releasePointerCapture(event.pointerId);
    if (!moved && next.type !== 'pointercancel') width.value = width.value ? 0 : previousWidth;
    persist();
  };
  const cancel = (next: PointerEvent) => { finish(next); };
  handle.addEventListener('pointermove', move); handle.addEventListener('pointerup', finish); handle.addEventListener('pointercancel', cancel);
}
watch(() => documentWorkspace.activePath, () => void revealActive());
documentWorkspace.revealPath = async path => { if (!width.value) width.value = previousWidth; await revealActive(path); };
onMounted(async () => {
  if (!prefs.root || !desktopBridge.isAvailable()) return;
  try { workspace.value = await desktopBridge.scanWorkspace(prefs.root); await restoreExpanded(workspace.value.entries); await revealActive(); }
  catch (e) { error.value = String(e); }
});
</script>
<template>
  <aside class="model-workspace" :class="{ collapsed: !width }" :inert="!width">
    <header><strong>工作区</strong><button class="button" :disabled="busy" @click="choose">打开文件夹</button></header>
    <div v-if="workspace" class="workspace-root" :title="workspace.root" data-no-localize>{{ workspace.root }}</div>
    <div ref="tree" class="workspace-tree">
      <button v-for="row in rows" :key="row.entry.path" class="workspace-entry" :class="{ directory: row.entry.isDirectory, other: !row.entry.isDirectory && !row.entry.isModel, active: pathKey(row.entry.path) === pathKey(documentWorkspace.activePath) }" :style="{ paddingLeft: 9 + row.depth * 14 + 'px' }" :title="row.entry.path" :disabled="!row.entry.isDirectory && !row.entry.isModel" @click="activate(row.entry)">
        <span>{{ row.entry.isDirectory ? expanded.has(row.entry.path) ? '▾' : '▸' : '◇' }}</span><span data-no-localize>{{ row.entry.name }}</span>
      </button>
    </div>
    <p v-if="error" class="workspace-error" data-no-localize>{{ error }}</p>
  </aside>
  <div ref="splitter" class="model-workspace-splitter" :class="{ collapsed: !width }" role="separator" tabindex="0" aria-label="工作区宽度" aria-orientation="vertical" :aria-valuenow="width" @pointerdown.prevent="drag" @keydown.left.prevent="width = width <= 160 ? 0 : width - 20" @keydown.right.prevent="width = width ? Math.min(500, width + 20) : previousWidth" @keydown.enter.prevent="width = width ? 0 : previousWidth"><span>{{ width ? '‹' : '›' }}</span></div>
</template>
