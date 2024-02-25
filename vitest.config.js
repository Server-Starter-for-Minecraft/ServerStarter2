/// <reference types="vitest" />
import { defineConfig } from 'vite';

export default defineConfig({
  test: {
    globals: true,
  },
  resolve: {
    alias: {
      'app/': __dirname + '/',
      'src-electron/': __dirname + '/src-electron/',
    },
  },
});
