import { z } from 'zod';

/**
 * banned-players banned-ips で使われる時刻の文字列形式
 *
 * e.g '2024-05-23 23:47:21 +0900'
 *
 * ちゃんと解析するなら dayjs 使おうね
 * ```ts
 * import dayjs from 'dayjs';
 * # 現在時刻を上記の所定の形式で取得する
 * dayjs().format('YYYY-MM-DD HH:mm:ss ZZ');
 * ```
 */
export const McTimestamp = z.string().brand('McTimestamp');
export type McTimestamp = z.infer<typeof McTimestamp>;

export const McTimestampTemplate = 'YYYY-MM-DD HH:mm:ss ZZ';
