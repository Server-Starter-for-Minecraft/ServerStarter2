import { randomInt as cryptoRandomInt } from 'crypto';

/**
 * 暗号論的に安全な乱数で，整数を生成する
 *
 * @param min 最小値（この値を含む）
 * @param max 最大値（この値を含まない）
 * @returns min 以上 max 未満の整数
 */
export function randomInt(min: number, max: number): number {
  return cryptoRandomInt(min, max);
}
