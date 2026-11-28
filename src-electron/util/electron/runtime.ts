/**
 * Electron の API を取得する境界
 *
 * 共通基盤（util・lifecycle・logger など）は，Electron の外（ビルド用のスクリプト・テスト）でも読み込まれる。
 * `electron` パッケージを静的に import すると，Electron の外では読み込みに失敗する
 * （パッケージが入っていない・実行ファイルのダウンロードが始まるなど）ため，
 * 共通基盤からは `electron` を直接 import せず，このモジュールを通して Electron の API を使う
 * （`eslint-rules/config.js` の ELECTRON_FREE_FILES で検査している）
 */
import { createRequire } from 'module';
import { Failable } from '../../schema/error';
import { errorMessage } from '../error/construct';

/** Electron のメインプロセスから使える API（`electron` パッケージ） */
export type ElectronModule = typeof import('electron');

/**
 * 読み込んだ値が Electron のメインプロセスの API であるかを判定する
 *
 * @param loaded `require('electron')` で読み込んだ値
 * @returns Electron のメインプロセスの API である場合は true
 */
function isElectronModule(loaded: unknown): loaded is ElectronModule {
  return typeof loaded === 'object' && loaded !== null && 'app' in loaded;
}

/**
 * Electron の API を読み込む
 *
 * Electron のメインプロセスで実行している場合のみ `electron` を読み込む
 * （`ELECTRON_RUN_AS_NODE` で起動した Node.js などでは，`electron` は実行ファイルのパスの文字列になるため読み込まない）。
 * 共通基盤は互いに循環して import しているため，ここで `await import('electron')`（モジュールの読み込み時の await）を使うと，
 * メインプロセスのバンドル（Rolldown）では循環した各モジュールの読み込みが互いの完了を待ち合って止まり，アプリが起動しなくなる。
 * （ネイティブの ES Module で動くテスト・スクリプトでは起きないため，テストでは検出できない）
 * そのため，同期的に読み込める require を使う
 *
 * @returns Electron の API（Electron のメインプロセス以外では undefined）
 */
function loadElectron(): ElectronModule | undefined {
  if (process.type !== 'browser') return undefined;
  const loaded: unknown = createRequire(import.meta.url)('electron');
  return isElectronModule(loaded) ? loaded : undefined;
}

/**
 * Electron の API
 *
 * Electron のメインプロセス以外（スクリプト・テストなど）では undefined になる
 */
export const electron = loadElectron();

/**
 * Electron の API を取得する（Electron の外ではエラーを返す）
 *
 * Electron の外では使えない機能（シェル・画面など）を呼ぶ前に使う
 *
 * @param feature 使おうとしている機能の名前（エラーの内容に使う）
 * @returns Electron の API（Electron のメインプロセス以外ではエラー）
 */
export function requireElectron(feature: string): Failable<ElectronModule> {
  if (electron !== undefined) return electron;
  return errorMessage.system.assertion({
    message: `${feature} is only available in the Electron main process`,
  });
}
