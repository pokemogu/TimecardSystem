import { createApp } from 'vue';
import { createPinia } from 'pinia';
import piniaPersist from 'pinia-plugin-persist';

import VueLoading from 'vue-loading-overlay';
import 'vue-loading-overlay/dist/vue-loading.css';

import App from './App.vue';
import router from './router';

import 'bootstrap';
import "bootstrap/dist/css/bootstrap.min.css";

/*
if (process.env.VITE_MOCK_API === 'true' || import.meta.env.VITE_MOCK_API === true) {
  const { worker } = require('./mocks/browser')
  worker.start()
}
*/

const app = createApp(App);
const pinia = createPinia();
pinia.use(piniaPersist);

app.use(pinia);
app.use(router);
app.use(VueLoading);
app.mount('#app');
