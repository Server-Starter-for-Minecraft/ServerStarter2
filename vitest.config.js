import { defineConfig } from 'vitest/config';

// Electron 44以降の`electron`パッケージは，import時に実行ファイルが無いとその場でダウンロードを始める
// (Bunはelectronのpostinstallを実行しないため，CIでは毎回ダウンロードが走る)．
// 複数のワーカーが同時にダウンロード・展開して衝突し，テストが不規則に落ちるため，
// テストでは`ELECTRON_OVERRIDE_DIST_PATH`を指定してダウンロードさせない．
// (ダウンロードを抑止するための値であり，指定先に実行ファイルが実在する必要はない)
// (テストはNode.js上で動くため，`electron`のimport結果が実行ファイルのパス文字列であることは変わらない)
process.env.ELECTRON_OVERRIDE_DIST_PATH ??= `${import.meta.dirname}/src-electron/node_modules/electron/dist`;

export default defineConfig({
  test: {
    include: ['**/*.test.ts'],
    includeSource: ['{src,src-electron,src-public,test}/**/*.ts'],
    globals: true,
    // VITEST_BLOCK_NETWORK=1 のとき，ローカル以外への通信を禁止する(詳細はファイル内のコメントを参照)
    setupFiles: ['test/setup/blockNetwork.ts'],
    // 外部サービス(Mojang・PaperMC・Forge等)に実際にアクセスするテストは`network`タグを付ける．
    // PRのCIでは`network`タグ以外のテストを通信遮断状態で実行し(必須)，
    // `network`タグのテストは別ジョブで再試行付きで実行する(外部APIの仕様変更の検知用)．
    // 詳細は test/readme.md を参照
    tags: [
      {
        name: 'network',
        description: '外部サービスに実際にアクセスするテスト',
        timeout: 60 * 1000,
        // 一時的な通信失敗は再試行で吸収する．
        // 外部APIの仕様変更などの恒常的な失敗は，再試行しても失敗し続けるため検知できる
        retry: { count: 2, delay: 10 * 1000 },
      },
    ],
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
        '**/*.fixtures.ts',
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
