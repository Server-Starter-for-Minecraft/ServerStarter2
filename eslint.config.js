import pluginQuasar from '@quasar/app-vite/eslint';
import prettierConfig from 'eslint-config-prettier';
import { createTypeScriptImportResolver } from 'eslint-import-resolver-typescript';
import pluginImportX from 'eslint-plugin-import-x';
import pluginVue from 'eslint-plugin-vue';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import {
  ALLOWED_SYNC_EXPORTS,
  BACKEND_FILES,
  BLOCKING_MODULES,
  SCRIPT_FILES,
  SOURCE_FILES,
  TEST_FILES,
} from './eslint-rules/config.js';
import pluginServerStarter from './eslint-rules/index.js';

export default tseslint.config(
  pluginQuasar.configs.recommended(),

  {
    ignores: [
      '**/node_modules/**',
      'coverage/**',
      'dist/**',
      '.quasar/**',
      'userData/**',
      '**/work/**',
      '__mocks__/**',
      'src/assets/assets.ts',
      '*.config.js',
      '*.config.ts',
      // 独自ルールのテストで解析させるための置き場所（中身はテストごとに差し替えられる）
      'eslint-rules/fixtures/**',
    ],
  },

  {
    linterOptions: {
      // ソースコード内のコメント（`eslint-disable` など）による設定の変更を禁止する
      // 例外はこのファイルと `eslint-suppressions.json` にのみ記述し，CI とレビューで増加を検出する
      // （無視されたコメントは警告となり，`--max-warnings 0` で CI が失敗する）
      noInlineConfig: true,
      reportUnusedDisableDirectives: 'error',
    },
    plugins: {
      serverstarter: pluginServerStarter,
    },
  },

  // https://github.com/typescript-eslint/typescript-eslint/tree/main/packages/eslint-plugin#usage
  // ESLint typescript rules
  tseslint.configs.recommended,

  // See https://eslint.vuejs.org/rules/#available-rules
  pluginVue.configs['flat/essential'], // Priority A: Essential (Error Prevention)

  // https://github.com/prettier/eslint-config-prettier#installation
  // usage with Prettier, provided by 'eslint-config-prettier'.
  prettierConfig,

  {
    files: ['**/*.ts', '**/*.vue'],
    languageOptions: {
      parserOptions: {
        // https://eslint.vuejs.org/user-guide/#how-to-use-a-custom-parser
        parser: tseslint.parser,
        extraFileExtensions: ['.vue'],
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Require switch-case statements to be exhaustive (requires type information)
      '@typescript-eslint/switch-exhaustiveness-check': [
        'error',
        { considerDefaultExhaustiveForUnions: true },
      ],

      // ---- 非同期処理（失敗の見落としやフリーズを防ぐ） ----
      // 待たれない Promise を禁止する（`void` で捨てることも，失敗を処理していないため禁止する）
      // 完了を待たずに実行する場合は，失敗をログに出す `runDetached` を使う
      '@typescript-eslint/no-floating-promises': [
        'error',
        {
          ignoreVoid: false,
          allowForKnownSafeCalls: [
            {
              from: 'file',
              name: 'runDetached',
              path: 'src-public/scripts/promise/runDetached.ts',
            },
          ],
        },
      ],
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',
      // 操作用のメソッドを付け足した Promise（`decoratePromise` などで作る）は，async にすると
      // 新しい Promise に包まれてメソッドが失われるため，これらの型を返す関数は対象外とする
      '@typescript-eslint/promise-function-async': [
        'error',
        {
          allowedPromiseNames: [
            'ChildProcessPromise',
            'ServerProcess',
            'RunServer',
            'RunRebootableServer',
          ],
        },
      ],
      // try の中で await せずに Promise を返すと，失敗が catch で捕まらないため禁止する
      '@typescript-eslint/return-await': ['error', 'in-try-catch'],
      'no-async-promise-executor': 'error',
    },
  },

  // メインプロセスを止める同期 API の呼び出しを禁止する
  // （テストはメインプロセスで動かないため対象外とする）
  {
    files: [...BACKEND_FILES, ...SCRIPT_FILES],
    ignores: [
      ...TEST_FILES,
      // 例外：起動時に一度だけ，log4js が latest.log を上書きする前に同期で退避する必要がある（画面の表示前で操作を止めない）
      'src-electron/common/logger.ts',
      // 例外：起動時に一度だけ，Linux のディストリビューションを判定して定数（osPlatform）を決める（画面の表示前で操作を止めない）
      'src-electron/util/os/os.ts',
    ],
    rules: {
      'serverstarter/no-blocking-call': [
        'error',
        { blockingModules: BLOCKING_MODULES },
      ],
    },
  },

  // バックエンドの処理（source/）が公開する関数・メソッドは Promise を返す（非同期にする）
  // （ログ・進捗・IPC・ライフサイクルなどの基盤や util は対象外とする。
  //   それらでのブロッキングする I/O は no-blocking-call で，非同期処理の放置は no-floating-promises で検出する）
  {
    files: SOURCE_FILES,
    ignores: [...TEST_FILES],
    rules: {
      'serverstarter/require-async-export': [
        'error',
        { allowed: ALLOWED_SYNC_EXPORTS },
      ],
    },
  },

  {
    plugins: {
      'import-x': pluginImportX,
    },

    settings: {
      'import-x/resolver-next': [createTypeScriptImportResolver()],
    },

    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',

      globals: {
        ...globals.browser,
        ...globals.node,
        ga: 'readonly', // Google Analytics
        cordova: 'readonly',
        __statics: 'readonly',
        __QUASAR_SSR__: 'readonly',
        __QUASAR_SSR_SERVER__: 'readonly',
        __QUASAR_SSR_CLIENT__: 'readonly',
        __QUASAR_SSR_PWA__: 'readonly',
        process: 'readonly',
        Capacitor: 'readonly',
        chrome: 'readonly',
      },
    },

    // add your custom rules here
    rules: {
      'prefer-promise-reject-errors': 'off',
      'prefer-template': 'error',

      quotes: ['warn', 'single', { avoidEscape: true }],

      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-unused-vars': 'off',

      // this rule, if on, would require explicit return type on the `render` function
      '@typescript-eslint/explicit-function-return-type': 'off',

      // in plain CommonJS modules, you can't use `import foo = require('foo')` to pass this rule, so it has to be disabled
      '@typescript-eslint/no-require-imports': 'off',

      '@typescript-eslint/no-explicit-any': 'off',

      // The core 'no-unused-vars' rules (in the eslint:recommended ruleset)
      // does not work with type definitions
      'no-unused-vars': 'off',

      // allow debugger during development only
      'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',

      '@typescript-eslint/no-unused-expressions': [
        'error',
        { allowShortCircuit: true, allowTernary: true },
      ],

      'import-x/no-restricted-paths': [
        'error',
        {
          zones: [
            {
              from: './src/**/*',
              target: './src-electron/**/*',
            },
            {
              from: './src-electron/!(schema|api)/**/*',
              target: './src/**/*',
            },
          ],
        },
      ],
    },
  }
);
