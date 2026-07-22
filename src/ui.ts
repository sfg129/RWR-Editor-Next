export const appMarkup = `
  <div class="app-shell">
    <header class="topbar">
      <div class="brand">
        <div class="brand-mark" aria-hidden="true"><span></span><span></span><span></span></div>
        <div><strong>RWR 体素编辑器</strong><small>NEXT · 兼容重建版</small></div>
      </div>
      <nav class="file-actions" aria-label="文件操作">
        <div class="file-menu-wrap">
          <button class="button" id="fileMenuBtn" aria-haspopup="menu" aria-expanded="false">文件 <span class="menu-caret">▾</span></button>
          <div class="file-menu hidden" id="fileMenu" role="menu">
            <button role="menuitem" id="newModelBtn"><span><strong>新建空模型</strong><small>创建 1 个中心体素</small></span><kbd data-shortcut-label="newModel">Ctrl N</kbd></button>
            <button role="menuitem" id="overwriteBtn" disabled><span><strong>保存</strong><small>覆盖当前模型文件</small></span><kbd data-shortcut-label="overwrite">Ctrl Alt S</kbd></button>
            <button role="menuitem" id="saveAsBtn" disabled><span><strong>另存为</strong><small>选择目录和文件名</small></span><kbd data-shortcut-label="saveAs">Ctrl S</kbd></button>
          </div>
        </div>
        <button class="button primary" id="openModelBtn"><span>打开模型</span><kbd data-shortcut-label="openModel">Ctrl O</kbd></button>
        <button class="button" id="openAnimationBtn">载入动画</button>
      </nav>
      <div class="history-actions">
        <button class="icon-button" id="undoBtn" title="撤销" disabled>↶</button>
        <button class="icon-button" id="redoBtn" title="重做" disabled>↷</button>
      </div>
    </header>

    <main class="workspace">
      <aside class="tool-rail" aria-label="编辑工具">
        <button class="tool active" data-tool="select"><span class="tool-icon">◇</span><span>选择</span><kbd data-shortcut-label="toolSelect">1</kbd></button>
        <button class="tool" data-tool="sculpt"><span class="tool-icon">＋</span><span>雕刻</span><kbd data-shortcut-label="toolSculpt">2</kbd></button>
        <button class="tool" data-tool="paint"><span class="tool-icon">▧</span><span>绘色</span><kbd data-shortcut-label="toolPaint">3</kbd></button>
        <button class="tool" data-tool="picker"><span class="tool-icon">⌁</span><span>取色</span><kbd data-shortcut-label="toolPicker">4</kbd></button>
        <button class="tool" data-tool="move"><span class="tool-icon">✥</span><span>移动</span><kbd data-shortcut-label="toolMove">5</kbd></button>
        <div class="rail-divider"></div>
        <button class="tool muted" data-future title="为后续功能预留"><span class="tool-icon">⋯</span><span>扩展</span></button>
        <button class="tool rail-settings" id="settingsBtn" title="设置"><span class="tool-icon">⚙</span><span>设置</span></button>
      </aside>

      <section class="viewport-panel">
        <div id="viewport" class="viewport" tabindex="0">
          <div class="empty-state" id="emptyState">
            <div class="empty-cube"><i></i><i></i><i></i></div>
            <h1>开始编辑 RWR 模型</h1>
            <p>打开一个角色 XML，或创建含 1 个中心体素的新模型。文件保存与安全确认可在“文件”和“设置”中管理。</p>
            <div class="empty-actions"><button class="button primary large" id="emptyOpenBtn">选择模型文件</button><button class="button large" id="emptyNewBtn">新建空文件</button></div>
            <div class="drop-hint">也可以将 XML 拖放到这里</div>
          </div>
          <div class="viewport-badges">
            <span id="viewModeBadge">透视视图</span><span id="fpsBadge">-- FPS</span>
          </div>
        </div>
        <footer class="statusbar">
          <div class="status-left"><span class="status-dot"></span><span id="statusText">就绪</span></div>
          <div class="model-stats">
            <span>体素 <strong id="voxelCount">0</strong></span>
            <span>已选 <strong id="selectedCount">0</strong></span>
            <span>骨骼点 <strong id="boneCount">0</strong></span>
            <span id="dirtyState">未加载</span>
          </div>
        </footer>
      </section>

      <aside class="inspector">
        <section class="panel model-panel">
          <div class="panel-heading"><div><span class="eyebrow">当前文件</span><h2 id="modelName">尚未载入模型</h2></div><span class="file-state" id="fileState">—</span></div>
          <p id="modelPath" class="subtle">请选择一个 RWR 模型 XML</p>
          <div class="quick-setting"><label for="lightingQuickSelect">场景光照</label><select id="lightingQuickSelect"><option value="soft">柔和</option><option value="standard">标准</option><option value="bright">明亮</option><option value="color">颜色校对</option></select></div>
        </section>

        <section class="panel tool-panel">
          <div class="panel-title"><h3>当前工具</h3><span class="active-tool-pill" id="activeToolLabel">选择</span></div>
          <div class="tool-tabs" aria-label="切换编辑工具">
            <button class="active" data-tool="select"><span>◇</span>选择</button><button data-tool="sculpt"><span>＋</span>雕刻</button><button data-tool="paint"><span>▧</span>绘色</button><button data-tool="picker"><span>⌁</span>取色</button><button data-tool="move"><span>✥</span>移动</button>
          </div>
          <div class="tool-mode-banner"><strong id="toolModeTitle">选择模式</strong><span id="toolModeHint">点击体素进行选择</span></div>
          <div class="color-editor" data-tool-panel="sculpt paint picker">
            <button type="button" class="color-swatch" id="colorSwatch" aria-haspopup="dialog" aria-expanded="false"><span>当前颜色</span></button>
            <div class="rgb-values readonly"><label>R <output id="redValue">115</output></label><label>G <output id="greenValue">140</output></label><label>B <output id="blueValue">69</output></label></div>
          </div>
          <div class="color-picker-popover hidden" id="colorPickerPopover" role="dialog" aria-label="颜色选择器" data-tool-panel="sculpt paint picker">
            <div class="color-picker-stage">
              <div class="hue-ring" id="hueRing"><span class="hue-handle" id="hueHandle"></span>
                <div class="color-square" id="colorSquare"><span class="color-square-handle" id="colorSquareHandle"></span></div>
              </div>
            </div>
            <div class="color-channel-list">
              <label><span>R</span><input id="redSlider" type="range" min="0" max="255" value="115"><output id="redSliderValue">115</output></label>
              <label><span>G</span><input id="greenSlider" type="range" min="0" max="255" value="140"><output id="greenSliderValue">140</output></label>
              <label><span>B</span><input id="blueSlider" type="range" min="0" max="255" value="69"><output id="blueSliderValue">69</output></label>
            </div>
          </div>
          <div class="control-row" data-tool-panel="sculpt"><label>操作模式</label><select id="sculptMode"><option value="add">左键添加 / 右键删除</option><option value="remove">左键删除 / 右键添加</option></select></div>
          <p class="context-help" id="toolHelp">单击选择体素；按住 Ctrl 可多选。</p>
        </section>

        <section class="panel selection-panel" data-tool-panel="select move">
          <div class="panel-title"><h3>选择与移动</h3><button class="text-button" id="clearSelectionBtn">清除</button></div>
          <div class="selection-summary"><strong id="selectionSummary">未选择体素</strong><span id="selectionPosition">—</span></div>
          <div class="move-layout" aria-label="移动所选体素">
            <div class="y-move"><button data-move="0,1,0" title="Y 轴正向">Y+</button><span>Y 轴</span><button data-move="0,-1,0" title="Y 轴负向">Y−</button></div>
            <div class="move-pad xz"><button class="z-minus" data-move="0,0,-1" title="Z 轴负向">Z−</button><button class="x-minus" data-move="-1,0,0" title="X 轴负向">X−</button><span class="center">X / Z</span><button class="x-plus" data-move="1,0,0" title="X 轴正向">X+</button><button class="z-plus" data-move="0,0,1" title="Z 轴正向">Z+</button></div>
          </div>
          <button class="button danger full" id="deleteSelectionBtn" disabled>删除所选体素</button>
        </section>

        <section class="panel future-panel"><span>为批量工具、镜像与插件预留</span><div class="future-grid"><i></i><i></i><i></i></div></section>

        <details class="animation-workspace" id="animationWorkspace" open>
          <summary><div><span class="workspace-icon">▶</span><strong>动画工作台</strong></div><span id="animationSummaryStatus">未载入动画</span></summary>
          <div class="animation-workspace-body">
            <section class="skeleton-workspace-section">
              <div class="panel-title"><h3>骨骼与绑定</h3><label class="switch compact"><input id="skeletonToggle" type="checkbox" checked><span></span></label></div>
              <div class="metric-grid"><div><strong id="bindingCount">0</strong><span>绑定组</span></div><div><strong id="unboundCount">0</strong><span>未绑定体素</span></div></div>
              <button class="button full" id="rebindBtn" disabled>重新绑定到最近骨骼</button>
              <p class="warning-note">保存时自动维护体素索引；重新绑定前可撤销。</p>
            </section>
            <div class="workspace-section-title"><div><strong>动画预览与编辑</strong><span>关键帧与骨骼姿势</span></div><span class="section-mark">动画</span></div>
            <div class="animation-tabs"><button class="active" data-animation-page="preview">预览</button><button data-animation-page="edit">创建与编辑</button></div>
            <section class="animation-page active" data-animation-panel="preview">
              <select id="animationSelect" disabled><option>未载入动画文件</option></select>
              <div class="timeline-controls"><button id="animationPlayBtn" disabled>▶</button><input id="animationTime" type="range" min="0" max="1000" value="0" disabled><span id="animationClock">0.00s</span></div>
              <div class="animation-option"><div><strong>体素跟随骨骼</strong><span id="animationBindingStatus">请先载入模型</span></div><label class="switch compact"><input id="animationVoxelToggle" type="checkbox" aria-label="体素跟随骨骼" checked disabled><span></span></label></div>
              <p id="animationInfo" class="animation-note">载入动画 XML 后可同步预览骨骼与体素。</p>
            </section>
            <section class="animation-page" data-animation-panel="edit">
              <div class="animation-actions"><button class="button primary" id="newAnimationBtn">新建</button><button class="button" id="duplicateAnimationBtn" disabled>复制</button><button class="button danger" id="deleteAnimationBtn" disabled>删除</button></div>
              <div class="editor-group">
                <label>动画名称<input id="animationNameInput" type="text" disabled></label>
                <div class="compact-fields"><label>总时长<input id="animationEndInput" type="number" min="0" step="0.01" disabled></label><label>速度<input id="animationSpeedInput" type="number" min="0.01" step="0.05" disabled></label><label>速度随机<input id="animationSpreadInput" type="number" min="0" step="0.01" disabled></label></div>
                <label class="checkbox-row"><input id="animationLoopInput" type="checkbox" disabled><span>循环播放</span></label>
              </div>
              <div class="editor-group">
                <div class="editor-heading"><strong>关键帧</strong><span id="keyframeCount">0 帧</span></div>
                <select id="keyframeSelect" disabled><option>没有关键帧</option></select>
                <div class="frame-actions"><button id="addKeyframeBtn" disabled>＋ 新增</button><button id="duplicateKeyframeBtn" disabled>复制</button><button id="deleteKeyframeBtn" disabled>删除</button></div>
                <label class="inline-field">帧时间（秒）<input id="keyframeTimeInput" type="number" min="0" step="0.01" disabled></label>
              </div>
              <div class="editor-group">
                <div class="editor-heading"><strong>骨骼点位置</strong><span>可在场景中点击并拖动</span></div>
                <select id="particleSelect" disabled><option>请先载入模型</option></select>
                <div class="coordinate-fields"><label>X<input id="particleXInput" type="number" step="0.1" disabled></label><label>Y<input id="particleYInput" type="number" step="0.1" disabled></label><label>Z<input id="particleZInput" type="number" step="0.1" disabled></label></div>
                <button class="button full" id="resetParticleBtn" disabled>恢复该骨骼点的模型位置</button>
              </div>
              <button class="button primary full" id="saveAnimationsBtn" disabled>导出动画 XML</button>
              <p class="animation-note">编辑会实时驱动预览，但只在导出动画 XML 时写入新文件。</p>
            </section>
          </div>
        </details>
      </aside>
    </main>

    <div class="modal-backdrop hidden" id="inputStyleModal" role="dialog" aria-modal="true" aria-labelledby="inputStyleTitle">
      <div class="input-style-dialog">
        <header><span class="eyebrow">首次使用</span><h2 id="inputStyleTitle">选择你习惯的操作风格</h2><p>这只决定左键拖动时如何旋转，不会改变工具、快捷键或模型数据。</p></header>
        <div class="input-style-options">
          <button data-input-style="view">
            <div class="style-visual keyboard-mouse" aria-hidden="true"><div class="key-cluster"><span>W</span><span>A</span><span>S</span><span>D</span></div><div class="mouse-diagram"><i></i><b>↔</b></div></div>
            <strong>键盘移动视角 + 鼠标操作</strong><span>WASD 移动，左键拖动直接改变镜头朝向</span><em>适合自由观察与快速穿行</em>
          </button>
          <button data-input-style="scene">
            <div class="style-visual mouse-only" aria-hidden="true"><div class="orbit-ring">↻</div><div class="mouse-diagram"><i></i><b>↔</b></div></div>
            <strong>纯鼠标操作</strong><span>左键拖动围绕当前场景和模型旋转</span><em>适合传统三维编辑器操作</em>
          </button>
        </div>
        <p class="input-style-note">仅影响设置中“功能 → 左键旋转模式”，可随时在设置中调整。</p>
      </div>
    </div>

    <div class="modal-backdrop hidden" id="settingsModal" role="dialog" aria-modal="true" aria-labelledby="settingsTitle">
      <div class="settings-dialog">
        <header><div><span class="eyebrow">应用内部配置</span><h2 id="settingsTitle">设置</h2></div><button class="icon-button" id="closeSettingsBtn">×</button></header>
        <div class="settings-body">
          <nav class="settings-nav"><button class="active" data-settings-page="performance">性能</button><button data-settings-page="behavior">功能</button><button data-settings-page="appearance">外观</button><button data-settings-page="shortcuts">快捷键</button><button data-settings-page="language">语言</button><button data-settings-page="about">关于</button></nav>
          <div class="settings-content">
            <section class="settings-page active" data-page="performance">
              <h3>性能</h3><p>调整渲染质量、光照与场景显示。设置立即生效并自动保存。</p>
              <div class="setting"><div><strong>性能预设</strong><small>集中调整抗锯齿、阴影和渲染倍率</small></div><select id="performancePreset"><option value="quality">高质量</option><option value="balanced">均衡（推荐）</option><option value="performance">高性能</option></select></div>
              <div class="setting"><div><strong>场景光照</strong><small>使用固定档位，不使用滑条；“颜色校对”最接近平涂效果</small></div><select id="lightingPreset"><option value="soft">柔和</option><option value="standard">标准</option><option value="bright">明亮（推荐）</option><option value="color">颜色校对</option></select></div>
              <div class="setting"><div><strong>抗锯齿</strong><small>让体素边缘更平滑</small></div><label class="switch"><input id="antialiasSetting" type="checkbox"><span></span></label></div>
              <div class="setting"><div><strong>动态阴影</strong><small>大型模型关闭后可提高帧率</small></div><label class="switch"><input id="shadowsSetting" type="checkbox"><span></span></label></div>
              <div class="setting range-setting"><div><strong>渲染倍率</strong><small id="pixelRatioValue">1.5×</small></div><input id="pixelRatioSetting" type="range" min="1" max="2" step="0.25"></div>
              <div class="setting"><div><strong>显示网格</strong><small>显示地面坐标参考</small></div><label class="switch"><input id="gridSetting" type="checkbox"><span></span></label></div>
            </section>
            <section class="settings-page" data-page="behavior">
              <h3>功能</h3><p>调整视角操作、自动恢复与编辑确认行为。</p>
              <div class="setting range-setting"><div><strong>相机移动速度</strong><small><span id="cameraSpeedValue">1.0×</span> · 按住 Shift 时 WASD 速度翻倍</small></div><input id="cameraSpeedSetting" type="range" min="0.25" max="2.5" step="0.25"></div>
              <div class="setting"><div><strong>左键旋转模式</strong><small>“视角”直接改变摄像头朝向；“场景”围绕模型旋转</small></div><select id="rotationModeSetting"><option value="view">视角（默认）</option><option value="scene">场景</option></select></div>
              <div class="setting"><div><strong>自动恢复</strong><small>在本机保存最近编辑快照</small></div><label class="switch"><input id="autosaveSetting" type="checkbox"><span></span></label></div>
              <div class="setting"><div><strong>删除前确认</strong><small>批量删除时要求确认</small></div><label class="switch"><input id="confirmDeleteSetting" type="checkbox"><span></span></label></div>
              <div class="setting"><div><strong>覆盖保存前确认</strong><small>保存并覆盖当前模型前要求勾选确认</small></div><label class="switch"><input id="confirmOverwriteSetting" type="checkbox"><span></span></label></div>
            </section>
            <section class="settings-page" data-page="appearance">
              <h3>外观</h3><p>调整应用强调色、界面亮度与尺寸。</p>
              <div class="setting"><div><strong>主题</strong><small>切换深色或浅色界面</small></div><select id="themeSetting"><option value="dark">黑色</option><option value="light">白色</option></select></div>
              <div class="setting"><div><strong>主题颜色</strong><small>用于按钮、选择框和状态提示</small></div><input id="accentSetting" type="color"></div>
              <div class="setting"><div><strong>字体大小</strong><small>独立调整文字尺寸，不改变按钮和面板比例</small></div><select id="fontSizeSetting"><option value="16">标准（16 px）</option><option value="18">大（18 px）</option><option value="20">特大（20 px）</option></select></div>
              <div class="setting range-setting"><div><strong>界面亮度</strong><small id="brightnessValue">100%</small></div><input id="brightnessSetting" type="range" min="70" max="125" step="5"></div>
              <div class="setting range-setting"><div><strong>界面缩放</strong><small id="uiScaleValue">100%</small></div><input id="uiScaleSetting" type="range" min="85" max="120" step="5"></div>
            </section>
            <section class="settings-page" data-page="shortcuts">
              <h3>快捷键设置</h3><p>单击输入框后按下新的组合键。界面中显示的快捷键会同步更新。</p>
              <div class="shortcut-list">
                <label>新建模型<input readonly data-shortcut-input="newModel"></label><label>打开模型<input readonly data-shortcut-input="openModel"></label><label>覆盖保存<input readonly data-shortcut-input="overwrite"></label><label>另存为<input readonly data-shortcut-input="saveAs"></label>
                <label>撤销<input readonly data-shortcut-input="undo"></label><label>重做<input readonly data-shortcut-input="redo"></label><label>删除体素<input readonly data-shortcut-input="deleteSelection"></label>
                <label>选择工具<input readonly data-shortcut-input="toolSelect"></label><label>雕刻工具<input readonly data-shortcut-input="toolSculpt"></label><label>绘色工具<input readonly data-shortcut-input="toolPaint"></label><label>取色工具<input readonly data-shortcut-input="toolPicker"></label><label>移动工具<input readonly data-shortcut-input="toolMove"></label>
                <label>视角前进<input readonly data-shortcut-input="cameraForward"></label><label>视角后退<input readonly data-shortcut-input="cameraBack"></label><label>视角左移<input readonly data-shortcut-input="cameraLeft"></label><label>视角右移<input readonly data-shortcut-input="cameraRight"></label>
              </div>
            </section>
            <section class="settings-page" data-page="language">
              <h3>语言</h3><p>当前版本以中文为主，界面结构已为语言包预留。</p>
              <div class="setting"><div><strong>界面语言</strong><small>切换语言将在未来版本逐步开放</small></div><select id="languageSetting"><option value="zh-CN">简体中文</option><option value="en" disabled>English（即将支持）</option></select></div>
              <div class="language-preview"><span>下一步</span><strong>可通过独立语言资源添加翻译，无需改动编辑器核心。</strong></div>
            </section>
            <section class="settings-page" data-page="about">
              <h3>关于</h3><div class="about-card"><div class="brand-mark large"><span></span><span></span><span></span></div><div><strong>RWR 体素编辑器 Next</strong><p>版本 0.6.0 · Tauri 桌面版</p></div></div>
              <p class="about-copy">RWR 体素编辑器 Next 是面向 Running With Rifles 模型制作流程的离线桌面工具，集成体素建模、骨骼绑定、动画预览与编辑，并保持对既有 XML 资源格式的兼容。所有编辑工作均在本机完成，目标是在延续原有资源工作流的同时，提供清晰、稳定且可持续扩展的现代编辑体验。</p>
            </section>
          </div>
        </div>
        <footer><button class="button" id="resetSettingsBtn">恢复默认</button><button class="button primary" id="doneSettingsBtn">完成</button></footer>
      </div>
    </div>

    <div class="modal-backdrop hidden" id="unsavedModelModal" role="dialog" aria-modal="true" aria-labelledby="unsavedModelTitle">
      <div class="decision-dialog"><header><div><span class="eyebrow">未保存修改</span><h2 id="unsavedModelTitle">新建模型前如何处理当前文件？</h2></div></header><p>当前模型包含尚未保存的修改。请选择处理方式；取消不会改变任何内容。</p><div class="decision-actions"><button class="button primary" id="saveBeforeNewBtn">保存</button><button class="button" id="saveAsBeforeNewBtn">另存为</button><button class="button danger" id="discardBeforeNewBtn">放弃修改</button><button class="button" id="cancelBeforeNewBtn">取消</button></div></div>
    </div>

    <div class="modal-backdrop hidden" id="overwriteModal" role="dialog" aria-modal="true" aria-labelledby="overwriteTitle">
      <div class="decision-dialog"><header><div><span class="eyebrow">覆盖保存</span><h2 id="overwriteTitle">确认替换当前模型文件</h2></div></header><p id="overwritePath">原文件将被当前模型内容替换，此操作无法在磁盘上撤销。</p><label class="check-control"><input id="overwriteConfirmCheck" type="checkbox"><span>我确认要覆盖当前模型文件</span></label><div class="decision-actions two"><button class="button danger" id="confirmOverwriteBtn" disabled>覆盖保存</button><button class="button" id="cancelOverwriteBtn">取消</button></div></div>
    </div>

    <input id="modelFileInput" type="file" accept=".xml,application/xml,text/xml" hidden>
    <input id="animationFileInput" type="file" accept=".xml,application/xml,text/xml" hidden>
    <div id="toastRegion" class="toast-region" aria-live="polite"></div>
  </div>
`;
