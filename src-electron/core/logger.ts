import { onQuit } from '../lifecycle/lifecycle';
import { getRootLogger } from '../util/logger/logger';
import { mainPath } from './const';

const dirPath = mainPath.child('log/serverstarter');

const { logger, archive } = getRootLogger(dirPath);

onQuit(archive, true);

export const rootLoggerHierarchy = logger;
