import pluginQuasar from '@quasar/app-vite/eslint';
import pluginVitest from '@vitest/eslint-plugin';
import prettierConfig from 'eslint-config-prettier';
import { createTypeScriptImportResolver } from 'eslint-import-resolver-typescript';
import pluginImportX from 'eslint-plugin-import-x';
import pluginVue from 'eslint-plugin-vue';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import {
  ALLOWED_EXTERNAL_PACKAGES,
  BACKEND_FILES,
  BACKEND_LAYERS,
  BLOCKING_MODULES,
  ERROR_GUARDS,
  EXCEPTION_CONVERTERS,
  FAILABLE_HANDLERS,
  FRONTEND_FILES,
  FRONTEND_LAYERS,
  LINT_EXCEPTIONS,
  MOCKABLE_BOUNDARIES,
  RESTRICTED_BUILTIN_MODULES,
  RESTRICTED_LAYER_IMPORTS,
  restrictedPackagePattern,
  SCRIPT_FILES,
  SHARED_FILES,
  TEST_FILES,
  THROWING_APIS,
} from './eslint-rules/config.js';
import pluginServerStarter from './eslint-rules/index.js';
import { applyExceptions } from './eslint-rules/utils/exceptions.js';

/**
 * Node.js の組み込みモジュール・外部パッケージを直接使ってよい（util の迂回の制限の対象外とする）ファイル
 *
 * 組み込みモジュールの静的な import と動的な import の制限で同じ対象外のファイルを使う。
 * 個別のファイルの例外は，ファイルごとに許可するモジュールを eslint-rules/config.js の MODULE_IMPORT_EXCEPTIONS に登録する
 */
const MODULE_RESTRICTION_IGNORES = [
  'src-electron/util/**',
  // テストは外部の境界（ファイル操作など）を用意・差し替えるために直接扱う
  ...TEST_FILES,
];

/**
 * 構文の制限（no-restricted-syntax）の共通の設定
 *
 * no-restricted-syntax は後の設定で上書きされるため，ファイルによって制限を追加する場合もこの一覧を含める
 */
const RESTRICTED_SYNTAX = [
  // エラーの判定は isError / isValid に統一する（`x.type === 'error'` の手書きを禁止する）
  {
    selector:
      "BinaryExpression[operator=/^[!=]==?$/][right.value='error'][left.property.name='type']",
    message: 'エラーの判定は isError / isValid を使ってください',
  },
  // テストで内部の呼び出し順序・呼び出しの記録を検証すると，実装の内部構造に依存したテストになる
  {
    selector:
      'CallExpression[callee.property.name=/^(toHaveBeenNthCalledWith|nthCalledWith)$/]',
    message:
      '内部の呼び出し順序を検証せず，処理の結果（戻り値・作成されたファイルなど）を検証してください',
  },
  {
    selector:
      "MemberExpression[object.property.name='mock'][property.name='calls']",
    message:
      'モックの呼び出しの記録を直接参照せず，処理の結果（戻り値・作成されたファイルなど）を検証してください',
  },
  // in-source テストでテストの関数を取り出すと，vitest のルール（skip・focus の残存など）が
  // テストの関数と認識できず検査されないため，グローバルの describe / test / expect / vi を使う
  {
    selector:
      "VariableDeclarator[init.object.type='MetaProperty'][init.property.name='vitest']",
    message:
      'import.meta.vitest からテストの関数を取り出さず，グローバルの describe / test / expect / vi を使ってください',
  },
];

/**
 * 層の定義から，import を禁止する組（import-x/no-restricted-paths の zones）を作る
 *
 * 各層は，`allowed` に書いた層と自身の層以外を import できない
 *
 * @param {import('./eslint-rules/config.js').Layer[]} layers 層の一覧
 * @returns 禁止する import の組
 */
function layerZones(layers) {
  return layers.flatMap((target) => {
    if (target.allowed.includes('*')) return [];
    return layers
      .filter((from) => from !== target && !target.allowed.includes(from.name))
      .map((from) => ({
        target: target.files.map((f) => `./${f}`),
        from: from.files.map((f) => `./${f}`),
        message: `${target.name}（${target.description}）から ${from.name}（${from.description}）は import できません。層構造は eslint-rules/config.js を参照してください`,
      }));
  });
}

