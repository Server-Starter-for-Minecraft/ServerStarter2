import dayjs, { type Dayjs } from 'dayjs';
// Electron外(スクリプト・テスト環境など)ではnamed exportが存在しないため，名前空間でimportする
import * as electron from 'electron';
import fs from 'fs-extra';
import log4js from 'log4js';
import { c } from 'tar';
import { runDetached } from 'app/src-public/scripts/promise/runDetached';
import { onQuit } from '../lifecycle/lifecycle';
import { logDir } from '../lifecycle/paths';
import { Path } from '../util/binary/path';
import { isError, isValid } from '../util/error/error';
import { InfinitMap } from '../util/helper/infinitMap';
import { isValidIP } from '../util/network/ip';
import { randomInt } from '../util/random/random';

const TIME_FORMAT = 'YYYY-MM-DD HH:mm:ss.SSS';
const LATEST = 'latest';
const EXTs = ['.log', '.truncate.log'];
const TMP_LOG = `tmp_${randomInt(0, 2 ** 31)}`;
const ARCHIVE_EXT = '.log.tar.gz';

/**
 * ログ（アーカイブ・アーカイブできずに残ったログ）を残す期間（日）
 *
 * ログ以外にも，診断のために一時的に残すファイル（読み込めなかった設定ファイルのバックアップ等）の保存期間として使う
 */
export const LOG_RETENTION_DAYS = 7;

const logPaths = EXTs.map((ext) => logDir.child(`${LATEST}${ext}`));
const beforeArchivePaths = EXTs.map((ext) => logDir.child(`${TMP_LOG}${ext}`));

// LATASTの上書き前にアーカイブファイルを作成
// Testの時には下記のコードは実行しない
// （下の log4js の設定で latest.log が上書きされる前に退避する必要があるため，起動時に一度だけ同期 API を使う。
//   画面の表示前であり操作を止めることはない。eslint-rules/config.js の BLOCKING_CALL_EXCEPTIONS で，
//   モジュールの読み込み時の処理に限って no-blocking-call の例外としている。関数の中で使うと例外の範囲外になる）
fs.ensureDirSync(logDir.path);
if (electron.app) {
  let existsLatestLogs = true;
  for (const path of logPaths) {
    existsLatestLogs &&= fs.existsSync(path.path);
  }
  if (existsLatestLogs) {
    for (const [idx, path] of logPaths.entries()) {
      fs.copyFileSync(path.path, beforeArchivePaths[idx].path);
    }
    runDetached(archiveLog(...beforeArchivePaths), (e) =>
      rootLogger.logger.archive().error(e)
    );
  }
}

// #region log4jsの設定

/**
 * 与えられたログオブジェクトを省略して，人間が見やすい文字列に出力する
 */
