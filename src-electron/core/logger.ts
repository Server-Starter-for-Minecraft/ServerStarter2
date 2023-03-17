import log4js from 'log4js';

log4js.configure({
  appenders: {
    out: {
      type: 'stdout',
      // layout: {
      //   type: 'pattern',
      //   pattern: '[%p: %d] #%c [%m{0,1}] %m{1,2} %m{2}%n',
      // },
    },
    log: { type: 'file', filename: 'logs/serverstarter.log' },
  },
  categories: {
    default: { appenders: ['out', 'log'], level: 'debug' },
  },
});

// export type loglevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export function getLoggers(category: string | undefined) {
  const logger = log4js.getLogger(category);
  return {
    child(subcategory: string) {
      if (category === undefined) {
        return getLoggers(subcategory);
      }
      return getLoggers(category + '.' + subcategory);
    },
    operation(operation: string, kwargs: Object) {
      const args =
        '(' +
        Object.entries(kwargs)
          .map(([k, v]) => `${k}:${v}`)
          .join(', ') +
        ')';
      return {
        start(...message: any[]) {
          logger.debug(operation, 'start', args, ...message);
        },

        success(...message: any[]) {
          logger.debug(operation, 'success', args, ...message);
        },

        fail(...message: any[]) {
          logger.debug(operation, 'fail', args, ...message);
        },

        trace(...message: any[]) {
          logger.trace(operation, 'trace', args, ...message);
        },

        debug(...message: any[]) {
          logger.debug(operation, 'debug', args, ...message);
        },

        info(...message: any[]) {
          logger.info(operation, 'info', args, ...message);
        },

        warn(...message: any[]) {
          logger.warn(operation, 'warn', args, ...message);
        },

        error(...message: any[]) {
          logger.error(operation, 'error', args, ...message);
        },

        fatal(...message: any[]) {
          logger.fatal(operation, 'fatal', args, ...message);
        },
      };
    },
  };
}

export const rootLoggers = getLoggers(undefined);
