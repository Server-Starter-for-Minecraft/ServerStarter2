import { getRootLogger } from '../common/logger';
import { onQuit } from '../lifecycle/lifecycle';
import { logPath } from '../source/const';

const { logger, archive } = getRootLogger(logPath);

onQuit(archive, true);

export const rootLoggerHierarchy = logger;
