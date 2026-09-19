import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return { plugins: [react(), tailwindcss()], resolve: { alias: { '@': fileURLToPath(new URL('./app', import.meta.url)) } }, server: { port: 5173, strictPort: true, proxy: { '/api': { target: env.API_PROXY_TARGET || 'http://127.0.0.1:18000', changeOrigin: false } } } };
});
