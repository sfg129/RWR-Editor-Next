<script setup lang="ts">
import ColorControls from './ColorControls.vue';

const tools = [
  { id: 'select', icon: '◇', label: '选择' },
  { id: 'sculpt', icon: '＋', label: '修改' },
  { id: 'paint', icon: '▧', label: '绘色' },
] as const;
</script>

<template>
  <aside class="inspector">
    <section class="panel model-panel">
      <div class="panel-heading">
        <div>
          <h2 id="modelName">尚未载入模型</h2>
        </div>
        <span id="fileState" class="file-state">—</span>
      </div>
      <p id="modelPath" class="subtle" />
      <div class="quick-setting">
        <label for="lightingQuickSelect">场景光照</label
        ><select id="lightingQuickSelect">
          <option value="standard">标准</option>
          <option value="color">颜色校对</option>
        </select>
      </div>
      <button id="characterPreviewBtn" class="button full character-preview-trigger">人物动画预览</button>
    </section>
    <section class="panel tool-panel">
      <div class="panel-title">
        <h3>当前工具</h3>
      </div>
      <div class="tool-tabs" aria-label="切换编辑工具">
        <button
          v-for="tool in tools"
          :key="tool.id"
          :class="{ active: tool.id === 'select' }"
          :data-tool="tool.id"
        >
          <span>{{ tool.icon }}</span
          >{{ tool.label }}
        </button>
      </div>
      <ColorControls />
    </section>
    <section class="panel selection-panel" data-tool-panel="select marquee">
      <div class="panel-title">
        <h3>移动</h3>
        <button id="clearSelectionBtn" class="text-button">清除</button>
      </div>
      <div class="selection-summary">
        <strong id="selectionSummary">未选择体素</strong><span id="selectionPosition">—</span>
      </div>
      <div class="move-layout" aria-label="移动所选体素">
        <div class="y-move">
          <button data-move="0,1,0" title="Y 轴正向">Y+</button><span>Y 轴</span
          ><button data-move="0,-1,0" title="Y 轴负向">Y−</button>
        </div>
        <div class="move-pad xz">
          <button class="z-minus" data-move="0,0,-1">Z−</button
          ><button class="x-minus" data-move="-1,0,0">X−</button><span class="center">X / Z</span
          ><button class="x-plus" data-move="1,0,0">X+</button
          ><button class="z-plus" data-move="0,0,1">Z+</button>
        </div>
      </div>
      <div class="selection-operation">
        <div class="operation-heading"><strong>旋转</strong></div>
        <div class="rotation-quick" aria-label="旋转所选体素 90 度">
          <button v-for="axis in ['x', 'y', 'z']" :key="axis" :data-rotate-axis="axis" disabled>
            {{ axis.toUpperCase() }} +90°
          </button>
        </div>
        <div class="rotation-custom">
          <select id="rotationAxisSelect" aria-label="自定义旋转轴">
            <option value="x">X 轴</option>
            <option value="y">Y 轴</option>
            <option value="z">Z 轴</option>
          </select>
          <label class="degree-input">
            <input id="rotationDegreesInput" type="number" value="45" step="1" />
            <span>度</span>
          </label>
          <button id="rotateByDegreesBtn" disabled>旋转</button>
        </div>
      </div>
      <div class="selection-operation">
        <div class="operation-heading"><strong>模型块</strong></div>
        <div class="block-actions">
          <button id="copyModelBlockBtn" disabled>复制</button>
          <button id="pasteVoxelBlockBtn" disabled>黏贴</button>
        </div>
        <details class="voxel-block-library">
          <summary>已复制模型库</summary>
          <select id="voxelBlockSelect" aria-label="选择已复制的模型"></select>
          <p id="voxelBlockSummary" class="subtle">暂无已复制模型</p>
        </details>
      </div>
      <button id="deleteSelectionBtn" class="button danger full" disabled>删除</button>
    </section>
    <slot name="animation" />
  </aside>
</template>
