// @ts-check
/**
 * lint の設定値（対象のファイル・例外の許可リストなど）を集約する
 *
 * 層の追加や例外を投げる API の追加などは，原則としてこのファイルへの追記だけで済むようにする。
 * このファイルの変更は lint の例外の追加にあたるため，CI で検出してメンテナーのレビューを必須にしている
 * （`.github/workflows/linter.yml`・`.github/CODEOWNERS` を参照）
 */

/** @typedef {import('./utils/exceptions.js').ScopedException} ScopedException */

/** バックエンド（Electron のメインプロセス）のファイル */
export const BACKEND_FILES = ['src-electron/**/*.ts'];

/** ビルド・開発用のスクリプト */
export const SCRIPT_FILES = ['scripts/**/*.ts'];

/** フロントエンドのファイル */
export const FRONTEND_FILES = ['src/**/*.ts', 'src/**/*.vue'];

/** バックエンドとフロントエンドの両方から使う処理（`src-public/`） */
export const SHARED_FILES = ['src-public/**/*.ts'];

/**
 * 型アサーション（`as`）を使ってよい関数（`@typescript-eslint/consistent-type-assertions` の例外）
 *
 * 値を検証せずに型を付けることになるため，型を作る汎用処理（ジェネリクス・ブランド型の生成）に限る。
 * 外部の入力（JSON・HTTP の応答・例外など）を扱う処理は，zod の safeParse や型ガードで検証すること。
 * 追加する場合は，型アサーションが必要な理由を `reason` に必ず書く
 *
 * @type {ScopedException[]}
 */
export const TYPE_ASSERTION_EXCEPTIONS = [
  {
    file: 'src-electron/util/zod/brand.ts',
    functions: ['asBrand'],
    reason: '形式に制約のない文字列にブランド型を付ける',
  },
  {
    file: 'src-electron/util/random/uuid.ts',
    functions: ['genUUIDOf'],
    reason: '生成した UUID にブランド型を付ける',
  },
  {
    file: 'src-public/scripts/uuid.ts',
    functions: ['genUUID', 'formatUUID'],
    reason: '生成・整形した UUID にブランド型を付ける',
  },
  {
    file: 'src-electron/util/timestamp.ts',
    functions: ['getCurrentTimestamp'],
    reason: '現在時刻にブランド型（Timestamp）を付ける',
  },
  {
    file: 'src-electron/util/error/construct.ts',
    functions: ['getErrorMessageConstructor'],
    reason: 'エラーの種類の定義から ErrorMessage を組み立てる',
  },
  {
    file: 'src-electron/util/error/failable.ts',
    functions: ['failabilify'],
    reason: '関数の戻り値の型から Failable の型を組み立てる',
  },
  {
    file: 'src-electron/util/versioning/versionedSchema.ts',
    functions: ['safeParse'],
    reason:
      '旧スキーマからの変換に失敗した結果（検証前のエラー）を，最新のスキーマの結果の型に合わせる',
  },
  {
    file: 'src-electron/util/deepcopy.ts',
    functions: ['deepcopy'],
    reason: '任意の型の値を複製し，元の型として返す',
  },
  {
    file: 'src-public/scripts/deepcopy.ts',
    functions: ['deepcopy'],
    reason: '任意の型の値を複製し，元の型として返す',
  },
  {
    file: 'src-electron/util/obj/obj.ts',
    functions: ['toEntries', 'fromEntries'],
    reason: 'オブジェクトのキー・値の一覧を，元のオブジェクトの型で返す',
  },
  {
    file: 'src-public/scripts/obj/obj.ts',
    functions: ['toEntries', 'fromEntries', 'keys', 'values'],
    reason: 'オブジェクトのキー・値の一覧を，元のオブジェクトの型で返す',
  },
  {
    file: 'src-public/scripts/obj/objFlatten.ts',
    functions: ['flattenObj'],
    reason: '入れ子のオブジェクトを平らにした型を組み立てる',
  },
  {
    file: 'src-electron/util/object/groupBy.ts',
    functions: ['groupBy'],
    reason: '空のオブジェクトから，キーごとに分けた結果の型を組み立てる',
  },
  {
    file: 'src-electron/util/helper/infinitMap.ts',
    functions: [
      'primitiveKeyStrongValue',
      'primitiveKeyWeakValue',
      'primitiveKeyPrimitiveValue',
    ],
    reason: '空のオブジェクトから，任意のキーで値を返す型を組み立てる',
  },
  {
    file: 'src-electron/util/awaitOnce.ts',
    functions: ['get'],
    reason:
      '一度だけ取得した値を，取得前の型（undefined を含まない型）として返す',
  },
  {
    file: 'src-electron/util/promise/promiseDecorator.ts',
    functions: ['decoratePromise'],
    reason: 'Promise にメソッドを付け足した型を組み立てる',
  },
];

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
 * メインプロセスを止める同期 API を使ってよい範囲（`serverstarter/no-blocking-call` の例外）
 *
 * 画面の表示前に一度だけ実行する処理など，操作を止めないことが明らかな場合に限る。
 * 関数単位を原則とし，関数の外（モジュールの読み込み時）で使う必要がある場合のみ `topLevel` で許可する。
 * 追加する場合は，同期 API が必要な理由を `reason` に必ず書く
 *
 * @type {ScopedException[]}
 */
