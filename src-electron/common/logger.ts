import { randomInt } from 'crypto';
import dayjs, { Dayjs } from 'dayjs';
import { app } from 'electron';
import * as fs from 'fs-extra';
import log4js from 'log4js';
import { c } from 'tar';
import { onQuit } from '../lifecycle/lifecycle';
import { logDir } from '../source/const';
import { Path } from '../util/binary/path';
import { isError } from '../util/error/error';
import { InfinitMap } from '../util/helper/infinitMap';

const TIME_FORMAT = 'YYYY-MM-DD HH:mm:ss.SSS';
const LATEST = 'latest';
const EXTs = ['.log', '.truncate.log'];
const TMP_LOG = `tmp_${randomInt(2 ** 31)}`;
const ARCHIVE_EXT = '.log.tar.gz';

fs.ensureDirSync(logDir.path);
const logPaths = EXTs.map((ext) => logDir.child(`${LATEST}${ext}`));
const beforeArchivePaths = EXTs.map((ext) => logDir.child(`${TMP_LOG}${ext}`));

// LATASTの上書き前にアーカイブファイルを作成
// Testの時には下記のコードは実行しない
if (app && logPaths.every((path) => path.exists())) {
  logPaths.forEach((path, idx) =>
    fs.copyFileSync(path.path, beforeArchivePaths[idx].path)
  );
  archiveLog(...beforeArchivePaths);
}

// #region log4jsの設定

