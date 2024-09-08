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
      // removed no test files
      exclude: [
        'src-electron/*.ts',
        '**/schema/**',
        '**/api/**',
        '**/dummy/**',
      ],
      // set limit ratio
      // thresholds: {
      //   lines: 60,
      //   branches: 60,
      //   functions: 60,
      //   statements: 60,
      // },
    },
  },
  resolve: {
    alias: {
      'app/': __dirname + '/',
      'src-electron/': __dirname + '/src-electron/',
    },
  },
});