export const BLOCKING_CALL_EXCEPTIONS = [
  {
    file: 'src-electron/util/os/os.ts',
    functions: ['readOsRelease'],
    reason:
      '起動時に一度だけ，Linux のディストリビューションを判定して定数（osPlatform）を決める（画面の表示前で操作を止めない）',
  },
  {
    file: 'src-electron/logger/logger.ts',
    topLevel: true,
    reason:
      '起動時に一度だけ，log4js が latest.log を上書きする前に，モジュールの読み込み時に同期で退避する必要がある（画面の表示前で操作を止めない）',
  },
];

/**
 * 宣言元のファイル（リポジトリのルートからのパス）の一覧から，型定義の宣言元のパスに一致する正規表現を作る
 *
 * @param {string[]} files 宣言元のファイルの一覧
 * @returns {RegExp} 宣言元のファイルのパスに一致する正規表現
 */
function declarationFilePattern(files) {
  const escaped = files.map((f) => f.replace(/[.+?^${}()|[\]\\]/g, '\\$&'));
  return new RegExp(`/(${escaped.join('|')})$`);
}

/**
 * 例外を Failable へ変換する関数の定義
 *
 * @typedef {object} ExceptionConverterDefinition
 * @property {string} name 関数の名前
 * @property {string[]} files 関数を定義しているファイル（リポジトリのルートからのパス）
 * @property {boolean} async 非同期の関数（Promise の reject）を Failable に変換できるか
 */

/**
 * 例外を Failable へ変換する関数（`serverstarter/no-exception`・`no-unsafe-throwing-call` で使う）
 *
 * 例外を投げる・捕まえる処理は，原則としてこの一覧の関数の中だけで行う。
 * 外部ライブラリなどの例外は，ここにある `safeExec` / `safeExecAsync` に渡して Failable に変換する。
 * 関数名だけで判定すると同名の自作の関数でも許可されてしまうため，宣言元のファイルでも判定する。
 * `async: false` の関数（同期の try/catch）に非同期の関数を渡すと，reject は変換されないため報告する。
 * これらの関数の実装は，例外を扱ってよい関数（EXCEPTION_ALLOWED_FUNCTIONS）に自動で含める
 *
 * @type {ExceptionConverterDefinition[]}
 */
const EXCEPTION_CONVERTER_DEFINITIONS = [
  {
    name: 'safeExec',
    files: ['src-electron/util/error/failable.ts', 'src/error/error.ts'],
    async: false,
  },
  {
    name: 'safeExecAsync',
    files: ['src-electron/util/error/failable.ts', 'src/error/error.ts'],
    async: true,
  },
  {
    name: 'failabilify',
    files: ['src-electron/util/error/failable.ts'],
    async: true,
  },
];

/**
 * 例外を Failable へ変換する関数（`serverstarter/no-unsafe-throwing-call` の設定の形式）
 *
 * @type {import('./rules/no-unsafe-throwing-call.js').ExceptionConverter[]}
 */
export const EXCEPTION_CONVERTERS = EXCEPTION_CONVERTER_DEFINITIONS.map(
  ({ name, files, async }) => ({
    name,
    declarationFile: declarationFilePattern(files),
    async,
  })
);

/**
 * 例外を扱ってよい関数（`serverstarter/no-exception` の例外）
 *
 * 例外を Failable へ変換する関数（EXCEPTION_CONVERTER_DEFINITIONS）の実装を含む。
 * 追加する場合は，safeExec / safeExecAsync を使えない理由を `reason` に必ず書く
 *
 * @type {ScopedException[]}
 */
