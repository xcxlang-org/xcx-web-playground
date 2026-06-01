import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import viteCompression from 'vite-plugin-compression';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [
    vue(),
    viteCompression({ algorithm: 'gzip' })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      'xcx-interpreter/browser': fileURLToPath(new URL('../interpreter/src/run.ts', import.meta.url)),
    },
  },
  server: {
    port: 3000,
    open: true,
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
    }
  },
  build: {
    target: 'esnext',
    minify: 'terser',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.indexOf('node_modules') !== -1) {
            if (id.indexOf('@codemirror') !== -1 || id.indexOf('@lezer') !== -1 || id.indexOf('@replit') !== -1) {
              return 'codemirror';
            }
            if (id.indexOf('vue') !== -1) {
              return 'vue';
            }
          }
        }
      }
    }
  },
});