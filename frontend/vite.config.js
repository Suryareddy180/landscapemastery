import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    'process.env.REACT_APP_BACKEND_URL': JSON.stringify('http://localhost:8000')
  },
  server: {
    port: 3000,
    open: false,
    proxy: {
      '/media': {
        target: 'http://localhost:8000',
        changeOrigin: true
      },
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true
      }
    }
  }
});
