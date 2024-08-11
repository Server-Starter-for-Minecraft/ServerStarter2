import { z } from 'zod';

/**
 * banned-players banned-ips で使われる時刻の文字列形式
 *
 * ちゃんと解析するなら dayjs 使おうね
 *
 * YYYY-MM-DD HH:mm:ss XX';
 *
 * e.g '2024-05-23 23:47:21 +0900'
 */
export const McTimestamp = z.string().brand('McTimestamp');
export type McTimestamp = z.infer<typeof McTimestamp>;
