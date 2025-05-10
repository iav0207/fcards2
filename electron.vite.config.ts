import { defineConfig } from 'vite';
import { resolve } from 'path';

// Config for Electron main process
export default defineConfig({
  build: {
    outDir: 'dist-electron/main',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/main/main.ts'),
      },
      output: {
        entryFileNames: '[name].js',
      },
    },
  },
  resolve: {
    alias: {
      './': resolve(__dirname, './src'),
    },
  },
});