<template>
  <header class="topbar">
    <nav class="file-actions" aria-label="文件操作">
      <div class="file-menu-wrap">
        <button id="fileMenuBtn" class="button" aria-haspopup="menu" aria-expanded="false">
          文件 <span class="menu-caret" aria-hidden="true" />
        </button>
        <div id="fileMenu" class="file-menu hidden" role="menu">
          <button id="openModelBtn" role="menuitem"><span>打开模型</span><kbd data-shortcut-label="openModel">Ctrl+O</kbd></button>
          <button id="newModelBtn" role="menuitem">
            <span><strong>新建空模型</strong></span
            ><kbd data-shortcut-label="newModel">Ctrl N</kbd>
          </button>
          <button id="overwriteBtn" role="menuitem" disabled>
            <span><strong>保存</strong></span
            ><kbd data-shortcut-label="overwrite">Ctrl S</kbd>
          </button>
          <button id="saveAsBtn" role="menuitem" disabled>
            <span><strong>另存为</strong></span
            ><kbd data-shortcut-label="saveAs">Ctrl Alt S</kbd>
          </button>
          <button id="closeModelTabBtn" role="menuitem"><span>关闭</span><kbd data-shortcut-label="closeTab">Ctrl+F4</kbd></button>
          <button id="closeAllModelTabsBtn" role="menuitem"><span>全部关闭</span><kbd data-shortcut-label="closeAll">Ctrl+K W</kbd></button>
        </div>
      </div>
      <button id="openAnimationBtn" class="button">载入动画</button>
      <button id="settingsBtn" class="button">设置</button>
    </nav>
    <div class="history-actions">
      <button id="undoBtn" class="icon-button" title="撤销" disabled>↶</button>
      <button id="redoBtn" class="icon-button" title="重做" disabled>↷</button>
    </div>
  </header>
</template>
