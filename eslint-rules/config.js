// @ts-check
/**
 * lint の設定値（対象のファイル・例外の許可リストなど）を集約する
 *
 * 層の追加や例外を投げる API の追加などは，原則としてこのファイルへの追記だけで済むようにする。
 * このファイルの変更は lint の例外の追加にあたるため，CI で検出してメンテナーのレビューを必須にしている
 * （`.github/workflows/linter.yml`・`.github/CODEOWNERS` を参照）
 */

/** バックエンド（Electron のメインプロセス）のファイル */
export const BACKEND_FILES = ['src-electron/**/*.ts'];

/** バックエンドの処理（ドメインの処理）のファイル */
export const SOURCE_FILES = ['src-electron/source/**/*.ts'];

/** ビルド・開発用のスクリプト */
export const SCRIPT_FILES = ['scripts/**/*.ts'];

/** フロントエンドのファイル */
export const FRONTEND_FILES = ['src/**/*.ts', 'src/**/*.vue'];

/** テストのファイル（テスト専用の補助ファイルを含む） */
export const TEST_FILES = [
  '**/*.test.ts',
  '**/*.fixtures.ts',
  'test/**/*.ts',
  '__mocks__/**/*.ts',
];

/**
 * メインプロセスを止める（ブロッキングする）API を持つモジュール（`serverstarter/no-blocking-call` で使う）
 *
 * 呼び出し先の宣言元（型定義ファイル）と，そのモジュールが同期版の API として定めている名前の規則で判定する。
 * Node.js・fs-extra・Electron は，同期版の API の名前の末尾を `Sync` としている
 * （型定義ファイルのパスは，TypeScript が OS によらず `/` 区切りに正規化する）
 *
 * @type {import('./rules/no-blocking-call.js').BlockingModule[]}
 */
export const BLOCKING_MODULES = [
  {
    name: 'Node.js',
    declarationFile: /\/@types\/node\/(fs|child_process|zlib|crypto)\.d\.ts$/,
    blockingName: /Sync$/,
  },
  {
    name: 'fs-extra',
    declarationFile: /\/@types\/fs-extra\//,
    blockingName: /Sync$/,
  },
  {
    name: 'Electron',
    declarationFile: /\/electron\/electron\.d\.ts$/,
    blockingName: /Sync$/,
  },
];

/**
 * 構造上同期のままとする，バックエンドの処理（source/）の公開関数（`serverstarter/require-async-export` で使う）
 *
 * 追加する場合は，非同期にできない理由を `reason` に必ず書く
 *
 * @type {import('./rules/require-async-export.js').AllowedExport[]}
 */
export const ALLOWED_SYNC_EXPORTS = [
  {
    file: 'src-electron/source/sourceLogger.ts',
    name: 'sourceLoggers',
    reason: 'ロガーのカテゴリの定義（ロガーは同期で呼び出す設計）',
  },
  {
    file: 'src-electron/source/runtime/base.ts',
    name: 'runtimeLoggers',
    reason: 'ロガーのカテゴリの定義（ロガーは同期で呼び出す設計）',
  },
  {
    file: 'src-electron/source/version/versionLogger.ts',
    name: 'versionLogger',
    reason: 'ロガーのカテゴリの定義（ロガーは同期で呼び出す設計）',
  },
  {
    file: 'src-electron/source/world/dialog.ts',
    name: 'pickDialog',
    reason:
      'IPC へ渡すダイアログの関数（非同期）を作るファクトリ（作成時には処理を行わない）',
  },
  {
    file: 'src-electron/source/runtime/process.ts',
    name: 'javaProcessEnv',
    reason:
      '操作用のメソッドを付け足した Promise（ChildProcessPromise）を同期で返す関数の中で使う，環境変数の計算のみの関数',
  },
  {
    file: 'src-electron/source/version/getVersions/base.ts',
    name: 'getVersionCacheFilePath',
    reason: 'コンストラクタの中で使う，パスの計算のみの関数',
  },
  {
    file: 'src-electron/source/version/getVersions/neoForge.ts',
    name: 'getSpecificMCver',
    reason: '同期の groupBy のキーとして使う，文字列の解析のみの関数',
  },
  {
    file: 'src-electron/source/stores/migrations/groupColor.ts',
    name: 'migrateGroupColorToDye',
    reason: 'util の VersionedSchema に渡す，同期で行う設定の変換処理',
  },
  {
    file: 'src-electron/source/world/handler.ts',
    name: 'register',
    reason:
      '名前の確認と登録を同期で（間に await を挟まずに）行い，並行する操作が同じ名前を確保しないようにするため',
  },
  {
    file: 'src-electron/source/world/handler.ts',
    name: 'isRegistered',
    reason:
      '名前の確認と登録を同期で（間に await を挟まずに）行い，並行する操作が同じ名前を確保しないようにするため',
  },
  {
    file: 'src-electron/source/version/readyVersions/utils/versionJson.ts',
    name: 'getVersionJsonObj',
    reason: 'zod の transform（同期）の中で使う，値の生成のみの関数',
  },
  {
    file: 'src-electron/source/version/readyVersions/utils/versionJson.ts',
    name: 'javaEncodingToUtf8',
    reason: 'getVersionJsonObj（同期）の中で使う，定数を返すのみの関数',
  },
  {
    file: 'src-electron/source/runtime/manifest.ts',
    name: 'setRuntimeManifest',
    reason:
      'コンストラクタの中で使うインスタンスのファクトリ（作成時には処理を行わない）',
  },
  {
    file: 'src-electron/source/runtime/minecraft.ts',
    name: 'setRuntimeManifest',
    reason:
      'コンストラクタの中で使うインスタンスのファクトリ（作成時には処理を行わない）',
  },
];
