import { api } from 'app/src-electron/core/api';
import { onReadyWindow } from '../lifecycle/lifecycle';
import { OsPlatform } from '../schema/os';

/**
 * 最新版があることをwindowが生成されてから通知し、ダウンロードページへ案内する
 *
 * 自動アップデートに対応していないOS（linux）のほか、自動アップデートに失敗した場合にも利用する
 */
export const notifyUpdate = async (
  type: OsPlatform,
  systemVersion: string
): Promise<void> => {
  onReadyWindow(() => api.send.NotifySystemUpdate(type, systemVersion), true);
};
