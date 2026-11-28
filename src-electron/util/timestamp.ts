import { Timestamp } from '../schema/brands';

let timestamp: Timestamp;
let needReload = true;

// 1分経ったら再取得フラグを立てる
const RELOAD_SPAN = 1000 * 60;

/**
 * 日時を Timestamp（1970年1月1日00:00:00 UTCからの経過時間のミリ秒）にする
 *
 * @param date 日時
 * @returns 日時の Timestamp
 */
export function toTimestamp(date: Date): Timestamp {
  return date.getTime() as Timestamp;
}

/** 1970年1月1日00:00:00 UTCからの経過時間をミリ秒単位で返す */
export function getCurrentTimestamp(exact = false): Timestamp {
  if (needReload || exact) {
    timestamp = toTimestamp(new Date());
    if (needReload) {
      needReload = false;
      setTimeout(() => {
        needReload = true;
      }, RELOAD_SPAN);
    }
  }
  return timestamp;
}
