import { createApp, nextTick } from 'vue';
import App from './App.vue';
import './styles/index.css';

createApp(App).mount('#app');

void nextTick(async () => {
  await import('./editor/controller');
});
