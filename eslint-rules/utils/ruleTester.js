// @ts-check
import { RuleTester } from '@typescript-eslint/rule-tester';
import { fileURLToPath } from 'node:url';
import { afterAll, describe, it } from 'vitest';

/**
 * 独自ルールのテスト（RuleTester）を Vitest 上で実行する
 *
 * RuleTester は既定で mocha のテスト関数を使うため，Vitest の関数に差し替える
 */
RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;
RuleTester.itOnly = it.only;

/** 型情報を使うルールのテストで読み込む tsconfig.json のあるディレクトリ */
const fixturesDir = fileURLToPath(new URL('../fixtures', import.meta.url));

/**
 * 独自ルールのテスト用の RuleTester を作る
 *
 * 型情報を使うルールも検証できるよう，`fixtures/tsconfig.json` を読み込む。
 * テストのコードは既定で `fixtures/file.ts` として解析される（`filename` で変更できる）
 *
 * @returns RuleTester
 */
export function createRuleTester() {
  return new RuleTester({
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: ['*/*.ts', '*/*/*.ts', '*/*/*/*.ts'],
          defaultProject: 'tsconfig.json',
        },
        tsconfigRootDir: fixturesDir,
      },
    },
  });
}
