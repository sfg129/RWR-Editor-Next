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
    <div class="marquee-tool-wrap">
      <button
        id="marqueeToolBtn"
        class="tool"
        data-tool="marquee"
        aria-haspopup="menu"
        aria-expanded="false"
        title="框选 · 穿透框选"
      >
        <span class="tool-icon">▱</span><span>框选</span>
      </button>
      <div class="marquee-mode-menu" role="menu" aria-label="框选模式">
        <button class="active" data-marquee-mode="through" role="menuitem">
          <span><strong>穿透框选</strong><small>选中框内的所有体素</small></span
          ><kbd data-shortcut-label="marqueeThrough">Ctrl 1</kbd>
        </button>
        <button data-marquee-mode="visible" role="menuitem">
          <span><strong>可视框选</strong><small>仅选中可见的第一层体素</small></span
          ><kbd data-shortcut-label="marqueeVisible">Ctrl 2</kbd>
        </button>
      </div>
    </div>
    <button id="settingsBtn" class="tool rail-settings" title="设置">
      <span class="tool-icon">⚙</span><span>设置</span>
    </button>
  </aside>
</template>
