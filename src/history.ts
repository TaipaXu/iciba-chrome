import { createApp } from 'vue';
import App from './history.vue';
import { createIcibaVuetify } from '@/plugins/vuetify';

const app = createApp(App);
app.use(createIcibaVuetify());
app.mount('#app');
