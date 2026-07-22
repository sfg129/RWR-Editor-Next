<template>
  <div
    id="inputStyleModal"
    class="modal-backdrop hidden"
    role="dialog"
    aria-modal="true"
    aria-labelledby="inputStyleTitle"
  >
    <div class="input-style-dialog">
      <header>
        <span class="eyebrow">INITIAL SETUP</span>
        <h2 id="inputStyleTitle">选择操作风格</h2>
        <p>只决定左键拖动时的旋转方式，不改变模型或快捷键。</p>
      </header>
      <div class="input-style-options">
        <button data-input-style="view">
          <div class="style-visual keyboard-mouse" aria-hidden="true">
            <div class="key-cluster"><span>W</span><span>A</span><span>S</span><span>D</span></div>
            <div class="mouse-diagram"><i /><b>↔</b></div>
          </div>
          <strong>键盘移动 + 鼠标操作</strong><span>WASD 移动，左键直接改变镜头朝向</span
          ><em>适合快速穿行</em>
        </button>
        <button data-input-style="scene">
          <div class="style-visual mouse-only" aria-hidden="true">
            <div class="orbit-ring">↻</div>
            <div class="mouse-diagram"><i /><b>↔</b></div>
          </div>
          <strong>纯鼠标操作</strong><span>左键拖动围绕场景和模型旋转</span><em>适合传统编辑器操作</em>
        </button>
      </div>
      <p class="input-style-note">仅影响“设置 → 功能 → 左键旋转模式”，可随时调整。</p>
    </div>
  </div>
</template>
