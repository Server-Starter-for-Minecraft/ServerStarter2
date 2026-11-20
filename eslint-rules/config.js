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
