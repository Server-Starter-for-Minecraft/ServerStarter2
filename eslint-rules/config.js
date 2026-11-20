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

/** IPC の API と処理の対応付けのファイル（`serverstarter/require-async-ipc-handler` で使う） */
export const IPC_HANDLER_FILES = ['src-electron/ipc/back.ts'];

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
 * 例外を Failable へ変換する関数（`serverstarter/no-exception`・`no-unsafe-throwing-call` で使う）
 *
 * 例外を投げる・捕まえる処理は，原則としてこの一覧の関数の中だけで行う。
 * 外部ライブラリなどの例外は，ここにある `safeExec` / `safeExecAsync` に渡して Failable に変換する
 */
export const EXCEPTION_CONVERTERS = [
  'safeExec',
  'safeExecAsync',
  'failabilify',
];

/**
 * 例外を扱ってよい関数（`serverstarter/no-exception`・`no-unsafe-throwing-call` で使う）
 *
 * 追加する場合は，safeExec / safeExecAsync を使えない理由を `reason` に必ず書く
 *
 * @type {import('./utils/scope.js').AllowedFunctions[]}
 */
export const EXCEPTION_ALLOWED_FUNCTIONS = [
  {
    file: 'src-electron/util/error/failable.ts',
    functions: ['safeExec', 'safeExecAsync', 'failabilify'],
    reason: '例外を Failable へ変換する最下層の関数',
  },
  {
    file: 'src-electron/electron-preload.ts',
    functions: ['listener'],
    reason:
      'プリロードは util を読み込まずに最小限の依存で動かすため，フロントエンドの処理の失敗（reject）を直接受け取ってバックエンドへ返す',
  },
  {
    file: 'src-electron/util/promise/spool.ts',
    functions: ['spool'],
    reason:
      'Promise を直列に実行する基盤であり，各処理の結果・失敗（reject）をそのまま呼び出し元へ伝える',
  },
  {
    file: 'src-electron/source/world/handler.ts',
    functions: ['start'],
    reason:
      'ワールドの操作を直列に実行する基盤（PromiseSpooler）であり，各処理の失敗をそのまま呼び出し元へ伝える',
  },
  {
    file: 'src-electron/source/server/setup/ngrok.ts',
    functions: ['runNgrok'],
    reason:
      'Ngrok の失敗の種類（予約されていないアドレスなど）を例外のエラーコードで判定するため（safeExecAsync ではエラーコードが失われる）',
  },
  {
    file: 'src-electron/util/os/os.ts',
    functions: ['getOsPlatform'],
    reason:
      '起動時に一度だけ実行し，対応していない OS では処理を続行できないため，例外で起動を中止する',
  },
  {
    file: 'src/error/error.ts',
    functions: ['safeExec', 'safeExecAsync'],
    reason: '例外を Failable へ変換するフロントエンドの最下層の関数',
  },
  {
    file: 'src-electron/util/versioning/versionedSchema.ts',
    functions: ['parse'],
    reason:
      'zod の parse と同じく失敗時に例外を投げる版（本番のコードでは THROWING_APIS により safeParse の利用を強制する）',
  },
  {
    file: 'src-electron/util/binary/path.ts',
    functions: ['retryOnBusy'],
    reason:
      '一時的なファイルロックかどうかを例外のエラーコードで判定して再試行するため（safeExecAsync ではエラーコードが失われる）',
  },
];

/**
 * 例外を投げる API（`serverstarter/no-unsafe-throwing-call` で使う）
 *
 * 宣言元のファイル・所属する型・名前で特定する（呼び出し側の名前では判定しない）
 *
 * @type {import('./rules/no-unsafe-throwing-call.js').ThrowingApi[]}
 */
