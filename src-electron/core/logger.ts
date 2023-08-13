import { onQuit } from '../lifecycle/lifecycle';
import { getRootLogger } from '../util/logger';
import { logPath } from './const';

const { logger, archive } = getRootLogger(logPath);

onQuit(archive, true);

export const rootLoggerHierarchy = logger;
