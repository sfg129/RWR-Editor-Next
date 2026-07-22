<script setup lang="ts">
const shortcuts = [
  ['newModel', '新建模型'],
  ['openModel', '打开模型'],
  ['overwrite', '覆盖保存'],
  ['saveAs', '另存为'],
  ['undo', '撤销'],
  ['redo', '重做'],
  ['deleteSelection', '删除体素'],
  ['toolSelect', '选择工具'],
  ['toolSculpt', '雕刻工具'],
  ['toolPaint', '绘色工具'],
  ['toolPicker', '取色工具'],
  ['toolMove', '移动工具'],
  ['cameraForward', '视角前进'],
  ['cameraBack', '视角后退'],
  ['cameraLeft', '视角左移'],
  ['cameraRight', '视角右移'],
] as const;
</script>

<template>
  <div
    id="settingsModal"
    class="modal-backdrop hidden"
    role="dialog"
    aria-modal="true"
    aria-labelledby="settingsTitle"
  >
    <div class="settings-dialog">
      <header>
        <div>
          <span class="eyebrow">SYSTEM CONFIGURATION</span>
          <h2 id="settingsTitle">设置</h2>
        </div>
        <button id="closeSettingsBtn" class="icon-button">×</button>
      </header>
      <div class="settings-body">
        <nav class="settings-nav">
          <button class="active" data-settings-page="performance">性能</button
          ><button data-settings-page="behavior">功能</button
          ><button data-settings-page="appearance">外观</button
          ><button data-settings-page="shortcuts">快捷键</button
          ><button data-settings-page="language">语言</button><button data-settings-page="about">关于</button>
        </nav>
        <div class="settings-content">
          <section class="settings-page active" data-page="performance">
            <h3>性能</h3>
            <p>调整渲染质量、光照与场景显示。设置立即生效并自动保存。</p>
            <div class="setting">
              <div><strong>性能预设</strong><small>集中调整抗锯齿、阴影和渲染倍率</small></div>
              <select id="performancePreset">
                <option value="quality">高质量</option>
                <option value="balanced">均衡（推荐）</option>
                <option value="performance">高性能</option>
              </select>
            </div>
            <div class="setting">
              <div><strong>场景光照</strong><small>固定档位；颜色校对最接近平涂效果</small></div>
              <select id="lightingPreset">
                <option value="soft">柔和</option>
                <option value="standard">标准</option>
                <option value="bright">明亮（推荐）</option>
                <option value="color">颜色校对</option>
              </select>
            </div>
            <div class="setting">
              <div><strong>抗锯齿</strong><small>让体素边缘更平滑</small></div>
              <label class="switch"><input id="antialiasSetting" type="checkbox" /><span /></label>
            </div>
            <div class="setting">
              <div><strong>动态阴影</strong><small>大型模型关闭后可提高帧率</small></div>
              <label class="switch"><input id="shadowsSetting" type="checkbox" /><span /></label>
            </div>
            <div class="setting range-setting">
              <div><strong>渲染倍率</strong><small id="pixelRatioValue">1.5×</small></div>
              <input id="pixelRatioSetting" type="range" min="1" max="2" step="0.25" />
            </div>
            <div class="setting">
              <div><strong>显示网格</strong><small>显示地面坐标参考</small></div>
              <label class="switch"><input id="gridSetting" type="checkbox" /><span /></label>
            </div>
          </section>
          <section class="settings-page" data-page="behavior">
            <h3>功能</h3>
            <p>调整视角操作、自动恢复与编辑确认行为。</p>
            <div class="setting range-setting">
              <div>
                <strong>相机移动速度</strong
                ><small><span id="cameraSpeedValue">1.0×</span> · Shift 双倍速度</small>
              </div>
              <input id="cameraSpeedSetting" type="range" min="0.25" max="2.5" step="0.25" />
            </div>
            <div class="setting">
              <div><strong>左键旋转模式</strong><small>视角直接改变摄像头；场景围绕模型旋转</small></div>
              <select id="rotationModeSetting">
                <option value="view">视角（默认）</option>
                <option value="scene">场景</option>
              </select>
            </div>
            <div class="setting">
              <div><strong>自动恢复</strong><small>在本机保存最近编辑快照</small></div>
              <label class="switch"><input id="autosaveSetting" type="checkbox" /><span /></label>
            </div>
            <div class="setting">
              <div><strong>删除前确认</strong><small>批量删除时要求确认</small></div>
              <label class="switch"><input id="confirmDeleteSetting" type="checkbox" /><span /></label>
            </div>
            <div class="setting">
              <div><strong>覆盖保存前确认</strong><small>覆盖当前模型前要求勾选确认</small></div>
              <label class="switch"><input id="confirmOverwriteSetting" type="checkbox" /><span /></label>
            </div>
          </section>
          <section class="settings-page" data-page="appearance">
            <h3>外观</h3>
            <p>双色工业界面支持深浅主题和单一强调色。</p>
            <div class="setting">
              <div><strong>主题</strong><small>切换深色或浅色界面</small></div>
              <select id="themeSetting">
                <option value="dark">黑色</option>
                <option value="light">白色</option>
              </select>
            </div>
            <div class="setting">
              <div><strong>主题颜色</strong><small>用于按钮、选择框和状态提示</small></div>
              <input id="accentSetting" type="color" />
            </div>
            <div class="setting">
              <div><strong>字体大小</strong><small>独立调整文字尺寸</small></div>
              <select id="fontSizeSetting">
                <option value="16">标准（16 px）</option>
                <option value="18">大（18 px）</option>
                <option value="20">特大（20 px）</option>
              </select>
            </div>
            <div class="setting range-setting">
              <div><strong>界面亮度</strong><small id="brightnessValue">100%</small></div>
              <input id="brightnessSetting" type="range" min="70" max="125" step="5" />
            </div>
            <div class="setting range-setting">
              <div><strong>界面缩放</strong><small id="uiScaleValue">100%</small></div>
              <input id="uiScaleSetting" type="range" min="85" max="120" step="5" />
            </div>
          </section>
          <section class="settings-page" data-page="shortcuts">
            <h3>快捷键设置</h3>
            <p>聚焦输入框后按下新的组合键，所有提示同步更新。</p>
            <div class="shortcut-list">
              <label v-for="shortcut in shortcuts" :key="shortcut[0]"
                >{{ shortcut[1] }}<input readonly :data-shortcut-input="shortcut[0]"
              /></label>
            </div>
          </section>
          <section class="settings-page" data-page="language">
            <h3>语言</h3>
            <p>界面结构已为独立语言资源预留。</p>
            <div class="setting">
              <div><strong>界面语言</strong><small>后续可添加语言包而不改动核心</small></div>
              <select id="languageSetting">
                <option value="zh-CN">简体中文</option>
                <option value="en" disabled>English（即将支持）</option>
              </select>
            </div>
            <div class="language-preview">
              <span>NEXT</span><strong>语言资源与编辑器领域逻辑完全分离。</strong>
            </div>
          </section>
          <section class="settings-page" data-page="about">
            <h3>关于</h3>
            <div class="about-card">
              <div class="brand-mark large"><span /><span /><span /></div>
              <div>
                <strong>RWR 体素编辑器 Next</strong>
                <p>版本 0.6.0 · Vue 3 + Tauri 2</p>
              </div>
            </div>
            <p class="about-copy">
              面向 Running With Rifles
              资源工作流的离线体素、骨骼与动画编辑器。解析、编辑和保存均在本机完成，并以原版 XML
              行为为兼容基准。
            </p>
          </section>
        </div>
      </div>
      <footer>
        <button id="resetSettingsBtn" class="button">恢复默认</button
        ><button id="doneSettingsBtn" class="button primary">完成</button>
      </footer>
    </div>
  </div>
</template>
