import { API } from '../api/api';
import { setBackAPI } from '../core/api';
import { backListener } from './back';
import { frontDummyListener } from './dummy_front';
import { linkIPC } from './link';

/** バックエンドのテスト用 */
export function setupDummyIPC() {
  const { back } = linkIPC<API>(backListener, frontDummyListener);
  setBackAPI(back);
}
