import { describe, expect, test } from 'vitest';
import { errorMessage } from 'app/src-electron/util/error/construct';
import { withError } from 'app/src-electron/util/error/witherror';
import { logResult } from './util';

const error = errorMessage.system.assertion({ message: 'test' });

/** 記録したログのレベルを残す偽のロガー */
function recordingLogger() {
  const levels: string[] = [];
  return {
    levels,
    logger: {
      error: () => levels.push('error'),
      warn: () => levels.push('warn'),
      info: () => levels.push('info'),
    },
  };
}

describe('API の結果のログ', () => {
  test.each([
    ['Failable のエラー', error, 'error'],
    ['value がエラーで errors が空の WithError', withError(error), 'error'],
    [
      'value がエラーで errors もある WithError',
      withError(error, [error]),
      'error',
    ],
    ['内部エラーを含む成功の WithError', withError(1, [error]), 'warn'],
    ['内部エラーの無い成功の WithError', withError(1), 'info'],
    ['Failable の成功', 1, 'info'],
    ['戻り値の無い API', undefined, 'info'],
  ] as const)('%s は %s のレベルで 1 回だけ記録する', (_, result, level) => {
    const { levels, logger } = recordingLogger();

    logResult(logger, result);

    expect(levels).toEqual([level]);
  });
});
