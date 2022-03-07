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

/*
app.component('logout', {
  setup: function () {
    const session = inject<TimecardSession>('session');
    if (session) {
      session.refreshToken = null;
      session.userId = null;
      session.userName = null;
    
      provide('session', null);
    }
    
    const router = useRouter();
  }
});
*/

app.use(createPinia());
app.use(router);
app.use(VueQrcodeReader);

app.mount('#app');
