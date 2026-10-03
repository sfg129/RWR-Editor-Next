<template>
  <aside class="tool-rail" aria-label="编辑工具">
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
          <span><strong>穿透框选</strong></span
          ><kbd data-shortcut-label="marqueeThrough">Ctrl 1</kbd>
        </button>
        <button data-marquee-mode="visible" role="menuitem">
          <span><strong>可视框选</strong></span
          ><kbd data-shortcut-label="marqueeVisible">Ctrl 2</kbd>
        </button>
      </div>
    </div>
    <button id="settingsBtn" class="tool rail-settings" title="设置">
      <span class="tool-icon">⚙</span><span>设置</span>
    </button>
  </aside>
</template>
