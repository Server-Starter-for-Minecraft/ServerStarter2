import { randomInt } from 'crypto';
import dayjs, { Dayjs } from 'dayjs';
import * as fs from 'fs-extra';
import log4js from 'log4js';
import { Failable } from '../schema/error';
import { logDir } from '../source/const';
import { gzip } from '../util/binary/archive/gz';
import { Path } from '../util/binary/path';
import { isError } from '../util/error/error';
import { InfinitMap } from '../util/helper/infinitMap';

const LATEST = 'latest.log';
const ARCHIVE_EXT = '.log.gz';

fs.ensureDirSync(logDir.path);
const latestPath = logDir.child('latest.log');

// #region log4jsの設定

log4js.addLayout('custom', () => {
  return (logEvent) => {
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

    return JSON.stringify(json);
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
      filename: logDir.child(LATEST).path,
      layout: { type: 'custom', max: 500 },
    },
    out: { type: 'logLevelFilter', appender: '_out', level: 'warn' },
    file: { type: 'logLevelFilter', appender: '_file', level: 'trace' },
  },
  categories: {
    default: { appenders: ['out', 'file'], level: 'trace' },
  },
});

// #endregion

/** 過去のログをアーカイブ開始 */
if (latestPath) archiveLog(latestPath);

/** パスにあるログをアーカイブする */
async function archiveLog(logPath: Path) {
  // .latestを圧縮してアーカイブ
  const latestLog = logDir.child(LATEST);
  if (latestLog.exists()) {
    const lastUpdateTime = dayjs(fs.statSync(logDir.path).mtimeMs);
    const tmp = logDir.child(`tmp.${randomInt(2 ** 31)}`);
    await logPath.moveTo(tmp, { overwrite: true });
    const compressed = await gzip.fromFile(tmp);
    if (!isError(compressed)) {
      await compressed.write(getNextArchivePath(lastUpdateTime).path);
    }
    await tmp.remove();
  }

  // 一週間前のログファイルを削除
  const thresholdDate = dayjs().subtract(7, 'd');
  const paths = await logPath.iter();
  if (isError(paths)) return;
  for (const path of paths) {
    if (!path.path.endsWith(ARCHIVE_EXT)) continue;
    const updateDate = await path.lastUpdateTime();
    if (updateDate.isBefore(thresholdDate)) await path.remove();
  }
}

function getNextArchivePath(time: Dayjs): Path {
  let i = 0;
  const prefix = time.format('YYYY-MM-DD-HH');
  while (true) {
    const path = logDir.child(`${prefix}-${i}${ARCHIVE_EXT}`);
    if (!path.exists()) return path;
    i += 1;
  }
}

// export type loglevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal'

const CATEGORY = Symbol();

class LoggerWrapper {
  private logger: log4js.Logger;
  private arg: any;
  constructor(logger: log4js.Logger, arg: any) {
    this.logger = logger;
    this.arg = arg;
  }

  private log =
    (
      level:
        | 'start'
        | 'success'
        | 'fail'
        | 'trace'
        | 'debug'
        | 'info'
        | 'warn'
        | 'error'
        | 'fatal'
    ) =>
    (...message: any[]) =>
      this.logger[level](
        applyOmission(this.arg),
        simplifyArgs(...applyOmission(message))
      ); // 伏字処理を施してログを吐く

  // TODO: start, success, fail を削除
  start = this.log('start');
  success = this.log('success');
  fail = this.log('fail');

  trace = this.log('trace');
  debug = this.log('debug');
  info = this.log('info');
  warn = this.log('warn');
  error = this.log('error');
  fatal = this.log('fatal');

  // start(...message: any[]) {
  //   this.logger.trace('start', this.arg, ...message);
  // }
  // success(...message: any[]) {
  //   this.logger.info('success', this.arg, ...message);
  // }
  // fail(...message: any[]) {
  //   this.logger.info('fail', this.arg, ...message);
  // }
  // trace(...message: any[]) {
  //   this.logger.trace('trace', this.arg, ...message);
  // }
  // debug(...message: any[]) {
  //   this.logger.debug('debug', this.arg, ...message);
  // }
  // info(...message: any[]) {
  //   this.logger.info('info', this.arg, ...message);
  // }
  // warn(...message: any[]) {
  //   this.logger.warn('warn', this.arg, ...message);
  // }
  // error(...message: any[]) {
  //   this.logger.error('error', this.arg, ...message);
  // }
  // fatal(...message: any[]) {
  //   this.logger.fatal('fatal', this.arg, ...message);
  // }
}

export interface LoggerHierarchy extends Record<string, LoggerHierarchy> {
  [CATEGORY]: string | undefined;
  /** ワールド名やサーバーid等,実行コンテクストを過不足なく提供するとよい */
  (...args: any[]): LoggerWrapper;
}

const loggerHierarchies = InfinitMap.primitiveKeyStrongValue(
  (category: string) => {
    const logger = log4js.getLogger(category || undefined);
    const loggerHierarchy: LoggerHierarchy = ((...args: any[]) => {
      return new LoggerWrapper(logger, simplifyArgs(...args));
    }) as LoggerHierarchy;
    loggerHierarchy[CATEGORY] = category;
    return new Proxy<LoggerHierarchy>(loggerHierarchy, handler);
  }
);

/**
 * argsの個数に応じて戻り値が変わる
 * - argsが0この場合 - undefined
 * - argsが1この場合 - args[0]
 * - argsが2この場合 - args
 */
function simplifyArgs(...args: any[]): any {
  const params =
    args.length === 0 ? undefined : args.length === 1 ? args[0] : args;
  return params;
}

type LogOmission = (
  value: string,
  path: (string | number)[]
) => Failable<string>;

const omissions: Set<LogOmission> = new Set();

/** オブジェクトに伏字を適用する */
function applyOmission<T>(value: T, path: (string | number)[] = []): T {
  switch (typeof value) {
    case 'string':
      let val: string = value;
      for (const omission of omissions) {
        const omitted = omission(val, path);
        if (!isError(omitted)) val = omitted;
      }
      return val as T;
    case 'object': {
      if (value === null) return null as T;
      if (Array.isArray(value)) {
        return value.map((v, i) => applyOmission(v, [...path, i])) as T;
      }
      return Object.fromEntries(
        Object.entries(value).map(([k, v]) => [
          k,
          applyOmission(v, [...path, k]),
        ])
      ) as T;
    }
    default:
      return value;
  }
}

const handler: ProxyHandler<LoggerHierarchy> = {
  get(target, subCategory: string) {
    const category = target[CATEGORY];
    const newCategory = category ? `${category}.${subCategory}` : subCategory;
    return loggerHierarchies.get(newCategory);
  },
};

/**
 * 伏字ルールを追加
 * @returns 伏字ルールを解除する
 */
export function addOmisstionRule(omisstionRule: LogOmission) {
  omissions.add(omisstionRule);
  return () => omissions.delete(omisstionRule);
}

/** ルート要素のロガー */
export const rootLogger = loggerHierarchies.get('');

/** In Source Testing */
if (import.meta.vitest) {
  const { describe, test, expect } = import.meta.vitest;

  describe('logger', async () => {
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
  });
}
