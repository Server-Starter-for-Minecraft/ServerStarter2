import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['**/*.test.ts'],
    includeSource: ['{src,src-electron,src-public,test}/**/*.ts'],
    globals: true,
    coverage: {
      // BunはJavaScriptCoreで動作しV8のカバレッジを取得できないため，
      // 実行環境に依存しないistanbul(コードを事前に計測用へ変換する方式)を使用する
      provider: 'istanbul',
      // you can include other reporters, but 'json-summary' is required, json is recommended
      reporter: ['text', 'json-summary', 'json'],
      // If you want a coverage reports even if your tests are failing, include the reportOnFailure option
      reportOnFailure: true,
      // target is only backend source files
      // (Vitest 4以降は拡張子での絞り込みが無くなったため，テストが生成するjson等を含めないよう明示する)
      include: ['src-electron/**/*.ts'],
      // removed no test files
      exclude: [
        'src-electron/*.ts',
        '**/*.d.ts',
        '**/work/**',
        '**/node_modules/**',
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
      'app/': `${import.meta.dirname}/`,
      'src-electron/': `${import.meta.dirname}/src-electron/`,
    },
  },
});
