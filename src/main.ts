import { createApp, nextTick } from 'vue';
import App from './App.vue';
import { loadSettings } from './config/settings';
import { initializeLocalization } from './i18n/runtime';
import { initializeWindowState } from './platform/window-state';
import './styles/index.css';

void initializeWindowState();
initializeLocalization(loadSettings().language);
createApp(App).mount('#app');

void nextTick(async () => {
  await import('./editor/controller');
});