export const THROWING_APIS = [
  {
    name: 'parse',
    owner: 'JSON',
    kind: 'call',
    declarationFile: /\/typescript\/lib\/lib\.[\w.]+\.d\.ts$/,
    alternative:
      'BytesData#json(スキーマ) を使うか，safeExec(() => JSON.parse(...)) で Failable に変換してください',
  },
  {
    name: 'parse',
    kind: 'call',
    declarationFile: /\/zod\//,
    alternative: 'safeParse を使い，失敗した場合はエラーを返してください',
  },
  {
    name: 'parseAsync',
    kind: 'call',
    declarationFile: /\/zod\//,
    alternative: 'safeParseAsync を使い，失敗した場合はエラーを返してください',
  },
  {
    name: 'parse',
    owner: 'VersionedSchema',
    kind: 'call',
    declarationFile: /\/src-electron\/util\/versioning\/versionedSchema\.ts$/,
    alternative: 'safeParse を使い，失敗した場合はエラーを返してください',
  },
  {
    name: 'URL',
    kind: 'new',
    declarationFile:
      /(\/typescript\/lib\/lib\.[\w.]+\.d\.ts|\/@types\/node\/url\.d\.ts)$/,
    alternative: 'safeExec(() => new URL(...)) で Failable に変換してください',
  },
  {
    name: 'decodeURIComponent',
    kind: 'call',
    declarationFile: /\/typescript\/lib\/lib\.[\w.]+\.d\.ts$/,
    alternative:
      'safeExec(() => decodeURIComponent(...)) で Failable に変換してください',
  },
  {
    name: 'decodeURI',
    kind: 'call',
    declarationFile: /\/typescript\/lib\/lib\.[\w.]+\.d\.ts$/,
    alternative:
      'safeExec(() => decodeURI(...)) で Failable に変換してください',
  },
];

/**
 * エラーの判定関数（`serverstarter/no-silent-error` で使う）
 *
 * @type {import('./rules/no-silent-error.js').ErrorGuard[]}
 */
export const ERROR_GUARDS = [
  {
    name: 'isError',
    kind: 'error',
    declarationFile:
      /\/(src-electron\/util\/error\/error|src-public\/scripts\/error)\.ts$/,
  },
  {
    name: 'isValid',
    kind: 'valid',
    declarationFile:
      /\/(src-electron\/util\/error\/error|src-public\/scripts\/error)\.ts$/,
  },
];

/**
 * util を使わずに扱うことを禁止する Node.js の組み込みモジュールと，代わりに使う util
 * （`no-restricted-imports` で使う。util 以外の src-electron と scripts が対象）
 */
export const RESTRICTED_BUILTIN_MODULES = [
  {
    name: 'fs',
    message: 'util の Path（src-electron/util/binary/path）を使ってください',
  },
  {
    name: 'fs/promises',
    message: 'util の Path（src-electron/util/binary/path）を使ってください',
  },
  {
    name: 'fs-extra',
    message: 'util の Path（src-electron/util/binary/path）を使ってください',
  },
  {
    name: 'path',
    message: 'util の Path（src-electron/util/binary/path）を使ってください',
  },
  {
    name: 'child_process',
    message:
      'util の execProcess / interactiveProcess（src-electron/util/binary/subprocess）を使ってください',
  },
  {
    name: 'crypto',
    message:
      'util の乱数（src-electron/util/random）・ハッシュ（BytesData）を使ってください',
  },
  {
    name: 'os',
    message: 'util の osPlatform（src-electron/util/os/os）を使ってください',
  },
].flatMap((m) => [m, { ...m, name: `node:${m.name}` }]);

/**
 * 失敗しうる値を受け取り，エラーを処理する関数（`serverstarter/no-ignored-failable` で使う）
 *
 * これらの関数の戻り値（成功した場合の値）は，捨ててもエラーの見落としにならない
 *
 * @type {{ name: string; declarationFile: RegExp }[]}
 */
export const FAILABLE_HANDLERS = [
  { name: 'checkError', declarationFile: /\/src\/error\/error\.ts$/ },
];

/**
 * util 以外（src-electron と scripts）で import してよい外部パッケージ
 *
 * 外部パッケージは例外を投げうるため，原則として util の中でのみ扱い，Failable を返す関数として提供する。
 * 例外を投げない・型のみを使うパッケージに限り，ここに追加する
 */
export const ALLOWED_EXTERNAL_PACKAGES = [
  'zod',
  'dayjs',
  'dayjs/*',
  'electron',
  'type-fest',
  'vitest',
];

/**
 * util 以外で import を禁止するモジュールの指定に一致する正規表現の文字列を作る
 *
 * 相対パス・プロジェクト内のエイリアス（`app/`・`src-electron/`・`src/`）・許可したパッケージ以外に一致する。
 * 許可したパッケージの `name/*` は，そのパッケージの配下のモジュールも許可する
 *
 * @param {string[]} allowed 許可するパッケージの一覧
 * @returns {string} no-restricted-imports の patterns の regex に渡す正規表現
 */
export function restrictedPackagePattern(allowed) {
  const packages = allowed.map((name) =>
    name.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\/\*$/, '(/.*)?')
  );
  return String.raw`^(?!\.|app/|src-electron/|src/|(${packages.join('|')})$)`;
}

/**
 * 外部パッケージを直接扱ってよい，util 以外のファイル（外部パッケージのラッパー）
 *
 * いずれも外部パッケージの例外を Failable へ変換して提供している。util へ移動する候補
 *
 * @type {{ file: string; reason: string }[]}
 */
