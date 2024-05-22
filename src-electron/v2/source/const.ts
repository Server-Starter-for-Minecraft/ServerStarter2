import { app } from 'electron';
import { Path } from '../util/binary/path';

const userDataPath = (
  process.env.DEBUGGING || !app
    ? new Path('userData')
    : new Path(app?.getPath('userData'))
).absolute();

export const mainPath = userDataPath.child('serverstarter');
