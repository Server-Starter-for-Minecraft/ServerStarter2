/// <reference types="vitest" />
import { defineConfig } from 'vite';

export default defineConfig({
  test: {
    include: ['**/*.test.ts'],
    includeSource: ['**/*.ts'],
    globals: true,
  },
  resolve: {
    alias: {
      'app/': __dirname + '/',
      'src-electron/': __dirname + '/src-electron/',
    },
  },
});