export const EXTERNAL_PACKAGE_WRAPPERS = [
  {
    file: 'src-electron/electron-main.ts',
    reason:
      'アプリのエントリーポイントとして Quasar の実行環境（#q-app）を読み込むため',
  },
  {
    file: 'src-electron/logger/logger.ts',
    reason: 'ログの出力（log4js）とアーカイブ（tar）を行う基盤のため',
  },
  {
    file: 'src-electron/source/remote/github/sync.ts',
    reason:
      'Git の操作（simple-git）の失敗を safeExecAsync で Failable に変換している',
  },
  {
    file: 'src-electron/source/server/setup/ngrok.ts',
    reason: 'Ngrok の操作の失敗を Failable に変換している',
  },
  {
    file: 'src-electron/source/stores/config.ts',
    reason: '設定の保存（electron-store）を扱う',
  },
  {
    file: 'src-electron/source/version/getVersions/forge.ts',
    reason: 'バージョン一覧の HTML の解析（cheerio）を扱う',
  },
  {
    file: 'src-electron/source/version/getVersions/spigot.ts',
    reason: 'バージョン一覧の HTML の解析（cheerio）を扱う',
  },
];

/**
 * @typedef {object} Layer
 * @property {string} name 層の名前
 * @property {string[]} files 層に含まれるファイル（リポジトリのルートからの glob）
 * @property {string[]} allowed import してよい層の名前（`*` はすべて）
 * @property {string} description 層の役割
 */

/**
 * バックエンド（src-electron）の層構造（上ほど上位）
 *
 * 各層は `allowed` に書いた層だけを import できる（下位の層のみを書く。上位の層・同じ階層の層は書かない）。
 * 層の中のファイル同士は自由に import できる。
 * 層を追加する場合は，この一覧に追加し，上位の層の `allowed` に新しい層を追加する
 *
 * @type {Layer[]}
 */
export const BACKEND_LAYERS = [
  {
    name: 'entry',
    files: ['src-electron/electron-main.ts'],
    allowed: ['*'],
    description: 'アプリのエントリーポイント',
  },
  {
    name: 'preload',
    files: ['src-electron/electron-preload.ts'],
    allowed: ['api', 'base'],
    description: 'プリロード（レンダラーへ API を公開する）',
  },
  {
    name: 'ipc-api',
    files: ['src-electron/ipc/back.ts'],
    allowed: ['source', 'api', 'ipc', 'ipc-link', 'base'],
    description:
      'IPC の API とバックエンドの処理の対応付け（バックエンドの処理は source のみを呼ぶ）',
  },
  {
    name: 'ipc',
    files: ['src-electron/ipc/!(back|link).ts'],
    allowed: ['ipc-api', 'ipc-link', 'core', 'api', 'base'],
    description: 'IPC の接続',
  },
  {
    name: 'updater',
    files: ['src-electron/updater/**'],
    allowed: ['source', 'common', 'core', 'api', 'base'],
    description: '自動アップデート',
  },
  {
    name: 'source',
    files: ['src-electron/source/**'],
    allowed: ['common', 'core', 'api', 'base'],
    description: 'バックエンドの処理（ドメインの処理）',
  },
  {
    name: 'common',
    files: ['src-electron/common/**'],
    allowed: ['core', 'api', 'base'],
    description: '進捗の通知などの共通処理',
  },
  {
    name: 'core',
    files: ['src-electron/core/**'],
    allowed: ['api', 'ipc-link', 'base'],
    description: 'バックエンドから使う API の送信口（source を呼ばない）',
  },
  {
    name: 'ipc-link',
    files: ['src-electron/ipc/link.ts'],
    allowed: ['api', 'base'],
    description: 'IPC の型と接続の土台',
  },
  {
    name: 'api',
    files: ['src-electron/api/**'],
    allowed: ['base'],
    description: 'IPC の API の型定義',
  },
  {
    name: 'base',
    files: [
      'src-electron/util/**',
      'src-electron/schema/**',
      'src-electron/lifecycle/**',
      'src-electron/logger/**',
      'src-public/**',
    ],
    allowed: [],
    description:
      '共通基盤（汎用処理・スキーマ・アプリのライフサイクル・ロガー）。互いに依存するため同じ層とする',
  },
];

/**
 * フロントエンド（src）の層構造（上ほど上位）
 *
 * 考え方はバックエンドと同じ。src-electron は schema と api（型）のみ import できる
 *
 * @type {Layer[]}
 */
