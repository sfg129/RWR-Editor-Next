<template>
  <div
    id="characterPreviewModal"
    class="character-preview-backdrop hidden"
    role="dialog"
    aria-modal="true"
    aria-labelledby="characterPreviewTitle"
  >
    <section class="character-preview-window">
      <header>
        <div>
          <span class="eyebrow">IN-GAME CHARACTER PREVIEW</span>
          <h2 id="characterPreviewTitle">人物模型效果预览</h2>
        </div>
        <div class="character-preview-header-actions">
          <span id="characterPreviewLiveIndicator" class="preview-live-indicator"><i />RUNNING LOOP</span>
          <button id="closeCharacterPreviewBtn" class="icon-button" type="button" aria-label="关闭人物预览">
            ×
          </button>
        </div>
      </header>

      <div class="character-preview-layout">
        <div
          id="characterPreviewViewport"
          class="character-preview-viewport"
          tabindex="0"
          aria-label="人物模型预览场景"
        >
          <div id="characterPreviewWorldBadge" class="preview-world-badge">GRASS TEST WORLD / RUNNING</div>
          <div id="characterPreviewCameraHint" class="preview-camera-hint">
            WASD 移动 · Shift 加速 · 左键转动视角 · 滚轮缩放
          </div>
        </div>

        <aside class="character-preview-controls">
          <section>
            <span class="preview-control-code">MOTION</span>
            <label for="characterPreviewAnimation">预设动画</label>
            <select id="characterPreviewAnimation">
              <option value="still">still</option>
              <option value="running">running（循环）</option>
              <option value="running-no-weapon">running, no weapon（循环）</option>
              <option value="crouch-still">crouch still</option>
              <option value="crouch-forward">crouch forward（循环）</option>
              <option value="prone">prone</option>
              <option value="prone-forward">prone forward（循环）</option>
            </select>
          </section>

          <section>
            <span class="preview-control-code">LIGHT</span>
            <label for="characterPreviewLighting">预览光照</label>
            <select id="characterPreviewLighting">
              <option value="soft">柔和</option>
              <option value="standard" selected>标准</option>
              <option value="bright">明亮</option>
              <option value="color">颜色校对</option>
            </select>
          </section>

          <section>
            <span class="preview-control-code">VOXEL</span>
            <div class="preview-range-heading">
              <label for="characterPreviewVoxelSize">体素渲染尺寸</label>
              <output id="characterPreviewVoxelSizeValue">1.00×</output>
            </div>
            <input id="characterPreviewVoxelSize" type="range" min="0.7" max="1.2" step="0.01" value="1" />
          </section>

          <section class="preview-camera-control">
            <span class="preview-control-code">CAMERA</span>
            <label class="check-control compact"
              ><input id="characterPreviewFixedCamera" type="checkbox" checked /><span>固定镜头</span></label
            >
            <p>固定后禁用镜头移动；左键拖动可旋转人物模型。</p>
          </section>

          <div class="preview-export-block">
            <button id="exportCharacterPreviewBtn" class="button primary full" type="button">
              导出预览设定到剪贴板
            </button>
            <p id="characterPreviewStatus">参数用于确定后续固定的游戏化预览视角。</p>
          </div>
        </aside>
      </div>
    </section>
  </div>
</template>