/** 例外を適用する前の lint の設定 */
const baseConfig = tseslint.config(
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
    // 例外は eslint-rules/config.js の BLOCKING_CALL_EXCEPTIONS に理由とともに登録する
    ignores: TEST_FILES,
    rules: {
      'serverstarter/no-blocking-call': [
        'error',
        { blockingModules: BLOCKING_MODULES },
      ],
    },
  },

  // ---- 型の安全性（型の抜け道でエラーや不正な値を見逃さない） ----
  // （no-unnecessary-type-assertion は，Pinia の state の初期値など型の推論に必要なアサーションも
  //   不要と判定して自動修正で消すため使わない）
  {
    files: ['**/*.ts', '**/*.vue'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/use-unknown-in-catch-callback-variable': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      // 型アサーション（as）を禁止する。値を検証してから使う（zod の safeParse や型ガードを使う）
      '@typescript-eslint/consistent-type-assertions': [
        'error',
        { assertionStyle: 'never' },
      ],
    },
  },
  // any の値の扱い（.vue はテンプレートの式を検査しないため，<script> の部分のみが対象になる）
  {
    files: ['**/*.ts', '**/*.vue'],
    rules: {
      '@typescript-eslint/no-unsafe-argument': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',
    },
  },

  // 型アサーションは，型を作る汎用処理（ジェネリクス・ブランド型の生成。eslint-rules/config.js の TYPE_ASSERTION_EXCEPTIONS）と
  // テストのファイルに限って使う
  {
    files: TEST_FILES,
    rules: { '@typescript-eslint/consistent-type-assertions': 'off' },
  },

  // ---- テスト（振る舞いを検証し，実装の内部構造に依存しないテストにする） ----
  // （in-source テストも対象とするため，テストの関数の呼び出しを検査する vitest のルールは全体に適用する。
  //   vitest のルールはグローバル・vitest から import したテストの関数のみを認識するため，
  //   in-source テストでも import.meta.vitest から取り出さずにグローバルの関数を使う（no-restricted-syntax で検査））
  {
    files: ['**/*.ts'],
    plugins: { vitest: pluginVitest },
    rules: {
      'vitest/no-focused-tests': 'error',
      'vitest/no-disabled-tests': 'error',
      // 成功の確認（assertOk・assertDefined）も検証として扱う
      'vitest/expect-expect': [
        'error',
        {
          assertFunctionNames: [
            'expect',
            'assert',
            'assertOk',
            'assertDefined',
          ],
        },
      ],
      'vitest/no-conditional-expect': 'error',
      'vitest/no-conditional-in-test': 'error',
      'vitest/no-standalone-expect': 'error',
      'vitest/valid-title': 'error',
      // describe に async の関数を渡すと，テストの収集時に処理が走る（ファイル操作など）ため禁止する
      'vitest/valid-describe-callback': 'error',
      'serverstarter/no-internal-mock': [
        'error',
        { boundaries: MOCKABLE_BOUNDARIES.map(({ file }) => file) },
      ],
    },
  },

  // ---- エラーハンドリング（失敗は Failable / WithError で扱い，握りつぶさない） ----
  {
    files: [
      ...BACKEND_FILES,
      ...SCRIPT_FILES,
      ...FRONTEND_FILES,
      ...SHARED_FILES,
    ],
    rules: {
      // 例外は eslint-rules/config.js に登録する（no-exception は EXCEPTION_ALLOWED_FUNCTIONS，no-unsafe-throwing-call は THROWING_CALL_EXCEPTIONS）
      'serverstarter/no-exception': 'error',
      'serverstarter/no-unsafe-throwing-call': [
        'error',
        { throwingApis: THROWING_APIS, converters: EXCEPTION_CONVERTERS },
      ],
      'serverstarter/no-ignored-failable': [
        'error',
        { handlers: FAILABLE_HANDLERS },
      ],
      'serverstarter/no-failable-cast': 'error',
      'serverstarter/no-failable-condition': 'error',
      'serverstarter/no-silent-error': ['error', { guards: ERROR_GUARDS }],
      // 結果を変数に入れて使わない形で，失敗の確認を回避することも防ぐ
      // （位置で受け取る引数のみ `_` 始まりで未使用を許可する。変数は `_` 始まりでも未使用を許可しない）
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          ignoreRestSiblings: true,
          args: 'after-used',
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^$',
          caughtErrors: 'all',
        },
      ],
      // ログは必ず正規の経路（ロガー）で latest.log に書き込む
      'no-console': 'error',
    },
  },
  // テストは本番のコード向けのエラーハンドリングのルールの対象外とする
  // （例外はテストの失敗として表に出る。in-source テストも各ルールの中で対象外としている）
  {
    files: TEST_FILES,
    rules: {
      'serverstarter/no-exception': 'off',
      'serverstarter/no-unsafe-throwing-call': 'off',
      'serverstarter/no-ignored-failable': 'off',
      'serverstarter/no-silent-error': 'off',
      'serverstarter/no-failable-cast': 'off',
      'serverstarter/no-failable-condition': 'off',
    },
  },
  // 例外：CLI の出力（ログではなく利用者への表示）は console を使う
  {
    files: SCRIPT_FILES,
    rules: { 'no-console': 'off' },
  },

  // util を使わずに OS の機能を直接扱うこと（迂回）を禁止する
  {
    files: [...BACKEND_FILES, ...SCRIPT_FILES],
    ignores: MODULE_RESTRICTION_IGNORES,
    rules: {
      // 個別のファイルで許可するモジュールは eslint-rules/config.js の MODULE_IMPORT_EXCEPTIONS に登録する
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          paths: RESTRICTED_BUILTIN_MODULES,
          // 外部パッケージは util の中でのみ扱う（型のみの import は例外を投げないため許可する）
          patterns: [
            {
              // 相対パス・プロジェクト内のエイリアス・許可したパッケージ以外に一致する
              regex: restrictedPackagePattern(ALLOWED_EXTERNAL_PACKAGES),
              allowTypeImports: true,
              message:
                '外部パッケージは util の中で扱い，Failable を返す関数として提供してください（eslint-rules/config.js の ALLOWED_EXTERNAL_PACKAGES を参照）',
            },
          ],
        },
      ],
      'no-restricted-globals': [
        'error',
        {
          name: 'fetch',
          message: 'util の BytesData.fromURL を使ってください',
        },
      ],
    },
  },
  // ---- 構文の制限（no-restricted-syntax は後の設定で上書きされるため，1 か所にまとめる） ----
  // （例外を関数単位で適用できるよう，標準の no-restricted-syntax を包んだ serverstarter/no-restricted-syntax を使う。
  //   例外は eslint-rules/config.js の ERROR_GUARD_IMPLEMENTATIONS に登録する）
  {
    files: ['**/*.ts', '**/*.vue'],
    rules: {
      'serverstarter/no-restricted-syntax': ['error', ...RESTRICTED_SYNTAX],
    },
  },
  // テストの共通の準備（setupFiles）は，テストの関数の外で後処理の検証を行う
  {
    files: ['test/setup/**'],
    rules: { 'vitest/no-standalone-expect': 'off' },
  },
  // util 以外では，Node.js の組み込みモジュールの動的な import も禁止する（静的な import は no-restricted-imports で禁止している）
  // （対象外のファイルは，組み込みモジュールの静的な import の制限と同じ MODULE_RESTRICTION_IGNORES を使う。
  //   in-source テストは，テストのファイルと同じく外部の境界を用意するために直接扱えるよう対象外とする。
  //   選択子では `if (import.meta.vitest)` の中（else を含む）を対象外とする。else に本番の処理を書かないこと）
  {
    files: [...BACKEND_FILES, ...SCRIPT_FILES],
    ignores: MODULE_RESTRICTION_IGNORES,
    rules: {
      'serverstarter/no-restricted-syntax': [
        'error',
        ...RESTRICTED_SYNTAX,
        {
          selector: `ImportExpression:not(IfStatement[test.object.type='MetaProperty'][test.property.name='vitest'] *)[source.value=/^(node:)?(${RESTRICTED_BUILTIN_MODULES.filter(
            ({ name }) => !name.startsWith('node:')
          )
            .map(({ name }) => name.replace('/', '\\/'))
            .join('|')})$/]`,
          message:
            'Node.js の組み込みモジュールは util を通して扱ってください（eslint-rules/config.js の RESTRICTED_BUILTIN_MODULES を参照）',
        },
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

      // this rule, if on, would require explicit return type on the `render` function
      '@typescript-eslint/explicit-function-return-type': 'off',

      // in plain CommonJS modules, you can't use `import foo = require('foo')` to pass this rule, so it has to be disabled
      '@typescript-eslint/no-require-imports': 'off',

      // The core 'no-unused-vars' rules (in the eslint:recommended ruleset)
      // does not work with type definitions
      'no-unused-vars': 'off',

      // allow debugger during development only
      'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',

      '@typescript-eslint/no-unused-expressions': [
        'error',
        { allowShortCircuit: true, allowTernary: true },
      ],

      // 層構造（import の方向）。層の定義は eslint-rules/config.js を参照
      'import-x/no-restricted-paths': [
        'error',
        {
          zones: [
            ...layerZones(BACKEND_LAYERS),
            ...layerZones(FRONTEND_LAYERS),
            // 層の中で個別に禁止する依存（理由は eslint-rules/config.js を参照）
            ...RESTRICTED_LAYER_IMPORTS.map(({ target, from, reason }) => ({
              target: target.map((f) => `./${f}`),
              from: from.map((f) => `./${f}`),
              message: reason,
            })),
            // フロントエンドからは，バックエンドの共有部分（schema・api の型）以外を import しない
            // （src-electron 直下のファイル（electron-main など）も含める）
            {
              target: './src/**/*',
              from: [
                './src-electron/!(schema|api)/**/*',
                './src-electron/*.ts',
              ],
              message:
                'フロントエンドからは src-electron の schema・api（型）のみ import できます',
            },
            // バックエンドからはフロントエンドを import しない
            {
              target: './src-electron/**/*',
              from: './src/**/*',
              message: 'バックエンドからフロントエンドは import できません',
            },
          ],
        },
      ],
    },
  }
);

/**
 * lint の設定を作る
 *
 * 例外（eslint-rules/config.js の LINT_EXCEPTIONS）は，ルールを包んで範囲を絞って適用する（eslint-rules/utils/exceptions.js）
 *
 * @param {object} [options] 設定
 * @param {(use: import('./eslint-rules/utils/exceptions.js').ExceptionUse) => void} [options.onExceptionUsed]
 *   例外によって違反を許可したときに呼ぶ関数（登録した例外が使われていることの検査に使う）
 * @returns ESLint の設定の一覧
 */
export function createConfig({ onExceptionUsed } = {}) {
  return applyExceptions(baseConfig, LINT_EXCEPTIONS, onExceptionUsed);
}

export default createConfig();
