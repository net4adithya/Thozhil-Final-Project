import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  base: '/coding-candidate/',
  plugins: [vue()],
  server: {
    port: 5042,
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
