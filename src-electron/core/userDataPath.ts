import { app } from 'electron';
import { Path } from './utils/path/path';

export const userDataPath = new Path(app?.getPath('userData') ?? 'userData').absolute();
