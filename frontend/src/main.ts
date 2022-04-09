import { createApp } from 'vue';
import { createPinia } from 'pinia';
import piniaPersist from 'pinia-plugin-persist';

import App from './App.vue';
import router from './router';

import 'bootstrap';
import "bootstrap/dist/css/bootstrap.min.css";

const app = createApp(App);
const pinia = createPinia();
pinia.use(piniaPersist);

app.use(pinia);
app.use(router);

if (import.meta.env.DEV && import.meta.env.VITE_MOCK_API && import.meta.env.VITE_MOCK_API === true) {
  console.log('MOCKING API');
  import('./mocks/browser').then((msw) => {
    msw.worker.start({
      onUnhandledRequest: 'bypass'
    });
  });
}
else {
  console.log('REAL API');
}

app.mount('#app');
