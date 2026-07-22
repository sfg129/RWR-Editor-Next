<template>
  <header class="topbar">
    <div class="brand">
      <div class="brand-mark" aria-hidden="true"><span /><span /><span /></div>
      <div><strong>RWR 体素编辑器</strong><small>NEXT</small></div>
    </div>
    <nav class="file-actions" aria-label="文件操作">
      <div class="file-menu-wrap">
        <button id="fileMenuBtn" class="button" aria-haspopup="menu" aria-expanded="false">
          文件 <span class="menu-caret" aria-hidden="true" />
        </button>
        <div id="fileMenu" class="file-menu hidden" role="menu">
          <button id="newModelBtn" role="menuitem">
            <span><strong>新建空模型</strong><small>创建 1 个中心体素</small></span
            ><kbd data-shortcut-label="newModel">Ctrl N</kbd>
          </button>
          <button id="overwriteBtn" role="menuitem" disabled>
            <span><strong>保存</strong><small>覆盖当前模型文件</small></span
            ><kbd data-shortcut-label="overwrite">Ctrl Alt S</kbd>
          </button>
          <button id="saveAsBtn" role="menuitem" disabled>
            <span><strong>另存为</strong><small>选择目录和文件名</small></span
            ><kbd data-shortcut-label="saveAs">Ctrl S</kbd>
          </button>
        </div>
      </div>
      <button id="openModelBtn" class="button primary">
        <span>打开模型</span><kbd data-shortcut-label="openModel">Ctrl O</kbd>
      </button>
      <button id="openAnimationBtn" class="button">载入动画</button>
    </nav>
    <div class="history-actions">
      <button id="undoBtn" class="icon-button" title="撤销" disabled>↶</button>
      <button id="redoBtn" class="icon-button" title="重做" disabled>↷</button>
    </div>
  </header>
</template>
