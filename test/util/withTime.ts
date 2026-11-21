import { vi } from 'vitest';

/**
 * new Date()の結果を一定の日時に固定して関数を実行
 *
 * 関数が例外を投げた場合・Promise が reject された場合も，必ず実際の時刻に戻す
 * （戻さないと，後続のテストまで固定した日時のまま実行される）
 *
 * @param {string | number | Date} time
 * @param {(...args: P) => R} func
 */
export function withFixedTime<P extends unknown[], R>(
  time: string | number | Date,
  func: (...args: P) => R
): (...args: P) => R {
  const result = (...args: P) => {
    vi.useFakeTimers();
    vi.setSystemTime(time);
    let isAsync = false;
    try {
      const value = func(...args);
      if (value instanceof Promise) {
        isAsync = true;
        // 非同期の場合は，完了（成功・失敗のどちらでも）を待ってから実際の時刻に戻す
        return value.finally(() => vi.useRealTimers()) as R;
      }
      return value;
    } finally {
      if (!isAsync) vi.useRealTimers();
    }
  };
  return result;
}
