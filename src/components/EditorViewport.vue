<template>
  <section class="viewport-panel">
    <div id="viewport" class="viewport" tabindex="0">
      <div class="viewport-badges">
        <span id="fpsBadge">-- FPS</span>
      </div>
      <div id="marqueeSelection" class="marquee-selection" hidden aria-hidden="true" />
    </div>
    <footer class="statusbar">
      <div class="status-left"><span class="status-dot" /><span id="statusText">就绪</span></div>
      <div class="model-stats">
        <span>体素 <strong id="voxelCount">0</strong></span
        ><span>已选 <strong id="selectedCount">0</strong></span
        ><span>骨骼点 <strong id="boneCount">0</strong></span
        ><span id="dirtyState">未加载</span>
      </div>
    </footer>
  </section>
</template>