export const FRONTEND_LAYERS = [
  {
    name: 'front-entry',
    files: ['src/App.vue'],
    allowed: ['*'],
    description: 'フロントエンドのエントリーポイント',
  },
  {
    name: 'router',
    files: ['src/router/**'],
    allowed: ['layouts', 'pages', 'front-base', 'shared'],
    description: '画面の遷移',
  },
  {
    name: 'layouts',
    files: ['src/layouts/**'],
    allowed: ['pages', 'components', 'init', 'stores', 'front-base', 'shared'],
    description: '画面の枠組み',
  },
  {
    name: 'pages',
    files: ['src/pages/**'],
    allowed: ['components', 'init', 'stores', 'front-base', 'shared'],
    description: '画面',
  },
  {
    name: 'components',
    files: ['src/components/**'],
    allowed: ['init', 'stores', 'front-base', 'shared'],
    description: '画面の部品（pages・layouts は使わない）',
  },
  {
    name: 'init',
    files: ['src/init.ts'],
    allowed: ['stores', 'front-base', 'shared'],
    description: '起動時の処理',
  },
  {
    name: 'stores',
    files: ['src/stores/**'],
    allowed: ['front-base', 'shared'],
    description: '状態の管理（components・pages・layouts は使わない）',
  },
  {
    name: 'front-base',
    files: [
      'src/error/**',
      'src/logic/**',
      'src/i18n/**',
      'src/assets/**',
      'src/color/**',
      'src/boot/**',
      'src/schema/**',
    ],
    allowed: ['shared'],
    description:
      'フロントエンドの共通基盤（エラー処理・stores と components で共有する処理・翻訳・素材など）',
  },
  {
    name: 'shared',
    files: ['src-public/**', 'src-electron/schema/**', 'src-electron/api/**'],
    allowed: [],
    description: 'フロントエンドとバックエンドで共有する処理と型',
  },
];

/**
 * テストで差し替えてよい，外部との境界のモジュール（`serverstarter/no-internal-mock` で使う）
 *
 * ネットワーク・OS・Electron・外部のプロセスなど，テストの環境では実物を使えない・使うべきでない境界のみを登録する。
 * 追加する場合は，差し替える必要がある理由を `reason` に必ず書く
 *
 * @type {{ file: string; reason: string }[]}
 */
export const MOCKABLE_BOUNDARIES = [
  {
    file: 'src-electron/util/binary/bytesData.ts',
    reason: 'ネットワーク・ファイルの読み込み',
  },
  { file: 'src-electron/util/os/os.ts', reason: '実行している OS の種類' },
  {
    file: 'src-electron/util/tempPath.ts',
    reason: '一時フォルダの場所（テストの作業フォルダに置き換える）',
  },
  {
    file: 'src-electron/source/const.ts',
    reason: 'アプリのデータの保存先（テストの作業フォルダに置き換える）',
  },
  {
    file: 'src-electron/source/stores/system.ts',
    reason:
      'Electron の safeStorage で暗号化する設定ファイル（テストの環境では使えない）',
  },
  {
    file: 'src-electron/core/api.ts',
    reason: 'フロントエンド（レンダラー）への IPC の送信',
  },
  {
    file: 'src-electron/source/containers.ts',
    reason: '外部サービスから取得するバージョンの一覧',
  },
  {
    file: 'src-electron/source/server/server.ts',
    reason: 'Minecraft サーバー（Java のプロセス）の起動',
  },
  {
    file: 'src-electron/source/server/setup/ngrok.ts',
    reason: '外部サービス（Ngrok）への接続',
  },
  {
    file: 'src-electron/source/launcher/launcherProfile.ts',
    reason: 'ユーザーの環境にある Minecraft ランチャーの設定',
  },
  {
    file: 'src-electron/source/version/readyVersions/utils/forgeInstaller.ts',
    reason: 'Forge のインストーラーのダウンロード（ネットワーク）',
  },
  {
    file: 'src-electron/updater/version.ts',
    reason: 'Electron から取得するアプリのバージョン',
  },
  {
    file: 'src-electron/updater/fetch.ts',
    reason: 'リリース情報の取得（ネットワーク）',
  },
  {
    file: 'src-electron/updater/installer/windows.ts',
    reason: 'インストーラー（外部のプロセス）の起動',
  },
  {
    file: 'src-electron/updater/installer/mac.ts',
    reason: 'インストーラー（外部のプロセス）の起動',
  },
  {
    file: 'src-electron/updater/notify.ts',
    reason: 'フロントエンドへの通知（IPC）',
  },
];
