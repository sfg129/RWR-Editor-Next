import { createApp, nextTick } from 'vue';
import App from './App.vue';
import { applySettingsToDocument, loadSettings } from './config/settings';
import { initializeLocalization } from './i18n/runtime';
import { initializeWindowState } from './platform/window-state';
import './styles/index.css';

void initializeWindowState();
const initialSettings = loadSettings();
applySettingsToDocument(initialSettings);
initializeLocalization(initialSettings.language);
createApp(App).mount('#app');

void nextTick(async () => {
  await import('./editor/controller');
});
