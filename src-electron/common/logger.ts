import dayjs, { Dayjs } from 'dayjs';
import log4js from 'log4js';
import { c } from 'tar';
import { Path } from '../util/binary/path';

const LATEST = 'latest.log';
const ARCHIVE_EXT = '.log.gz';

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

function getArchivePath(logDir: Path, time: Dayjs) {
  let i = 0;
  const format = time.format('YYYY-MM-DD-HH');
  while (true) {
    const path = logDir.child(`${format}-${i}${ARCHIVE_EXT}`);
    if (!path.exists()) {
      return [`${format}-${i}.log`, path] as const;
    }
    i += 1;
  }
}

async function archiveLog(logDir: Path) {
  // .latestを圧縮してアーカイブ
  const latestLog = logDir.child(LATEST);
  if (latestLog.exists()) {
    await compressArchive(logDir, latestLog);
  }

  // 一週間前のログファイルを削除
  const thresholdDate = dayjs().subtract(7, 'd');
  for (const path of await logDir.iter()) {
    if (!path.path.endsWith(ARCHIVE_EXT)) continue;
    const updateDate = await path.lastUpdateTime();
    if (updateDate.isBefore(thresholdDate)) await path.remove();
  }
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

  return { logger: getLoggerHierarchy(), archive: () => archiveLog(logDir) };
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
      category === undefined ? subCategory : `${category}.${subCategory}`;
    return getLoggerHierarchy(newCategory);
  },
};

/** In Source Testing */
if (import.meta.vitest) {
  const { test, expect } = import.meta.vitest;
  const path = await import('path');
  const { isError } = await import('../util/error/error');

  // 一時使用フォルダを初期化
  const workPath = new Path(__dirname).child(
    'work',
    path.basename(__filename, '.ts')
  );
  workPath.mkdir();

  // ログオブジェクト
  const { logger, archive } = getRootLogger(workPath);

  const logpath = workPath.child(LATEST);

  const readLastLogLine = async () => {
    const logTxt = await logpath.readText();
    if (isError(logTxt)) return logTxt;
    const lines = logTxt.trim().split(/\r?\n|\r/);
    return lines[lines.length - 1];
  };

  test('base logger test', async () => {
    const log = logger.test.base({});
    log.info('test message');
    expect(await readLastLogLine()).toBe(
      '{"level":"INFO","state":"info","category":"test.base","args":{},"data":["test message"]}'
    );
  });

  test('archive logs', async () => {
    await archive();
    const prefix = dayjs().format('YYYY-MM-DD-HH');
    const targetArchivePath = workPath.child(`${prefix}-0.log.gz`);
    expect(targetArchivePath.exists()).toBe(true);
  });

  // アーカイブデータが残っているとarchive logsのテストが意味をなさないため，毎回削除する
  test('remove work folder', async () => {
    await workPath.parent().remove();
    expect(workPath.exists()).toBe(false);
  });
}
