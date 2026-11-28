import { describe, expect, test, vi } from 'vitest';
import { runDetached } from './runDetached';

/** 実行中の Promise の後続処理（then のコールバック）がすべて終わるまで待つ */
const flush = async () => new Promise((resolve) => setTimeout(resolve, 0));

describe('runDetached', () => {
  test('成功した場合は onError を呼ばない', async () => {
    const onError = vi.fn();
    runDetached(Promise.resolve(1), onError);
    await flush();
    expect(onError).not.toHaveBeenCalled();
  });

  test('Failable のエラーを返した場合は onError に渡す', async () => {
    const onError = vi.fn();
    const error = { type: 'error', key: 'system.assertion', level: 'error' };
    runDetached(Promise.resolve(error), onError);
    await flush();
    expect(onError).toHaveBeenCalledWith(error);
  });

  test('例外が発生した場合は onError に渡す', async () => {
    const onError = vi.fn();
    const error = new Error('failed');
    runDetached(Promise.reject(error), onError);
    await flush();
    expect(onError).toHaveBeenCalledWith(error);
  });
});
