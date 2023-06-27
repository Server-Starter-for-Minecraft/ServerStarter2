import { Timestamp } from '../schema/brands';

/** 1970年1月1日00:00:00 UTCからの経過時間をミリ秒単位で返す */
export function getCurrentTimestamp(): Timestamp {
  return new Date().getTime() as Timestamp;
}