export const EXCEPTION_ALLOWED_FUNCTIONS = [
  ...[
    ...new Set(EXCEPTION_CONVERTER_DEFINITIONS.flatMap(({ files }) => files)),
  ].map((file) => ({
    file,
    functions: EXCEPTION_CONVERTER_DEFINITIONS.filter(({ files }) =>
      files.includes(file)
    ).map(({ name }) => name),
    reason: '例外を Failable へ変換する最下層の関数',
  })),
  {
    file: 'src-public/scripts/promise/runDetached.ts',
    functions: ['runDetached'],
    reason:
      '完了を待たない Promise の失敗を onError に渡す最下層の関数（待たれない Promise は safeExecAsync で待てないため，Promise の失敗を直接受け取る）',
  },
  {
    file: 'src-electron/ipc/util.ts',
    functions: ['ipcHandle'],
    reason:
      'API の戻り値の型が Failable でないものもあるため，予期しない例外はログに残したうえで reject としてフロントエンドへ伝える（API を Failable に揃える件は Issue で検討する）',
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
 * 例外を投げる API を Failable へ変換せずに呼んでよい範囲（`serverstarter/no-unsafe-throwing-call` の例外）
 *
 * 入力が固定で，実行のたびに結果が変わらない（失敗した場合は起動時・テストで直ちに分かる）呼び出しに限る。
 * 追加する場合は，失敗しない理由を `reason` に必ず書く
 *
 * @type {ScopedException[]}
 */
export const THROWING_CALL_EXCEPTIONS = [
  {
    file: 'src-electron/schema/static.ts',
    topLevel: true,
    reason:
      'スキーマの既定値から定数を作るために parse を使う（入力が固定のため失敗しない）',
  },
  {
    file: 'src-electron/schema/system.ts',
    topLevel: true,
    reason:
      'スキーマの既定値から定数を作るために parse を使う（入力が固定のため失敗しない）',
  },
  {
    file: 'scripts/electronNode.ts',
    topLevel: true,
    functions: ['runWithElectronNode'],
    reason:
      'ビルド用の CLI のランチャーは，自身のファイルの位置（import.meta.url）から作る固定の URL のみを扱う（失敗しない）',
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
 * エラーの判定の手書き（`x.type === 'error'`）を許可する関数（`serverstarter/no-restricted-syntax` の例外）
 *
 * no-restricted-syntax の例外は選択子（selector）ごとに分けられないため，この関数の中では
 * RESTRICTED_SYNTAX のすべての制限が外れる（判定の実装だけの短い関数に限る）
 *
 * @type {ScopedException[]}
 */
export const ERROR_GUARD_IMPLEMENTATIONS = [
  {
    file: 'src-electron/util/error/error.ts',
    functions: ['isError'],
    reason: 'エラーの判定（isError）そのものの実装',
  },
  {
    file: 'src-public/scripts/error.ts',
    functions: ['isError'],
    reason: 'エラーの判定（isError）そのものの実装',
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
 * 組み込みモジュールの動的な import（`import('fs')`）に一致する選択子（no-restricted-syntax の selector）を作る
 *
 * in-source テスト（`if (import.meta.vitest) { ... }` の条件を満たした側）の中は，
 * テストのファイルと同じく外部の境界を用意するために直接扱えるよう対象外とする（else の側は対象とする）
 *
 * @param {{ name: string }[]} modules 禁止するモジュール（`node:` を付けた名前は，付けない名前から作るため無視する）
 * @returns {string} 選択子
 */
export function restrictedDynamicImportSelector(modules) {
  // 一覧が空の場合は何にも一致しない選択子にならないため，設定の誤りとして止める
  if (modules.length === 0) {
    throw new Error('禁止するモジュールを 1 つ以上指定してください');
  }
  const names = modules
    .filter(({ name }) => !name.startsWith('node:'))
    .map(({ name }) => name.replace(/[.+?^${}()|[\]\\/]/g, '\\$&'));
  const inSourceTest =
    "IfStatement[test.object.type='MetaProperty'][test.property.name='vitest'] > .consequent";
  return `ImportExpression:not(${inSourceTest} *)[source.value=/^(node:)?(${names.join('|')})$/]`;
}

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
 * util 以外で，制限しているモジュール（RESTRICTED_BUILTIN_MODULES・外部パッケージ）を直接 import してよい範囲
 * （静的な import を制限する `@typescript-eslint/no-restricted-imports` の例外）
 *
 * ファイルごとに許可するモジュールを指定する（他のモジュールの制限・動的な import の禁止・`fetch` の禁止は残る）。
 * 外部パッケージのラッパーは，いずれも外部パッケージの例外を Failable へ変換して提供している（util へ移動する候補）。
 * 追加する場合は，util を通して扱えない理由を `reason` に必ず書く
 *
 * @type {ScopedException[]}
 */
export const MODULE_IMPORT_EXCEPTIONS = [
  {
    file: 'src-electron/electron-main.ts',
    modules: ['#q-app/electron/main'],
    reason:
      'アプリのエントリーポイントとして Quasar の実行環境（#q-app）を読み込むため',
  },
  {
    file: 'src-electron/logger/logger.ts',
    modules: ['fs-extra', 'log4js', 'tar'],
    reason:
      'ロガーは util より下の基盤で，ログの出力（log4js）とアーカイブ（tar）を行い，起動時のログの退避に fs-extra を直接使う（BLOCKING_CALL_EXCEPTIONS と同じ理由）',
  },
  {
    file: 'src-electron/source/remote/github/sync.ts',
    modules: ['simple-git'],
    reason:
      'Git の操作（simple-git）の失敗を safeExecAsync で Failable に変換している',
  },
  {
    file: 'src-electron/source/server/setup/ngrok.ts',
    modules: ['@ngrok/ngrok'],
    reason: 'Ngrok の操作の失敗を Failable に変換している',
  },
  {
    file: 'src-electron/source/stores/config.ts',
    modules: ['electron-store'],
    reason: '設定の保存（electron-store）を扱う',
  },
  {
    file: 'src-electron/source/version/getVersions/forge.ts',
    modules: ['cheerio'],
    reason: 'バージョン一覧の HTML の解析（cheerio）を扱う',
  },
  {
    file: 'src-electron/source/version/getVersions/spigot.ts',
    modules: ['cheerio'],
    reason: 'バージョン一覧の HTML の解析（cheerio）を扱う',
  },
  {
    file: 'scripts/electronNode.ts',
    modules: ['child_process', 'module', 'url'],
    reason:
      'ビルド用の CLI を Electron の Node.js で起動するランチャー（標準入出力をそのまま引き継ぐ必要があり，出力をログ用に受け取る util の subprocess は使えない）',
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
 * 層の単位では許可しているが，個別に禁止する import（層構造の補足）
 *
 * 共通基盤（base）は互いに依存するため 1 つの層としているが，その中にも守るべき方向がある。
 * 層を分けられない依存の方向は，ここに追加する
 *
 * @type {{ target: string[]; from: string[]; reason: string }[]}
 */
export const RESTRICTED_LAYER_IMPORTS = [
  {
    target: ['src-electron/ipc/back.ts'],
    from: [
      'src-electron/util/**',
      'src-electron/lifecycle/**',
      'src-electron/logger/**',
    ],
    reason:
      'IPC の API の処理は source の窓口（OS・画面の機能は source/system）を通して呼ぶ',
  },
  {
    target: ['src-electron/schema/**', 'src-public/**'],
    from: ['src-electron/lifecycle/**', 'src-electron/logger/**'],
    reason:
      'schema・src-public はフロントエンドからも読み込むため，Electron・log4js に依存するアプリのライフサイクル・ロガーを使わない',
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
    file: 'src-electron/lifecycle/paths.ts',
    reason:
      'アプリのデータの保存先（source/const.ts の元の定義。util・ロガーはこちらを直接読むため，同じ理由で置き換える）',
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
    file: 'src-electron/lifecycle/exit.ts',
    reason:
      'アプリの終了と PC のシャットダウン（テストの実行環境を終了させない）',
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

/**
 * 例外の一覧と，その例外を適用するルールの対応（`eslint.config.js` で `utils/exceptions.js` の仕組みに渡す）
 *
 * 例外は，ここに登録したルールの違反のうち，例外の範囲（関数・モジュールの読み込み時・import するモジュール）で
 * 報告されたものだけを許可する。ルール・例外・範囲の組ごとに，使われていない（違反を 1 件も許可していない）場合は
 * テスト（lintExceptions.test.js）で検出するため，例外は必要なルールにだけ適用する
 *
 * @type {import('./utils/exceptions.js').ExceptionGroup[]}
 */
export const LINT_EXCEPTIONS = [
  {
    rules: ['@typescript-eslint/consistent-type-assertions'],
    exceptions: TYPE_ASSERTION_EXCEPTIONS,
  },
  {
    rules: ['serverstarter/no-blocking-call'],
    exceptions: BLOCKING_CALL_EXCEPTIONS,
  },
  {
    rules: ['serverstarter/no-exception'],
    exceptions: EXCEPTION_ALLOWED_FUNCTIONS,
  },
  {
    rules: ['serverstarter/no-unsafe-throwing-call'],
    exceptions: THROWING_CALL_EXCEPTIONS,
  },
  {
    rules: ['serverstarter/no-restricted-syntax'],
    exceptions: ERROR_GUARD_IMPLEMENTATIONS,
  },
  {
    rules: ['@typescript-eslint/no-restricted-imports'],
    exceptions: MODULE_IMPORT_EXCEPTIONS,
  },
];
