import { ESLint } from 'eslint';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';
import { createConfig } from '../eslint.config.js';
import { LINT_EXCEPTIONS } from './config.js';
import { exceptionScopes, scopeKey } from './utils/exceptions.js';

/** リポジトリのルート */
const ROOT = fileURLToPath(new URL('..', import.meta.url));

describe('lint の例外', () => {
  // 例外を外すと違反が出る（＝例外がまだ必要な）ことを，例外が実際の違反を許可しているかで確かめる。
  // 違反を直した後に残った例外・存在しないファイルの例外・使われなくなった関数やモジュールの指定，
  // 例外を適用しているが違反の無いルールを検出する
  test(
    '登録したすべての例外の，すべての範囲が，適用したすべてのルールで実際の違反を許可している',
    async () => {
      /** 使われた例外（ルール・例外・範囲の組） */
      const used = new Set();
      /** @type {Map<import('./utils/exceptions.js').ScopedException, number>} */
      const ids = new Map();
      /** @param {import('./utils/exceptions.js').ScopedException} exception 例外 */
      const idOf = (exception) => {
        if (!ids.has(exception)) ids.set(exception, ids.size);
        return ids.get(exception);
      };
      const eslint = new ESLint({
        cwd: ROOT,
        overrideConfigFile: true,
        overrideConfig: createConfig({
          onExceptionUsed: ({ ruleId, exception, scope }) => {
            used.add(`${ruleId} ${idOf(exception)} ${scopeKey(scope)}`);
          },
        }),
      });
      const files = new Set(
        LINT_EXCEPTIONS.flatMap(({ exceptions }) =>
          exceptions.map(({ file }) => file)
        )
      );
      await eslint.lintFiles([...files]);

      const unused = LINT_EXCEPTIONS.flatMap(({ rules, exceptions }) =>
        rules.flatMap((ruleId) =>
          exceptions.flatMap((exception) =>
            exceptionScopes(exception)
              .map(scopeKey)
              .filter((key) => !used.has(`${ruleId} ${idOf(exception)} ${key}`))
              .map((key) => `${ruleId}: ${exception.file} (${key})`)
          )
        )
      );
      expect(unused).toEqual([]);
    },
    5 * 60 * 1000
  );

  test('すべての例外に，範囲と理由が指定されている', () => {
    const invalid = LINT_EXCEPTIONS.flatMap(({ exceptions }) =>
      exceptions.filter(
        (exception) =>
          exceptionScopes(exception).length === 0 ||
          exception.reason.trim() === ''
      )
    );
    expect(invalid).toEqual([]);
  });
});
