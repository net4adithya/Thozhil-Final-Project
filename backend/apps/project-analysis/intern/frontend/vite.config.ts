import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5032,
    proxy: {
      '/api': {
        target: 'http://localhost:5030',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      '/preview': {
        target: 'http://localhost:5030',
        changeOrigin: true,
      },
      '/review': {
        target: 'http://localhost:5030',
        changeOrigin: true,
      }
    }
  }
})
