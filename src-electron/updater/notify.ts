import { api } from 'app/src-electron/core/api';
import { OsPlatform } from 'app/src-electron/util/os';

/** linuxの最新版があることを通知 */
export const notifyUpdate = async (
  type: OsPlatform,
  systemVersion: string
): Promise<void> => {
  await api.send.NotifySystemUpdate(type, systemVersion);
};
