import { readyWindow as dispatchReadyWindow } from 'app/src-electron/lifecycle/lifecycle';

/**
 * 画面の準備が完了したことを通知する（フロントエンドからの要求の窓口）
 *
 * IPC の API（ipc/back.ts）からはバックエンドの処理（source）のみを呼び出す設計のため，
 * ライフサイクルのイベントはこのファイルを通して発火する
 */
export async function readyWindow(): Promise<void> {
  await dispatchReadyWindow();
}
