import { api } from 'app/src-electron/core/api';
import { onReadyWindow } from '../lifecycle/lifecycle';
import { OsPlatform } from '../schema/os';

/** linuxの最新版があることをwindowが生成されてから通知 */
export const notifyUpdate = async (
  type: OsPlatform,
  systemVersion: string
): Promise<void> => {
  onReadyWindow(() => api.send.NotifySystemUpdate(type, systemVersion), true);
};
