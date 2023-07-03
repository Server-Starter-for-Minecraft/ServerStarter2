import { Timestamp } from '../schema/brands';

let timestamp: Timestamp;
let needReload = true;

// 1分経ったら再取得フラグを立てる
const RELOAD_SPAN = 1000 * 60;

/** 1970年1月1日00:00:00 UTCからの経過時間をミリ秒単位で返す */
export function getCurrentTimestamp(exact = false): Timestamp {
  if (needReload || exact) {
    timestamp = new Date().getTime() as Timestamp;
    if (needReload) {
      needReload = false;
      setTimeout(() => {
        needReload = true;
      }, RELOAD_SPAN);
    }
  }
  return timestamp;
}
