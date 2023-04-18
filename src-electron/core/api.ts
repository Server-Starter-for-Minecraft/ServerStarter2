import { API } from '../api/api';
import { Back } from './ipc/link';

/** バックエンドからで呼んでいいapi */
export let api: Back<API>;

export function setBackAPI(_api: Back<API>) {
  api = _api;
}
