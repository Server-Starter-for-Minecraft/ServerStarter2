import { api } from 'app/src-electron/core/api';
import { OsPlatform } from 'app/src-electron/util/os';
import { onReadyWindow } from '../lifecycle/lifecycle';

/** linuxの最新版があることをwindowが生成されてから通知 */
export const notifyUpdate = async (
  type: OsPlatform,
  systemVersion: string
): Promise<void> => {
  onReadyWindow(() => api.send.NotifySystemUpdate(type, systemVersion), true);
};
