import { API } from '../api/api';
import { BackCaller } from '../ipc/link';

/**
 * バックエンドから呼んでよい API（フロントエンドへの通知・問い合わせ）
 *
 * 中身は起動時の IPC の接続（`setBackAPI`）で設定する。接続より前に呼ばれないことは起動の順序で保証する
 * （未接続の間の既定値を作ると API の一覧を重複して持つことになるため，空のオブジェクトを API の型として扱う）
 */
export const api = {} as BackCaller<API>;

/**
 * バックエンドから呼んでよい API を設定する（IPC の接続時に一度だけ呼ぶ）
 *
 * @param _api IPC で接続した API
 */
export function setBackAPI(_api: BackCaller<API>) {
  api.invoke = _api.invoke;
  api.send = _api.send;
}