/**
 * 与えられたログオブジェクトを省略して，人間が見やすい文字列に出力する
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
    const time = dayjs(logEvent.startTime).format(TIME_FORMAT);
    const level = logEvent.level.levelStr;
    const category = logEvent.categoryName;
    const param = logEvent.data[0];
    const json = {
      t: time,
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
    const time = dayjs(logEvent.startTime).format(TIME_FORMAT);
    const param = logEvent.data[0];
    const msg = logEvent.data[1];

    let output = `[${level} ${time}] ${category}`;
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
    _fileFull: {
      type: 'file',
      filename: logPaths[0].path,
      layout: { type: 'fullLog', max: 500 },
      flags: 'w',
    },
    _fileTruncate: {
      type: 'file',
      filename: logPaths[1].path,
      layout: { type: 'truncateLog', max: 500 },
      flags: 'w',
    },
    fileFull: { type: 'logLevelFilter', appender: '_fileFull', level: 'trace' },
    fileTruncate: {
      type: 'logLevelFilter',
      appender: '_fileTruncate',
      level: 'trace',
    },
  },
  categories: {
    default: { appenders: ['fileFull', 'fileTruncate'], level: 'trace' },
  },
});

// #endregion

// システム終了時にログの記録終了を明示的に宣言
onQuit(log4js.shutdown, true);

/** パスにあるログをアーカイブする */
async function archiveLog(...logPaths: Path[]) {
  // .latestを圧縮してアーカイブ
  if (logPaths.length > 0 && logPaths.every((path) => path.exists())) {
    const lastUpdateTime = await logPaths[0].lastUpdateTime();
    const [newlogName, archivePath] = getNextArchivePath(lastUpdateTime);
    // アーカイブ時に利用する名前に変更
    const newPaths = await Promise.all(
      logPaths.map(async (path) => {
        const firstColonIndex = path.basename().indexOf('.');
        const newExt = path.basename().substring(firstColonIndex);
        const newLogPath = path.parent().child(`${newlogName}${newExt}`);
        await path.rename(newLogPath);
        return newLogPath;
      })
    );
    // utils/gzを使うと，GzipクラスとPathクラスが循環参照となるため使用しない
    await c(
      {
        gzip: true,
        file: archivePath.path,
        cwd: logPaths[0].parent().path,
      },
      newPaths.map((path) => path.basename())
    );
    await Promise.all(newPaths.map((path) => path.remove()));
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

function getNextArchivePath(time: Dayjs): [string, Path] {
  let i = 0;
  const prefix = time.format('YYYY-MM-DD-HH');
  while (true) {
    const path = logDir.child(`${prefix}-${i}${ARCHIVE_EXT}`);
    if (!path.exists()) return [`${prefix}-${i}`, path];
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

    const isMatchLogInLines = async (target: string) => {
      const logTxt = await logpath.readText();
      if (isError(logTxt)) return null;
      const lines = logTxt.trim().split(/\r?\n|\r/);
      return lines.some((line) => line.includes(target));
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
      expect(
        await isMatchLogInLines(
          '"lv":"INFO","on":"default","param":"DEFAULT","msg":"message"'
        )
      ).toBe(true);

      rootLogger.custom('multi', ['value']).warn({ key: 'value' });
      expect(
        await isMatchLogInLines(
          '"lv":"WARN","on":"custom","param":["multi",["value"]],"msg":{"key":"value"}'
        )
      ).toBe(true);

      rootLogger.nest.more.deeply().trace();
      expect(
        await isMatchLogInLines('"lv":"TRACE","on":"nest.more.deeply"')
      ).toBe(true);

      // 伏字チェック

      const unsetRule = addOmisstionRule((v) => (v === 'invalid' ? '***' : v));
      addOmisstionRule((v, p) => {
        console.log(v, p);
        return v;
      });

      rootLogger().info('invalid');
      expect(
        await isMatchLogInLines('"lv":"INFO","on":"default","msg":"***"')
      ).toBe(true);

      log4js.recording();

      rootLogger().info({ nest: 'invalid' });
      expect(
        await isMatchLogInLines(
          '"lv":"INFO","on":"default","msg":{"nest":"***"}'
        )
      ).toBe(true);

      rootLogger().info(['pass', 'is', 'invalid']);
      expect(
        await isMatchLogInLines(
          '"lv":"INFO","on":"default","msg":["pass","is","***"]'
        )
      ).toBe(true);

      unsetRule();

      rootLogger().info('invalid');
      expect(
        await isMatchLogInLines(
          '"lv":"INFO","on":"default","msg":"invalid"' // 伏字ルールが消えているはず
        )
      ).toBe(true);

      addOmisstionRule((v, p) => (p[p.length - 1] === 'secret' ? '***' : v));

      rootLogger({ secret: 'XXXXXX' }).info();
      expect(
        await isMatchLogInLines(
          '"lv":"INFO","on":"default","param":{"secret":"***"}'
        )
      ).toBe(true);

      // アーカイブチェック
      const logPaths = await logDir.iter();
      expect(isError(logPaths)).toBe(false);
      if (isError(logPaths)) return;
      for (const path of logPaths) {
        if (logPaths.some((p) => p.basename() === path.basename())) continue;
        await path.remove();
      }
      await archiveLog(logpath);

      // アーカイブされて、YYYY-MM-DD-HH-0.log.gz ができているはず
      const logPaths2 = await logDir.iter();
      expect(isError(logPaths2)).toBe(false);
      if (isError(logPaths2)) return;
      expect(logPaths2.map((p) => p.basename())).toEqual(
        expect.arrayContaining([
          expect.stringMatching(/\d{4}-\d{2}-\d{2}-\d{2}-0.log.tar.gz/),
        ])
      );
    });
  });

  describe('truncateLog', () => {
    type Source = any[] | Record<string, any>;
    const testCases: { sourceParam: Source; expectStr: string }[] = [
      // 通常の出力
      {
        sourceParam: ['spigot', true],
        expectStr: '[spigot, true]',
      },
      // URLのような長い文字列は途中を省略して表示する
      {
        sourceParam: {
          url: 'https://api.github.com/repos/Server-Starter-for-Minecraft/ServerStarter2/releases',
        },
        expectStr:
          '{ url: https://api.github.com/re...t/ServerStarter2/releases }',
      },
      // オブジェクトの要素が3つ以上の場合は「．．．」で省略される
      {
        sourceParam: {
          type: 'error',
          key: 'data.url.fetch',
          level: 'error',
          arg: {
            url: 'https://api.github.com/repos/Server-Starter-for-Minecraft/ServerStarter2/releases',
            status: 401,
            statusText: 'Unauthorized',
          },
        },
        expectStr:
          '{ type: error, key: data.url.fetch, level: error, ... 1 more fields }',
      },
      // 配列の要素が3つ以上の場合は「．．．」で省略される
      {
        sourceParam: [
          'success',
          [
            { release: false, id: '25w18a' },
            { release: false, id: '25w17a' },
            { release: false, id: '25w16a' },
            { release: false, id: '25w15a' },
            { release: false, id: '25w14craftmine' },
            { release: true, id: '1.21.5' },
          ],
        ],
        expectStr:
          '[success, [{ release: false, id: 25w18a }, ... 4 more ..., { release: true, id: 1.21.5 }]]',
      },
      // 3階層以下のオブジェクト要素は「．．．」で省略される
      {
        sourceParam: [
          'success',
          {
            container: [
              { container: 'servers', visible: true, name: 'default' },
            ],
            world: { memory: { size: 2, unit: 'GB' } },
          },
        ],
        expectStr:
          '[success, { container: [{ container: servers, visible: true, name: default }], world: { memory: { size: ..., unit: ... } } }]',
      },
    ];

    test.each(testCases)('eachTruncateLog', ({ sourceParam, expectStr }) => {
      expect(truncateValue(sourceParam)).toBe(expectStr);
    });
  });
}
