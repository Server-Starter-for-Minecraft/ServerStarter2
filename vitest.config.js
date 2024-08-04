/// <reference types="vitest" />
import { defineConfig } from 'vite';

export default defineConfig({
  test: {
    include: ['**/*.test.ts'],
    includeSource: ['**/*.ts'],
    globals: true,
    coverage: {
      // you can include other reporters, but 'json-summary' is required, json is recommended
      reporter: ['text', 'json-summary', 'json'],
      // If you want a coverage reports even if your tests are failing, include the reportOnFailure option
      reportOnFailure: true,
      // target is only backend files
      include: ['**/src-electron/**'],
    },
  },
  resolve: {
    alias: {
      'app/': __dirname + '/',
      'src-electron/': __dirname + '/src-electron/',
    },
  },
});
