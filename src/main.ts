import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import './assets/main.css';

// Inisialisasi Bootstrap JS bundle jika diperlukan untuk modal / dropdown
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

const app = createApp(App);
app.use(router);
app.mount('#app');
