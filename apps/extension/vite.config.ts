import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const extensionRoot = resolve(fileURLToPath(new URL('.', import.meta.url)));

export default defineConfig({
  plugins: [react()],
  publicDir: resolve(extensionRoot, 'public'),
  build: {
    target: 'chrome116',
    outDir: resolve(process.cwd(), 'dist'),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(extensionRoot, 'src/popup/index.html'),
        options: resolve(extensionRoot, 'src/options/index.html'),
        offscreen: resolve(extensionRoot, 'src/offscreen/index.html'),
        background: resolve(extensionRoot, 'src/background/index.ts'),
        content: resolve(extensionRoot, 'src/content/index.ts'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
});
