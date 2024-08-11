import { randomInt } from 'crypto';
import dayjs, { Dayjs } from 'dayjs';
import * as fs from 'fs-extra';
import log4js from 'log4js';
import { err, ok, Result } from '../util/base';
import { toGzip } from '../util/binary/converter/gzip';
import { Path } from '../util/binary/path';
import { InfinitMap } from '../util/helper/infinitMap';
import { logDir } from './paths';

fs.ensureDirSync(logDir.toStr());
const latestPath = logDir.child('latest.log');

const ARCHIVE_EXT = '.log.gz';

//#region log4jsの設定

log4js.addLayout('custom', () => {
  return (logEvent) => {
    const level = logEvent.level.levelStr;
    const category = logEvent.categoryName;
    const param = logEvent.data[0];
    const json = {
      lv: level,
      on: category,
      param,
      msg: logEvent.data[1],
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
      filename: latestPath.toStr(),
      layout: { type: 'custom', max: 500 },
    },
    out: { type: 'logLevelFilter', appender: '_out', level: 'warn' },
    file: { type: 'logLevelFilter', appender: '_file', level: 'trace' },
  },
  categories: {
    default: { appenders: ['out', 'file'], level: 'trace' },
  },
});

//#endregion

/** 過去のログをアーカイブ開始 */
if (latestPath) archiveLog(latestPath);

/** パスにあるログをアーカイブする */
async function archiveLog(logPath: Path) {
  // .latestをgz圧縮してアーカイブ
  if (logPath.exists()) {
    const lastUpdateTime = dayjs(fs.statSync(logPath.toStr()).mtimeMs);
    const tmp = logDir.child(`tmp.${randomInt(2 ** 31)}`);
    fs.moveSync(logPath.toStr(), tmp.toStr(), { overwrite: true });
    await tmp.convert(toGzip()).into(getNextArchivePath(lastUpdateTime));
    await tmp.remove();
  }

  // 一週間前のログファイルを削除
  const thresholdDate = dayjs().subtract(7, 'day');
  for (const path of await logPath.iter()) {
    if (!path.toStr().endsWith(ARCHIVE_EXT)) continue;
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
    (level: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal') =>
    (...message: any[]) =>
      this.logger[level](
        applyOmission(this.arg),
        simplifyArgs(...applyOmission(message))
      ); // 伏字処理を施してログを吐く

  trace = this.log('trace');
  debug = this.log('debug');
  info = this.log('info');
  warn = this.log('warn');
  error = this.log('error');
  fatal = this.log('fatal');
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
) => Result<string, void>;

const omissions: Set<LogOmission> = new Set();

/** オブジェクトに伏字を適用する */
function applyOmission<T>(value: T, path: (string | number)[] = []): T {
  switch (typeof value) {
    case 'string':
      let val: string = value;
      for (const omission of omissions) {
        const omitted = omission(val, path);
        if (omitted.isOk) val = omitted.value();
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
  const { test, expect } = import.meta.vitest;

  const readLastLogLine = async () => {
    const lines = await (
      await latestPath.readText()
    )
      .value()
      .trim()
      .split(/\r?\n|\r/);
    return lines[lines.length - 1];
  };

  test('ログ出力のテスト', async () => {
    for (const path of await logDir.iter()) {
      if (path.toStr() === latestPath.toStr()) continue;
      await path.remove();
    }

    rootLogger('DEFAULT').info('message');
    expect(await readLastLogLine()).toBe(
      '{"lv":"INFO","on":"default","param":"DEFAULT","msg":"message"}'
    );

    rootLogger.custom('multi', ['value']).warn({ key: 'value' });
    expect(await readLastLogLine()).toBe(
      '{"lv":"WARN","on":"custom","param":["multi",["value"]],"msg":{"key":"value"}}'
    );

    rootLogger.nest.more.deeply().trace();
    expect(await readLastLogLine()).toEqual(
      '{"lv":"TRACE","on":"nest.more.deeply"}'
    );

    // 伏字チェック

    const unsetRule = addOmisstionRule((v) =>
      v === 'invalid' ? ok('***') : err()
    );

    rootLogger().info('invalid');
    expect(await readLastLogLine()).toBe(
      '{"lv":"INFO","on":"default","msg":"***"}'
    );

    rootLogger().info({ nest: 'invalid' });
    expect(await readLastLogLine()).toBe(
      '{"lv":"INFO","on":"default","msg":{"nest":"***"}}'
    );

    rootLogger().info(['pass', 'is', 'invalid']);
    expect(await readLastLogLine()).toBe(
      '{"lv":"INFO","on":"default","msg":["pass","is","***"]}'
    );

    unsetRule();

    rootLogger().info('invalid');
    expect(await readLastLogLine()).toBe(
      '{"lv":"INFO","on":"default","msg":"invalid"}' // 伏字ルールが消えているはず
    );

    addOmisstionRule((v, p) =>
      p[p.length - 1] === 'secret' ? ok('***') : err()
    );

    rootLogger({ secret: 'XXXXXX' }).info();
    expect(await readLastLogLine()).toBe(
      '{"lv":"INFO","on":"default","param":{"secret":"***"}}'
    );

    // アーカイブチェック
    for (const path of await logDir.iter()) {
      if (path.toStr() === latestPath.toStr()) continue;
      await path.remove();
    }
    await archiveLog(latestPath);

    // アーカイブされて、YYYY-MM-DD-HH-0.log.gz ができているはず
    expect((await logDir.iter()).map((p) => p.basename())).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/\d{4}-\d{2}-\d{2}-\d{2}-0.log.gz/),
      ])
    );
    expect(latestPath.exists()).toBe(false);
  });
}
