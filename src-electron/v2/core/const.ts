import { app } from 'electron';
import { RuntimeSettings } from '../schema/runtime';
import { Path } from '../util/binary/path';

/**
 * システムで使用する定数
 */

export const defaultRuntimeSettings: RuntimeSettings = {
  memory: [2, 'GB'],
};
