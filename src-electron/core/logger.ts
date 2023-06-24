import log4js from 'log4js';
import { mainPath } from 'src-electron/core/const';

log4js.addLayout('custom', function (config: { max?: number }) {
  return function (logEvent) {
    const level = logEvent.level.levelStr;
    const category = logEvent.categoryName;
    const state = logEvent.data[0];
    const args = logEvent.data[1];

    const data = logEvent.data
      .slice(2)
      .map((d) => {
        let text = d;
        if (config.max && text.length > config.max) {
          text = text.slice(undefined, config.max - 3) + '...';
        }
        return text;
      })
      .join(', ');

    if (data === '') return `[${level}/${state}] ${category} (${args})`;

    return `[${level}/${state}] ${category} (${args}): ${data}`;
  };
});

log4js.configure({
  appenders: {
    _out: {
      type: 'stdout',
      layout: { type: 'custom', max: 500 },
    },
    _file: {
      type: 'file',
      filename: mainPath.child('logs/serverstarter.log').path,
      //filename: 'logs/serverstarter.log',
      layout: { type: 'custom', max: 500 },
    },
    out: { type: 'logLevelFilter', appender: '_out', level: 'warn' },
    file: { type: 'logLevelFilter', appender: '_file', level: 'info' },
  },
  categories: {
    default: { appenders: ['out', 'file'], level: 'trace' },
  },
});

// export type loglevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal'

const loggerSymbol = Symbol();

class LoggerWrapper {
  private logger: log4js.Logger;
  private argstr: string;
  constructor(logger: log4js.Logger, kwargs: object) {
    this.logger = logger;

    this.argstr = Object.entries(kwargs)
      .map(([k, v]) => `${k}:${v}`)
      .join(', ');
  }

  start(...message: any[]) {
    this.logger.trace('start', this.argstr, ...message);
  }
  success(...message: any[]) {
    this.logger.info('success', this.argstr, ...message);
  }
  fail(...message: any[]) {
    this.logger.info('fail', this.argstr, ...message);
  }
  trace(...message: any[]) {
    this.logger.trace('trace', this.argstr, ...message);
  }
  debug(...message: any[]) {
    this.logger.debug('debug', this.argstr, ...message);
  }
  info(...message: any[]) {
    this.logger.info('info', this.argstr, ...message);
  }
  warn(...message: any[]) {
    this.logger.warn('warn', this.argstr, ...message);
  }
  error(...message: any[]) {
    this.logger.error('error', this.argstr, ...message);
  }
  fatal(...message: any[]) {
    this.logger.fatal('fatal', this.argstr, ...message);
  }
}

export interface LoggerHierarchy extends Record<string, LoggerHierarchy> {
  [loggerSymbol]: string | undefined;
  (kwargs: object): LoggerWrapper;
}

function getLoggerHierarchy(category?: string | undefined) {
  const childLogger = log4js.getLogger(category);

  const loggerHierarchy: LoggerHierarchy = ((kwargs: object) =>
    new LoggerWrapper(childLogger, kwargs)) as LoggerHierarchy;

  loggerHierarchy[loggerSymbol] = category;

  return new Proxy<LoggerHierarchy>(loggerHierarchy, handler);
}

const handler: ProxyHandler<LoggerHierarchy> = {
  get(target, subCategory: string) {
    const category = target[loggerSymbol];
    const newCategory =
      category === undefined ? subCategory : category + '.' + subCategory;
    return getLoggerHierarchy(newCategory);
  },
};

export const rootLoggerHierarchy = getLoggerHierarchy();

// export function getLoggers(category: string | undefined) {
//   const logger = log4js.getLogger(category);
//   return {
//     child(subcategory: string, kwargs: object | undefined) {
//       if (category === undefined) {
//         return getLoggers(subcategory);
//       }
//       return getLoggers(category + '.' + subcategory);
//     },
//     operation(operation: string, kwargs: object) {
//       const args = Object.entries(kwargs)
//         .map(([k, v]) => `${k}:${v}`)
//         .join(', ');
//       return {
//         start(...message: any[]) {
//           logger.trace(operation, 'start', args, ...message);
//         },

//         success(...message: any[]) {
//           logger.info(operation, 'success', args, ...message);
//         },

//         fail(...message: any[]) {
//           logger.info(operation, 'fail', args, ...message);
//         },

//         trace(...message: any[]) {
//           logger.trace(operation, 'trace', args, ...message);
//         },

//         debug(...message: any[]) {
//           logger.debug(operation, 'debug', args, ...message);
//         },

//         info(...message: any[]) {
//           logger.info(operation, 'info', args, ...message);
//         },

//         warn(...message: any[]) {
//           logger.warn(operation, 'warn', args, ...message);
//         },

//         error(...message: any[]) {
//           logger.error(operation, 'error', args, ...message);
//         },

//         fatal(...message: any[]) {
//           logger.fatal(operation, 'fatal', args, ...message);
//         },
//       };
//     },
//   };
// }

// export const rootLoggers = getLoggers(undefined);
