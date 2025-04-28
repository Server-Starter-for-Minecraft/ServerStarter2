import { getRootLogger, rootLogger } from '../common/logger';
import { onQuit } from '../lifecycle/lifecycle';
import { logDir } from '../source/const';

const { logger, archive } = getRootLogger(logDir);

onQuit(archive, true);

export const rootLoggerHierarchy = rootLogger;
