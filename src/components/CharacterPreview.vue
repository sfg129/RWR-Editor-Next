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
          <h2 id="characterPreviewTitle">人物动画预览</h2>
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
        />

        <aside class="character-preview-controls">
          <section>
            <label>动画</label>
            <div id="characterPreviewAnimationDropdown" class="animation-dropdown">
              <select id="characterPreviewAnimation" hidden aria-label="动画" />
              <button
                type="button"
                class="animation-dropdown-trigger"
                data-animation-trigger
                aria-haspopup="listbox"
                aria-expanded="false"
              >
                <span data-animation-label>running</span><span aria-hidden="true">▾</span>
              </button>
              <div class="animation-dropdown-popup hidden" data-animation-popup>
                <input
                  id="characterPreviewAnimationSearch"
                  data-animation-search
                  type="search"
                  placeholder="搜索动画"
                  aria-label="搜索人物动画"
                />
                <div data-animation-list role="listbox" aria-label="动画" />
              </div>
            </div>
          </section>

          <section>
            <label for="characterPreviewLighting">预览光照</label>
            <select id="characterPreviewLighting">
              <option value="standard" selected>标准</option>
              <option value="color">颜色校对</option>
            </select>
          </section>

          <section class="preview-camera-control">
            <label class="check-control compact"
              ><input id="characterPreviewFixedCamera" type="checkbox" checked /><span>固定镜头</span></label
            >
          </section>

          <p id="characterPreviewStatus" class="preview-status" aria-live="polite" />
        </aside>
      </div>
    </section>
  </div>
</template>
