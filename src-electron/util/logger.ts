import log4js from 'log4js';
import { Path } from './path';
import { asyncForEach } from './objmap';
import { c } from 'tar';

const LATEST = 'latest.log';

// ログファイルをtar.gzに圧縮して保存
async function compressArchive(logDir: Path, latestLog: Path) {
  const [logName, archivePath] = getArchivePath(
    logDir,
    await latestLog.lastUpdateTime()
  );

  const newlogPath = logDir.child(logName);
  await newlogPath.remove();

  await latestLog.copyTo(newlogPath);

  await c(
    {
      gzip: true,
      file: archivePath.path,
      cwd: logDir.path,
    },
    [logName]
  );
  await newlogPath.remove();
}

function stringify(data: any) {
  return JSON.stringify(data, (k, v) => (v === undefined ? 'undefined' : v));
}

log4js.addLayout('custom', function () {
  return function (logEvent) {
    const level = logEvent.level.levelStr;
    const category = logEvent.categoryName;
    const state = logEvent.data[0];
    const args = logEvent.data[1];

    const json = {
      level,
      state,
      category,
      args,
      data: logEvent.data.slice(2),
    };

    return stringify(json);

    // const data = logEvent.data
    //   .slice(2)
    //   .map((d) => {
    //     let text = stringify(d);
    //     if (config.max && text.length > config.max) {
    //       text = text.slice(undefined, config.max - 3) + '...';
    //     }
    //     return text;
    //   })
    //   .join(', ');

    // if (data === '') return `[${level}/${state}] ${category} (${args})`;

    // return `[${level}/${state}] ${category} (${args}): ${data}`;
  };
});

/** YYYY-MM-DD-HH */
function formatDate(date: Date) {
  function paddedNumber(n: number, digit: number) {
    return n.toString().padStart(digit, '0');
  }
  const YYYY = paddedNumber(date.getFullYear(), 4);
  const MM = paddedNumber(date.getMonth(), 2);
  const DD = paddedNumber(date.getDate(), 2);
  const HH = paddedNumber(date.getHours(), 2);

  return `${YYYY}-${MM}-${DD}-${HH}`;
}

function getArchivePath(logDir: Path, time: Date) {
  let i = 0;
  const format = formatDate(time);
  while (true) {
    const path = logDir.child(`${format}-${i}.tar.gz`);
    if (!path.exists()) {
      return [`${format}-${i}.log`, path] as const;
    }
    i += 1;
  }
}

async function archive(logDir: Path) {
  // .latestを圧縮してアーカイブ
  const latestLog = logDir.child(LATEST);
  if (latestLog.exists()) {
    await compressArchive(logDir, latestLog);
  }

  // 一週間前の日付
  const thresholdDate = new Date();
  thresholdDate.setDate(thresholdDate.getDate() - 7);

  await asyncForEach(await logDir.iter(), async (path) => {
    // 最終更新が一週間以上前のYYY-MM-DD-HH-I.logを削除する
    const match = path.basename().match(/\d{4}-\d{2}-\d{2}-\d{2}-\d+.tar.gz/);
    if (match) {
      const updateDate = await path.lastUpdateTime();
      if (updateDate < thresholdDate) {
        await path.remove();
      }
    }
  });
}

export function getRootLogger(logDir: Path): {
  logger: LoggerHierarchy;
  archive: () => Promise<void>;
} {
  logDir.child(LATEST).writeTextSync('');

  log4js.configure({
    appenders: {
      _out: {
        type: 'stdout',
        layout: { type: 'custom', max: 500 },
      },
      _file: {
        type: 'file',
        filename: logDir.child(LATEST).str(),
        layout: { type: 'custom', max: 500 },
      },
      out: { type: 'logLevelFilter', appender: '_out', level: 'warn' },
      file: { type: 'logLevelFilter', appender: '_file', level: 'trace' },
    },
    categories: {
      default: { appenders: ['out', 'file'], level: 'trace' },
    },
  });

  return { logger: getLoggerHierarchy(), archive: () => archive(logDir) };
}

// export type loglevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal'

const loggerSymbol = Symbol();

class LoggerWrapper {
  private logger: log4js.Logger;
  private arg: any;
  constructor(logger: log4js.Logger, arg: any) {
    this.logger = logger;
    this.arg = arg;
  }

  start(...message: any[]) {
    this.logger.trace('start', this.arg, ...message);
  }
  success(...message: any[]) {
    this.logger.info('success', this.arg, ...message);
  }
  fail(...message: any[]) {
    this.logger.info('fail', this.arg, ...message);
  }
  trace(...message: any[]) {
    this.logger.trace('trace', this.arg, ...message);
  }
  debug(...message: any[]) {
    this.logger.debug('debug', this.arg, ...message);
  }
  info(...message: any[]) {
    this.logger.info('info', this.arg, ...message);
  }
  warn(...message: any[]) {
    this.logger.warn('warn', this.arg, ...message);
  }
  error(...message: any[]) {
    this.logger.error('error', this.arg, ...message);
  }
  fatal(...message: any[]) {
    this.logger.fatal('fatal', this.arg, ...message);
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
