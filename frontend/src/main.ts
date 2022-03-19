import { createApp } from 'vue';
import { createPinia } from 'pinia';
import piniaPersist from 'pinia-plugin-persist';

import App from './App.vue';
import router from './router';

import { provide, inject } from 'vue';
import type { TimecardSession } from './timecard-session-interface';

import 'bootstrap';
import "bootstrap/dist/css/bootstrap.min.css";

import VueQrcodeReader from 'qrcode-reader-vue3';

const app = createApp(App);
const pinia = createPinia();
pinia.use(piniaPersist);

app.use(pinia);
app.use(router);
app.use(VueQrcodeReader);

if (import.meta.env.DEV && import.meta.env.VITE_MOCK_API) {
  import('./mocks/browser').then((msw) => {
    msw.worker.start({
      onUnhandledRequest: 'bypass'
    });
  });
}

app.mount('#app');
