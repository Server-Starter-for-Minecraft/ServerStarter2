import { randomInt } from 'crypto';
import dayjs, { Dayjs } from 'dayjs';
import * as fs from 'fs-extra';
import log4js from 'log4js';
import { onQuit } from '../lifecycle/lifecycle';
import { logDir } from '../source/const';
import { gzip } from '../util/binary/archive/gz';
import { Path } from '../util/binary/path';
import { isError } from '../util/error/error';
import { InfinitMap } from '../util/helper/infinitMap';

const LATEST = 'latest.log';
const TMP_LOG = `tmp.${randomInt(2 ** 31)}`;
const ARCHIVE_EXT = '.log.gz';

fs.ensureDirSync(logDir.path);
const latestPath = logDir.child(LATEST);
const beforeArchivePath = latestPath.parent().child(TMP_LOG);

// LATASTの上書き前にアーカイブファイルを作成
fs.copyFileSync(latestPath.path, beforeArchivePath.path);
archiveLog(beforeArchivePath);

// #region log4jsの設定

/**
 * 与えられたログオブジェクトを省略して，人間が見やすい文字列に出力する
 * TODO: テストを追加
 */
function truncateValue(value: any, depth = 0): string {
  const MAX_ARRAY_ITEMS = 1;
  const MAX_OBJECT_ITEMS = 3;
  const MAX_STRING_LENGTH = 50;

  if (depth > 2) return '...'; // ネストが深すぎる場合は省略

  if (Array.isArray(value)) {
    if (value.length <= MAX_ARRAY_ITEMS * 2) {
      // 配列の場合，深さ`depth`は深くなっていないと判断して，`depth + 1`としない
      return `[${value.map((v) => truncateValue(v, depth)).join(', ')}]`;
    }
    const first = value.slice(0, MAX_ARRAY_ITEMS);
    const last = value.slice(-MAX_ARRAY_ITEMS);
    return `[${first.map((v) => truncateValue(v, depth)).join(', ')}, ... ${
      value.length - MAX_ARRAY_ITEMS * 2
    } more ..., ${last.map((v) => truncateValue(v, depth)).join(', ')}]`;
  }

  if (typeof value === 'string') {
    if (value.length > MAX_STRING_LENGTH) {
      const half = Math.floor(MAX_STRING_LENGTH / 2);
      return `${value.slice(0, half)}...${value.slice(-half)}`;
    }
    return value;
  }

  if (typeof value === 'object' && value !== null) {
    const entries = Object.entries(value);
    if (entries.length === 0) return '{}';
    if (entries.length > MAX_OBJECT_ITEMS) {
      const important = entries.slice(0, MAX_OBJECT_ITEMS);
      return `{ ${important
        .map(([k, v]) => `${k}: ${truncateValue(v, depth + 1)}`)
        .join(', ')}, ... ${entries.length - MAX_OBJECT_ITEMS} more fields }`;
    }
    return `{ ${entries
      .map(([k, v]) => `${k}: ${truncateValue(v, depth + 1)}`)
      .join(', ')} }`;
  }

  return String(value);
}

