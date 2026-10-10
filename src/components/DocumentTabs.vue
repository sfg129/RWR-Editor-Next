<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { documentWorkspace as workspace } from '../editor/document-workspace';
import { desktopBridge } from '../platform/desktop-api';
import { relativePath } from '../core/editor/document-tabs';
import { localized } from '../i18n/runtime';
const bar = ref<HTMLElement>();
const menu = ref<{ id: string; x: number; y: number }>();
function context(event: MouseEvent, id: string) {
  event.preventDefault(); menu.value = { id, x: Math.min(event.clientX, window.innerWidth - 270), y: Math.min(event.clientY, window.innerHeight - 365) };
}
function dismiss(event: Event) { if (!(event.target as Element)?.closest('.document-tab-menu')) menu.value = undefined; }
function keep() { if (menu.value) workspace.keepOpen(menu.value.id); menu.value = undefined; }
function pin() { if (menu.value) workspace.pin(menu.value.id); menu.value = undefined; }
async function close(kind?: 'others' | 'right' | 'saved' | 'all') {
  const id = menu.value?.id ?? workspace.activeId; menu.value = undefined;
  if (kind) await workspace.bulkClose(kind, id); else await workspace.close(id);
}
async function copy(relative = false) {
  const path = workspace.tabs.find(tab => tab.id === menu.value?.id)?.path; menu.value = undefined;
  if (!path || path.startsWith('untitled:')) return;
  let root = ''; try { root = JSON.parse(localStorage.getItem('rwr-editor.model-workspace.v1') ?? '{}').root ?? ''; } catch {}
  try { await navigator.clipboard.writeText(relative ? relativePath(path, root) : path); } catch {}
}
async function reveal() {
  const path = workspace.tabs.find(tab => tab.id === menu.value?.id)?.path; menu.value = undefined;
  if (path && !path.startsWith('untitled:')) await desktopBridge.revealFile(path).catch(() => {});
}
async function revealWorkspace() {
  const id = menu.value?.id, path = workspace.tabs.find(tab => tab.id === id)?.path; menu.value = undefined;
  if (!path || path.startsWith('untitled:')) return;
  workspace.activate(id!); await workspace.revealPath(path);
}
watch(() => workspace.activeId, async () => { await nextTick(); bar.value?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest', inline: 'nearest' }); });
onMounted(() => document.addEventListener('pointerdown', dismiss));
onBeforeUnmount(() => document.removeEventListener('pointerdown', dismiss));
</script>
<template>
  <div ref="bar" class="document-tabs" role="tablist" aria-label="模型标签页">
    <div v-for="tab in workspace.tabs" :key="tab.id" class="document-tab" :class="{ active: tab.id === workspace.activeId, preview: tab.preview, pinned: tab.pinned, dirty: tab.dirty }" :title="tab.path" @contextmenu="context($event, tab.id)" @auxclick="$event.button === 1 && workspace.close(tab.id)">
      <button role="tab" :aria-selected="tab.id === workspace.activeId" :disabled="workspace.busy || !workspace.ready" @click="workspace.activate(tab.id)" @dblclick="workspace.keepOpen(tab.id)"><span data-no-localize>{{ tab.name }}</span></button>
      <button class="document-tab-close" :disabled="workspace.busy" :aria-label="localized(tab.pinned ? '取消固定' : '关闭')" @click="tab.pinned ? workspace.pin(tab.id) : workspace.close(tab.id)">
        <svg v-if="tab.pinned" class="tab-pin" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.15" aria-hidden="true"><path d="m9.5 1.5 5 5-1.8 1.1-1.1 3.2-2.2-.7-3.1-3.1-.7-2.2 3.2-1.1zM7.9 8.1 2.3 13.7"/></svg>
        <template v-else><span v-if="tab.dirty" class="tab-dirty-dot"/><span class="tab-close-cross">×</span></template>
      </button>
    </div>
  </div>
  <Teleport to="body"><div v-if="menu" class="document-tab-menu" role="menu" :style="{ left: menu.x + 'px', top: menu.y + 'px' }" @keydown.esc="menu = undefined">
    <button role="menuitem" @click="close()">关闭</button>
    <button role="menuitem" @click="close('others')">关闭其它</button>
    <button role="menuitem" @click="close('right')">关闭右侧标签页</button>
    <button role="menuitem" @click="close('saved')">关闭已保存</button>
    <button role="menuitem" @click="close('all')">全部关闭</button>
    <hr/><button role="menuitem" @click="copy()">复制路径</button>
    <button role="menuitem" @click="copy(true)">复制相对路径</button>
    <button role="menuitem" @click="reveal()">在资源管理器中打开</button>
    <button role="menuitem" @click="revealWorkspace()">在资源管理器视图中显示</button>
    <hr/><button role="menuitem" @click="keep()">保持打开</button>
    <button role="menuitem" @click="pin()">{{ workspace.tabs.find(tab => tab.id === menu?.id)?.pinned ? '取消固定' : '固定' }}</button>
  </div></Teleport>
</template>
