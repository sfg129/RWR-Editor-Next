<script setup lang="ts">
const tools = [
  { id: 'select', icon: '◇', label: '选择', shortcut: 'toolSelect', key: '1' },
  { id: 'sculpt', icon: '＋', label: '雕刻', shortcut: 'toolSculpt', key: '2' },
  { id: 'paint', icon: '▧', label: '绘色', shortcut: 'toolPaint', key: '3' },
  { id: 'picker', icon: '⌁', label: '取色', shortcut: 'toolPicker', key: '4' },
  { id: 'move', icon: '✥', label: '移动', shortcut: 'toolMove', key: '5' },
] as const;
</script>

<template>
  <aside class="tool-rail" aria-label="编辑工具">
    <button
      v-for="tool in tools"
      :key="tool.id"
      class="tool"
      :class="{ active: tool.id === 'select' }"
      :data-tool="tool.id"
    >
      <span class="tool-icon">{{ tool.icon }}</span
      ><span>{{ tool.label }}</span
      ><kbd :data-shortcut-label="tool.shortcut">{{ tool.key }}</kbd>
    </button>
    <div class="rail-divider" />
    <button class="tool muted" data-future title="为后续功能预留">
      <span class="tool-icon">⋯</span><span>扩展</span>
    </button>
    <button id="settingsBtn" class="tool rail-settings" title="设置">
      <span class="tool-icon">⚙</span><span>设置</span>
    </button>
  </aside>
</template>
