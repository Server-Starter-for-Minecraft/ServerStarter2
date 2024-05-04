import { API } from '../api/api';
import { BackCaller } from '../ipc/link';

/** バックエンドからで呼んでいいapi */
export const api = {} as BackCaller<API>;

export function setBackAPI(_api: BackCaller<API>) {
  api.invoke = _api.invoke;
  api.send = _api.send;
}
