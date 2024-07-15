import { app } from 'electron';
import { Path } from '../util/binary/path';

const mainPath = (
  process.env.DEBUGGING || !app
    ? new Path('userData')
    : new Path(app?.getPath('userData'))
).absolute();

/** ログファイルの格納先 */
export const logDir = mainPath.child('serverstarter/log');

const sourcePath = mainPath.child('serverstarter/source');

export const datapackSourcePath = sourcePath.child('datapack');

export const serverSourcePath = sourcePath.child('server');
