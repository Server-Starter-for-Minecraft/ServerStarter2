import { createAppEvent } from './event';

/** electronのwillQuitイベント(すべてのwindowが閉じた後の処理)で発火されるイベント */
export const onQuit = createAppEvent();
