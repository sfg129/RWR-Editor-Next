<script setup lang="ts">
import { isTauriRuntime, openExternalUrl } from '../platform/external-links';
import LanguageSelect from './LanguageSelect.vue';
import { orderedShortcuts } from '../core/editor/shortcuts';
import { loadSettings } from '../config/settings';

const repositoryUrl = 'https://github.com/sfg129/RWR-Editor-Next';
function handleRepositoryClick(event: MouseEvent): void {
  if (!isTauriRuntime()) return;
  event.preventDefault();
  void openExternalUrl(repositoryUrl).catch((error: unknown) =>
    console.warn('Unable to open the repository URL.', error),
  );
}
const shortcuts = orderedShortcuts(loadSettings().shortcuts);
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
            <div class="setting"><strong>界面语言</strong><LanguageSelect id="languageSetting" /></div>
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
            <div class="shortcut-reset-row"><button id="resetShortcutsBtn" class="button">恢复默认</button></div>
            <div class="shortcut-list">
              <div v-for="shortcut in shortcuts" :key="shortcut[0]" class="shortcut-row" :data-shortcut-row="shortcut[0]"><span>{{ shortcut[1] }}</span><div class="shortcut-slots"><span v-for="slot in [0, 1]" :key="slot" class="shortcut-slot"><input readonly data-no-localize :aria-label="shortcut[1]" :data-shortcut-input="shortcut[0]" :data-shortcut-slot="slot" /><button type="button" class="shortcut-clear" aria-label="清除" :data-shortcut-clear="shortcut[0]" :data-shortcut-slot="slot">×</button></span></div></div>
            </div>
          </section>
          <section class="settings-page" data-page="about">
            <div class="about-card">
              <div class="brand-mark large"><span /><span /><span /></div>
              <div>
                <strong>RWR 体素编辑器 Next</strong>
                <p>版本 0.8.4</p>
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
        <button id="doneSettingsBtn" class="button primary">完成</button>
      </footer>
    </div>
  </div>
</template>
