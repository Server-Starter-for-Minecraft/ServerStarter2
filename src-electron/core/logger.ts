import log4js from 'log4js';

log4js.addLayout('custom', function () {
  return function (logEvent) {
    const level = logEvent.level.levelStr;
    const category = logEvent.categoryName;
    const operation = logEvent.data[0];
    const state = logEvent.data[1];

    const args = logEvent.data[2];

    const data = logEvent.data
      .slice(3)
      .map((d) => {
        let text = d;
        if (text.length > 100) {
          text = text.slice(undefined, 97) + '...';
        }
        return text;
      })
      .join(', ');

    return `[${level}/${state}] ${category} ${operation}(${args}) ${data}`;
  };
});

log4js.configure({
  appenders: {
    _out: {
      type: 'stdout',
      layout: { type: 'custom' },
    },
    _file: {
      type: 'file',
      filename: 'logs/serverstarter.log',
      layout: { type: 'custom' },
    },
    out: { type: 'logLevelFilter', appender: '_out', level: 'error' },
    file: { type: 'logLevelFilter', appender: '_file', level: 'info' },
  },
  categories: {
    default: { appenders: ['out', 'file'], level: 'trace' },
  },
});

// export type loglevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal'

export function getLoggers(category: string | undefined) {
  const logger = log4js.getLogger(category);
  return {
    child(subcategory: string, kwargs: object | undefined) {
      if (category === undefined) {
        return getLoggers(subcategory);
      }
      return getLoggers(category + '.' + subcategory);
    },
    operation(operation: string, kwargs: object) {
      const args = Object.entries(kwargs)
        .map(([k, v]) => `${k}:${v}`)
        .join(', ');
      return {
        start(...message: any[]) {
          logger.trace(operation, 'start', args, ...message);
        },

        success(...message: any[]) {
          logger.info(operation, 'success', args, ...message);
        },

        fail(...message: any[]) {
          logger.info(operation, 'fail', args, ...message);
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
