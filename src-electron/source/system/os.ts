import { Failable } from 'app/src-electron/schema/error';
import { getGlobalIP as fetchGlobalIP } from 'app/src-electron/util/network/ip';
import {
  openBrowser as openBrowserInShell,
  openFolder as openFolderInShell,
} from 'app/src-electron/util/os/shell';

/**
 * OS の機能を使う，フロントエンドからの要求の窓口
 *
 * IPC の API（ipc/back.ts）からはバックエンドの処理（source）のみを呼び出す設計のため，
 * util の OS の機能はこのファイルを通して提供する
 */

/**
 * URL を既定のブラウザで開く
 *
 * @param url 開く URL
 */
export async function openBrowser(url: string): Promise<Failable<void>> {
  return openBrowserInShell(url);
}

/**
 * フォルダをエクスプローラーで開く
 *
 * @param path 開くフォルダのパス
 * @param autocreate フォルダが無い場合に作成するか
 */
export async function openFolder(
  path: string,
  autocreate: boolean
): Promise<Failable<void>> {
  return openFolderInShell(path, autocreate);
}

/** グローバル IP アドレスを取得する */
export async function getGlobalIP(): Promise<Failable<string>> {
  return fetchGlobalIP();
}
