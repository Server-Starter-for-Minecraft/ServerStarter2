import { app } from 'electron';
import { RuntimeSettings } from '../schema/runtime';
import { Path } from '../util/binary/path';

/**
 * システムで使用する定数
 */

export const defaultRuntimeSettings: RuntimeSettings = {
  memory: [2, 'GB'],
};

const mainPath = (
  process.env.DEBUGGING || !app
    ? new Path('userData')
    : new Path(app?.getPath('userData'))
).absolute();

const sourcePath = mainPath.child('serverstarter/source');

export const datapackSourcePath = sourcePath.child('datapack');

export const serverSourcePath = sourcePath.child('server');