log4js.addLayout('fullLog', () => {
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
log4js.addLayout('truncateLog', () => {
  return (logEvent) => {
    const level = logEvent.level.levelStr.padEnd(5);
    const category = logEvent.categoryName;
    const time = dayjs(logEvent.startTime).format('HH:mm:ss.SSS');
    const param = logEvent.data[0];
    const msg = logEvent.data[1];

    let output = `[${time}] ${level} ${category}`;
    if (param !== undefined) {
      output += ` (${truncateValue(param)})`;
    }
    if (msg !== undefined) {
      output += `: ${truncateValue(msg)}`;
    }
    return output;
  };
});
log4js.configure({
  appenders: {
    // TODO: ログファイルに出力＆アーカイブ処理を修正
    _out: {
      type: 'stdout',
      layout: { type: 'truncateLog', max: 500 },
    },
    _file: {
      type: 'file',
      filename: latestPath.path,
      layout: { type: 'fullLog', max: 500 },
      flags: 'w',
    },
    out: { type: 'logLevelFilter', appender: '_out', level: 'trace' },
    file: { type: 'logLevelFilter', appender: '_file', level: 'trace' },
  },
  categories: {
    default: { appenders: ['out', 'file'], level: 'trace' },
    // default: { appenders: ['file'], level: 'trace' },
  },
});

// #endregion

// システム終了時にログの記録終了を明示的に宣言
onQuit(log4js.shutdown, true);

/** パスにあるログをアーカイブする */
async function archiveLog(logPath: Path) {
  // .latestを圧縮してアーカイブ
  if (logPath.exists()) {
    const lastUpdateTime = await logPath.lastUpdateTime();
    const compressed = await gzip.fromFile(logPath);
    if (!isError(compressed)) {
      await compressed.write(getNextArchivePath(lastUpdateTime).path);
    }
    await logPath.remove();
  }

  // 一週間前のログファイルとTMPファイルを削除
  const thresholdDate = dayjs().subtract(7, 'd');
  const paths = await logDir.iter();
  if (isError(paths)) return;
  for (const path of paths) {
    if (!path.path.endsWith(ARCHIVE_EXT)) continue;
    if (path.basename().startsWith('tmp')) {
      await path.remove();
      continue;
    }
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

type LogOmission = (value: string, path: (string | number)[]) => string;

// TODO: 以下の伏字ルールを追加
// IPアドレス
// Ngrokのトークン
const omissions: Set<LogOmission> = new Set();

/** オブジェクトに伏字を適用する */
function applyOmission<T>(value: T, path: (string | number)[] = []): T {
  switch (typeof value) {
    case 'string':
      let val: string = value;
      for (const omission of omissions) {
        val = omission(val, path);
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
    await workPath.emptyDir();

    const logpath = workPath.child('test.log');

    const readLogLines = async () => {
      const logTxt = await logpath.readText();
      if (isError(logTxt)) return logTxt;
      return logTxt.trim().split(/\r?\n|\r/);
    };

    // テスト用ログ設定
    log4js.configure({
      appenders: {
        test: {
          type: 'fileSync',
          filename: logpath.path,
          layout: { type: 'fullLog', max: 500 },
        },
      },
      categories: {
        default: { appenders: ['test'], level: 'trace' },
      },
    });

    test('ログ出力のテスト', async () => {
      rootLogger('DEFAULT').info('message');
      expect(await readLogLines()).toContain(
        '{"lv":"INFO","on":"default","param":"DEFAULT","msg":"message"}'
      );

      rootLogger.custom('multi', ['value']).warn({ key: 'value' });
      expect(await readLogLines()).toContain(
        '{"lv":"WARN","on":"custom","param":["multi",["value"]],"msg":{"key":"value"}}'
      );

      rootLogger.nest.more.deeply().trace();
      expect(await readLogLines()).toContain(
        '{"lv":"TRACE","on":"nest.more.deeply"}'
      );

      // 伏字チェック

      const unsetRule = addOmisstionRule((v) => (v === 'invalid' ? '***' : v));

      rootLogger().info('invalid');
      expect(await readLogLines()).toContain(
        '{"lv":"INFO","on":"default","msg":"***"}'
      );

      log4js.recording();

      rootLogger().info({ nest: 'invalid' });
      expect(await readLogLines()).toContain(
        '{"lv":"INFO","on":"default","msg":{"nest":"***"}}'
      );

      rootLogger().info(['pass', 'is', 'invalid']);
      expect(await readLogLines()).toContain(
        '{"lv":"INFO","on":"default","msg":["pass","is","***"]}'
      );

      unsetRule();

      rootLogger().info('invalid');
      expect(await readLogLines()).toContain(
        '{"lv":"INFO","on":"default","msg":"invalid"}' // 伏字ルールが消えているはず
      );

      addOmisstionRule((v, p) => (p[p.length - 1] === 'secret' ? '***' : v));

      rootLogger({ secret: 'XXXXXX' }).info();
      expect(await readLogLines()).toContain(
        '{"lv":"INFO","on":"default","param":{"secret":"***"}}'
      );

      // アーカイブチェック
      const logPaths = await logDir.iter();
      expect(isError(logPaths)).toBe(false);
      if (isError(logPaths)) return;
      for (const path of logPaths) {
        if (path.path === latestPath.path) continue;
        await path.remove();
      }
      await archiveLog(logpath);

      // アーカイブされて、YYYY-MM-DD-HH-0.log.gz ができているはず
      const logPaths2 = await logDir.iter();
      expect(isError(logPaths2)).toBe(false);
      if (isError(logPaths2)) return;
      expect(logPaths2.map((p) => p.basename())).toEqual(
        expect.arrayContaining([
          expect.stringMatching(/\d{4}-\d{2}-\d{2}-\d{2}-0.log.gz/),
        ])
      );
      // アーカイブされると元ファイルは削除されるが，
      // アーカイブをwriteしたログが新たに書き込まれるため，
      // ログの中に当初書き込んだログがないことを確認する
      // expect(logpath.exists()).toBe(false);
      expect(await readLogLines()).not.toContain(
        '{"lv":"INFO","on":"default","param":"DEFAULT","msg":"message"}'
      );
    });
  });
}
