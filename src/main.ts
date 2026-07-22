import { createApp, nextTick } from 'vue';
import App from './App.vue';
import { loadSettings } from './config/settings';
import { initializeLocalization } from './i18n/runtime';
import './styles/index.css';

initializeLocalization(loadSettings().language);
createApp(App).mount('#app');

void nextTick(async () => {
  await import('./editor/controller');
});
