<template>
  <section id="animationWorkspace" class="animation-workspace">
    <button
      id="animationWorkbenchTrigger"
      type="button"
      class="animation-workspace-heading"
      aria-label="骨骼和动画"
      aria-controls="animationWorkspaceContent"
      aria-expanded="false"
    >
      <span class="workspace-icon" aria-hidden="true" />
      <strong>动画工作台</strong>
      <span id="animationSummaryStatus">未载入动画</span>
    </button>
    <div id="animationWorkspaceContent" class="animation-workspace-content" inert aria-hidden="true">
      <div class="animation-workspace-clip">
        <div class="animation-workspace-body">
          <section class="workspace-module skeleton-workspace-section">
            <div class="workspace-module-heading">
              <div>
                <h3>骨骼</h3>
              </div>
              <label class="switch compact"
                ><input id="skeletonToggle" type="checkbox" checked /><span
              /></label>
            </div>
            <div class="metric-grid">
              <div><strong id="bindingCount">0</strong><span>绑定组</span></div>
              <div><strong id="unboundCount">0</strong><span>未绑定体素</span></div>
            </div>
            <button id="rebindBtn" class="button full" disabled>重新绑定到最近骨骼</button>
          </section>
          <section class="workspace-module animation-editor-section">
            <div class="workspace-module-heading">
              <div>
                <h3>动画</h3>
              </div>
            </div>
            <div class="animation-tabs">
              <button class="active" data-animation-page="preview">预览</button
              ><button data-animation-page="edit">编辑</button>
            </div>
            <section class="animation-page active" data-animation-panel="preview">
              <div id="animationDropdown" class="animation-dropdown">
                <select id="animationSelect" hidden disabled>
                  <option value="">未载入动画文件</option>
                </select>
                <button
                  type="button"
                  class="animation-dropdown-trigger"
                  data-animation-trigger
                  aria-haspopup="listbox"
                  aria-expanded="false"
                >
                  <span data-animation-label>未载入动画文件</span><span aria-hidden="true">▾</span>
                </button>
                <div class="animation-dropdown-popup hidden" data-animation-popup>
                  <input
                    id="animationSearch"
                    data-animation-search
                    type="search"
                    placeholder="搜索动画"
                    aria-label="搜索动画"
                  />
                  <div data-animation-list role="listbox" aria-label="动画" />
                </div>
              </div>
              <div class="timeline-controls">
                <button id="animationPlayBtn" disabled>▶</button
                ><input id="animationTime" type="range" min="0" max="1000" value="0" disabled /><span
                  id="animationClock"
                  >0.00s</span
                >
              </div>
              <p id="animationInfo" class="animation-note" />
            </section>
            <section class="animation-page" data-animation-panel="edit">
              <div class="animation-actions">
                <button id="newAnimationBtn" class="button primary">新建</button
                ><button id="duplicateAnimationBtn" class="button" disabled>复制</button
                ><button id="deleteAnimationBtn" class="button danger" disabled>删除</button>
              </div>
              <div class="editor-group">
                <label>动画名称<input id="animationNameInput" type="text" disabled /></label>
                <div class="compact-fields">
                  <label
                    >总时长<input id="animationEndInput" type="number" min="0" step="0.01" disabled /></label
                  ><label
                    >速度<input
                      id="animationSpeedInput"
                      type="number"
                      min="0.01"
                      step="0.05"
                      disabled /></label
                  ><label
                    >速度随机<input id="animationSpreadInput" type="number" min="0" step="0.01" disabled
                  /></label>
                </div>
                <label class="checkbox-row"
                  ><input id="animationLoopInput" type="checkbox" disabled /><span>循环播放</span></label
                >
              </div>
              <div class="editor-group">
                <div class="editor-heading"><strong>关键帧</strong><span id="keyframeCount">0 帧</span></div>
                <select id="keyframeSelect" disabled>
                  <option>没有关键帧</option>
                </select>
                <div class="frame-actions">
                  <button id="addKeyframeBtn" disabled>＋ 新增</button
                  ><button id="duplicateKeyframeBtn" disabled>复制</button
                  ><button id="deleteKeyframeBtn" disabled>删除</button>
                </div>
                <label class="inline-field"
                  >帧时间（秒）<input id="keyframeTimeInput" type="number" min="0" step="0.01" disabled
                /></label>
              </div>
              <div class="editor-group">
                <div class="editor-heading"><strong>骨骼点位置</strong></div>
                <select id="particleSelect" disabled>
                  <option>请先载入模型</option>
                </select>
                <div class="coordinate-fields">
                  <label>X<input id="particleXInput" type="number" step="0.1" disabled /></label
                  ><label>Y<input id="particleYInput" type="number" step="0.1" disabled /></label
                  ><label>Z<input id="particleZInput" type="number" step="0.1" disabled /></label>
                </div>
                <button id="resetParticleBtn" class="button full" disabled>恢复模型位置</button>
              </div>
              <button id="saveAnimationsBtn" class="button primary full" disabled>导出动画 XML</button>
            </section>
          </section>
        </div>
      </div>
    </div>
  </section>
</template>
