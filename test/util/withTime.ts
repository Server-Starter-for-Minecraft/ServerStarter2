import { vi } from 'vitest';

/**
 * new Date()の結果を一定の日時に固定して関数を実行
 * @param {string | number | Date} time
 * @param {(...args: P) => R} func
 */
export function withFixedTime<P extends any[], R>(
  time: string | number | Date,
  func: (...args: P) => R
): (...args: P) => R {
  const result = (...args: P) => {
    vi.useFakeTimers();
    vi.setSystemTime(time);
    const result = func(...args);
    if (
      typeof result === 'object' &&
      result !== null &&
      'then' in result &&
      typeof result.then === 'function'
    ) {
      return result.then((x: any) => {
        vi.useRealTimers();
        return x;
      });
    } else {
      vi.useRealTimers();
      return result;
    }
  };
  return result;
}