function truncateValue(value: any, depth = 0): string {
  const MAX_ARRAY_ITEMS = 1;
  const MAX_OBJECT_FIELDS = 3;
  const MAX_STRING_LENGTH = 50;

  if (depth > 2) return '...'; // ネストが深すぎる場合は省略

  if (Array.isArray(value)) {
    const remainItems = value.length - MAX_ARRAY_ITEMS * 2;
    // ... N more ... 表示はN=2以上とする
    if (remainItems <= 1) {
      // 配列の場合，深さ`depth`は深くなっていないと判断して，`depth + 1`としない
      return `[${value.map((v) => truncateValue(v, depth)).join(', ')}]`;
    }
    const first = value.slice(0, MAX_ARRAY_ITEMS);
    const last = value.slice(-MAX_ARRAY_ITEMS);
    return `[${first
      .map((v) => truncateValue(v, depth))
      .join(', ')}, ... ${remainItems} more ..., ${last
      .map((v) => truncateValue(v, depth))
      .join(', ')}]`;
  }

  if (typeof value === 'string') {
    if (value.length > MAX_STRING_LENGTH) {
      const half = Math.floor(MAX_STRING_LENGTH / 2);
      return `${value.slice(0, half)}...${value.slice(-half)}`.trim();
    }
    return value.trim();
  }

  if (typeof value === 'object' && value !== null) {
    const entries = Object.entries(value);
    if (entries.length === 0) return '{}';
    const remainFields = entries.length - MAX_OBJECT_FIELDS;
    // ... N more ... 表示はN=2以上とする
    if (remainFields <= 1) {
      return `{ ${entries
        .map(([k, v]) => `${k}: ${truncateValue(v, depth + 1)}`)
        .join(', ')} }`;
    }
    const important = entries.slice(0, MAX_OBJECT_FIELDS);
    return `{ ${important
      .map(([k, v]) => `${k}: ${truncateValue(v, depth + 1)}`)
      .join(', ')}, ... ${remainFields} more fields }`;
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
      level: 'debug',
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
  const existences = await Promise.all(logPaths.map(async (p) => p.exists()));
  if (logPaths.length > 0 && existences.every((exists) => exists)) {
    const lastUpdateTime = await logPaths[0].lastUpdateTime();
    const [newlogName, archivePath] = await getNextArchivePath(lastUpdateTime);
    // アーカイブ時に利用する名前に変更
    const newPaths = await Promise.all(
      logPaths.map(async (path) => {
        const firstColonIndex = path.basename().indexOf('.');
        const newExt = path.basename().substring(firstColonIndex);
        const newLogPath = path.parent().child(`${newlogName}${newExt}`);
        const renamed = await path.rename(newLogPath);
        // 名前を変更できなかったログはアーカイブせずに残す（保存期間を過ぎたら下の削除の処理で消す）
        return isError(renamed) ? renamed : newLogPath;
      })
    );
    const renameError = newPaths.find(isError);
    if (renameError !== undefined) {
      rootLogger.logger.archive().warn(renameError);
      return;
    }
    const archivedPaths = newPaths.filter(isValid);
    // utils/gzを使うと，GzipクラスとPathクラスが循環参照となるため使用しない
    await c(
      {
        gzip: true,
        file: archivePath.path,
        cwd: logPaths[0].parent().path,
      },
      archivedPaths.map((path) => path.basename())
    );
    await removeLogFiles(archivedPaths);
  }

  // 保存期間を過ぎたログと，作りかけのアーカイブを削除
  const thresholdDate = dayjs().subtract(LOG_RETENTION_DAYS, 'd');
  const paths = await logDir.iter();
  if (isError(paths)) {
    rootLogger.logger.archive().warn(paths);
    return;
  }
  const expired: Path[] = [];
  for (const path of paths) {
    const name = path.basename();
    // 記録中のログと，この起動でアーカイブするために退避したログは残す
    if (name.startsWith(`${LATEST}.`) || name.startsWith(`${TMP_LOG}.`))
      continue;
    // 作りかけのアーカイブはすぐに削除する
    if (name.endsWith(ARCHIVE_EXT) && name.startsWith('tmp')) {
      expired.push(path);
      continue;
    }
    // アーカイブと，名前の変更・圧縮に失敗して残ったログ（前回までの退避ファイルを含む）は保存期間で削除する
    if (!name.endsWith(ARCHIVE_EXT) && !name.endsWith('.log')) continue;
    const updateDate = await path.lastUpdateTime();
    if (updateDate.isBefore(thresholdDate)) expired.push(path);
  }
  await removeLogFiles(expired);
}

/**
 * ログのファイルを削除する
 *
 * 削除できなくても次回の起動時に再度削除を試みるため，失敗はログに残すのみとする
 *
 * @param paths 削除するファイル
 */
async function removeLogFiles(paths: Path[]) {
  const results = await Promise.all(paths.map(async (path) => path.remove()));
  for (const result of results.filter(isError)) {
    rootLogger.logger.archive().warn(result);
  }
}

async function getNextArchivePath(time: Dayjs): Promise<[string, Path]> {
  let i = 0;
  const prefix = time.format('YYYY-MM-DD-HH');
  while (true) {
    const path = logDir.child(`${prefix}-${i}${ARCHIVE_EXT}`);
    if (!(await path.exists())) return [`${prefix}-${i}`, path];
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

// 以下の伏字ルールを追加
const omissions: Set<LogOmission> = new Set([
  (v) => (isValidIP(v) ? ':IpAddress:' : v),
  (v, p) => (p[p.length - 1] === 'ngrokToken' ? ':NgrokToken:' : v),
]);

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
  // アサーション関数は型注釈のある名前でしか呼べないため，型を明示して取り出す
  const assertions = await import('app/test/util/assert');
  const assertOk: typeof assertions.assertOk = assertions.assertOk;

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

      // 規定の省略ルール

      rootLogger().info(['success', '127.0.0.1']);
      expect(
        await isMatchLogInLines(
          '"lv":"INFO","on":"default","msg":["success",":IpAddress:"]'
        )
      ).toBe(true);

      rootLogger().info({ ngrokToken: 'XXXXXX' });
      expect(
        await isMatchLogInLines(
          '"lv":"INFO","on":"default","msg":{"ngrokToken":":NgrokToken:"}'
        )
      ).toBe(true);

      // アーカイブチェック
      const logPaths = await logDir.iter();
      assertOk(logPaths);
      for (const path of logPaths) {
        if (logPaths.some((p) => p.basename() === path.basename())) continue;
        await path.remove();
      }
      await archiveLog(logpath);

      // アーカイブされて、YYYY-MM-DD-HH-0.log.gz ができているはず
      const logPaths2 = await logDir.iter();
      assertOk(logPaths2);
      expect(logPaths2.map((p) => p.basename())).toEqual(
        expect.arrayContaining([
          expect.stringMatching(/\d{4}-\d{2}-\d{2}-\d{2}-0.log.tar.gz/),
        ])
      );
    });

    test('保存期間を過ぎたログは，アーカイブできずに残ったものも含めて削除し，期間内のものと記録中のログは残す', async () => {
      const { utimes } = await import('node:fs/promises');
      const old = new Date(
        Date.now() - (LOG_RETENTION_DAYS + 1) * 24 * 60 * 60 * 1000
      );
      /** 保存期間より前に更新したファイルを作る */
      const createOld = async (name: string) => {
        const file = logDir.child(name);
        await file.writeText('old');
        await utimes(file.path, old, old);
        return file;
      };
      const expired = await Promise.all(
        [
          'tmp_1.log',
          'tmp_1.truncate.log',
          '2000-01-01-00-0.log',
          '2000-01-01-00-1.log.tar.gz',
        ].map(createOld)
      );
      const kept = [
        // 記録中のログは古くても残す
        await createOld(`${LATEST}.log`),
        // 保存期間内のログ・アーカイブ
        logDir.child('2999-01-01-00-0.log'),
        logDir.child('2999-01-01-00-1.log.tar.gz'),
      ];
      await kept[1].writeText('new');
      await kept[2].writeText('new');

      await archiveLog();

      for (const file of expired) expect(await file.exists()).toBe(false);
      for (const file of kept) expect(await file.exists()).toBe(true);
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
          'accepts-transfers': false,
          'allow-flight': false,
          'allow-nether': true,
          'broadcast-console-to-ops': true,
          'broadcast-rcon-to-ops': true,
          difficulty: 'easy',
        },
        expectStr:
          '{ accepts-transfers: false, allow-flight: false, allow-nether: true, ... 3 more fields }',
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
