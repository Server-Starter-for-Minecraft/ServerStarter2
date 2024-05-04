import { createAppEvent } from './event';

/** electronのwillQuitイベント(すべてのwindowが閉じた後の処理)で発火されるイベント */
export const onQuit = createAppEvent();

/** electronのwillQuitイベント(すべてのwindowが閉じた後の処理)で発火されるイベント */
export const onReadyWindow = createAppEvent();

/**
 * 非同期処理の途中でアプリケーションが閉じられても、処理の終了を保証する
 *
 * 注釈: Windows では、システムのシャットダウン/再起動やユーザーのログアウトでアプリケーションが閉じられようとしている場合には、処理の終了は保証されない
 */
export async function assertComplete<T>(promise: Promise<T>) {
  const dispatch = onQuit(async () => {
    await promise;
  }, true);
  const result = await promise;
  dispatch();
  return result;
}

export function readyWindow() {
  onReadyWindow.invoke();
}
