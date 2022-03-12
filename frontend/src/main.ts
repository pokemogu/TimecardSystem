import { createApp } from 'vue';
import { createPinia } from 'pinia';

import App from './App.vue';
import router from './router';

import { provide, inject } from 'vue';
import type { TimecardSession } from './timecard-session-interface';

import 'bootstrap';
import "bootstrap/dist/css/bootstrap.min.css";

import VueQrcodeReader from 'qrcode-reader-vue3';

const app = createApp(App);

app.use(createPinia());
app.use(router);
app.use(VueQrcodeReader);

if (import.meta.env.DEV && !import.meta.env.VITE_DUMMP_API) {
  import('./mocks/browser').then((msw) => {
    msw.worker.start({
      onUnhandledRequest: 'bypass'
    });
  });
}

app.mount('#app');
