import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vuetify from 'vite-plugin-vuetify';

export default defineConfig({
  base: '/coding/',
  plugins: [vue(), vuetify({ autoImport: true })],
  server: {
    port: 5041,
    proxy: {
      '/api': {
        target: 'http://localhost:5040',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:5040',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:5040',
        changeOrigin: true,
        ws: true,
      },
    },
  },
});
