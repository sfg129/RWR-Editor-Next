<script setup lang="ts">
import { isTauriRuntime, openExternalUrl } from '../platform/external-links';

const repositoryUrl = 'https://github.com/sfg129/RWR-Editor-Next';
function handleRepositoryClick(event: MouseEvent): void {
  if (!isTauriRuntime()) return;
  event.preventDefault();
  void openExternalUrl(repositoryUrl).catch((error: unknown) =>
    console.warn('Unable to open the repository URL.', error),
  );
}
const shortcuts = [
  ['newModel', '新建模型'],
  ['openModel', '打开模型'],
  ['overwrite', '覆盖保存'],
  ['saveAs', '另存为'],
  ['undo', '撤销'],
  ['redo', '重做'],
  ['deleteSelection', '删除体素'],
  ['toolSelect', '选择工具'],
  ['toolSculpt', '修改工具'],
  ['toolPaint', '绘色工具'],
  ['marqueeThrough', '穿透框选'],
  ['marqueeVisible', '可视框选'],
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
        <h2 id="settingsTitle">设置</h2>
        <button id="closeSettingsBtn" class="icon-button">×</button>
      </header>
      <div class="settings-body">
        <nav class="settings-nav">
          <button class="active" data-settings-page="settings">设置</button>
          <button data-settings-page="shortcuts">快捷键</button>
          <button data-settings-page="about">关于</button>
        </nav>
        <div class="settings-content">
          <section class="settings-page active" data-page="settings">
            <div class="setting">
              <strong>界面语言</strong
              ><select id="languageSetting" aria-label="界面语言">
                <option value="zh-CN">简体中文</option>
                <option value="en">English</option>
              </select>
            </div>
            <div class="setting">
              <strong>主题</strong
              ><select id="themeSetting" aria-label="主题">
                <option value="dark">深色</option>
                <option value="light">浅色</option>
              </select>
            </div>
            <div class="setting">
              <strong>主题颜色</strong><input id="accentSetting" type="color" aria-label="主题颜色" />
            </div>
            <div class="setting range-setting">
              <div><strong>字体大小</strong><output id="fontSizeValue">16 px</output></div>
              <input
                id="fontSizeSetting"
                type="range"
                min="12"
                max="20"
                step="1"
                value="16"
                aria-label="字体大小"
              />
            </div>
            <div class="setting range-setting">
              <div><strong>界面缩放</strong><output id="uiScaleValue">100%</output></div>
              <input id="uiScaleSetting" type="range" min="85" max="120" step="5" aria-label="界面缩放" />
            </div>
          </section>
          <section class="settings-page" data-page="shortcuts">
            <div class="shortcut-list">
              <label v-for="shortcut in shortcuts" :key="shortcut[0]"
                >{{ shortcut[1] }}<input readonly :data-shortcut-input="shortcut[0]"
              /></label>
            </div>
          </section>
          <section class="settings-page" data-page="about">
            <div class="about-card">
              <div class="brand-mark large"><span /><span /><span /></div>
              <div>
                <strong>RWR 体素编辑器 Next</strong>
                <p>版本 0.8</p>
              </div>
            </div>
            <a
              class="button about-repository-link"
              :href="repositoryUrl"
              target="_blank"
              rel="noopener noreferrer"
              @click="handleRepositoryClick"
              >访问 GitHub 仓库</a
            >
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
