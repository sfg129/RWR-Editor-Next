<template>
  <section class="viewport-panel">
    <div id="viewport" class="viewport" tabindex="0">
      <div id="emptyState" class="empty-state">
        <div class="empty-cube"><i /><i /><i /></div>
        <span class="empty-kicker">NO MODEL / 000</span>
        <h1>开始编辑 RWR 模型</h1>
        <p>打开角色 XML，或创建包含一个中心体素的新模型。所有解析与保存均在本机完成。</p>
        <div class="empty-actions">
          <button id="emptyOpenBtn" class="button primary large">选择模型文件</button
          ><button id="emptyNewBtn" class="button large">新建空文件</button>
        </div>
        <div class="drop-hint">也可以将 XML 拖放到工作区</div>
      </div>
      <div class="viewport-badges">
        <span id="viewModeBadge">透视视图</span><span id="fpsBadge">-- FPS</span>
      </div>
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
