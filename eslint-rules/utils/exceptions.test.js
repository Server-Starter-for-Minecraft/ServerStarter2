import { Linter } from 'eslint';
import { builtinRules } from 'eslint/use-at-your-own-risk';
import { fileURLToPath } from 'node:url';
import tseslint from 'typescript-eslint';
import { applyExceptions, withExceptions } from './exceptions.js';
import { createRuleTester } from './ruleTester.js';

const ruleTester = createRuleTester();

/** 型アサーションを禁止する標準のルール（例外の適用先の例） */
const typeAssertion = tseslint.plugin.rules['consistent-type-assertions'];
const typeAssertionOptions = [{ assertionStyle: 'never' }];

/** 型アサーションの違反の報告 */
const typeAssertionError = { messageId: 'never' };

describe('関数の範囲の例外', () => {
  ruleTester.run(
    'consistent-type-assertions',
    withExceptions(typeAssertion, [
      { file: 'file.ts', functions: ['allowed'], reason: '' },
    ]),
    {
      valid: [
        // 関数宣言・関数を代入した変数・メソッドのいずれの名前でも指定できる
        {
          code: 'export function allowed(x: unknown) { return x as string; }',
          options: typeAssertionOptions,
        },
        {
          code: 'export const allowed = (x: unknown) => x as string;',
          options: typeAssertionOptions,
        },
        {
          code: 'export class A { allowed(x: unknown) { return x as string; } }',
          options: typeAssertionOptions,
        },
        // 許可した関数の中で作った関数の中も許可する
        {
          code: 'export function allowed(xs: unknown[]) { return xs.map((x) => x as string); }',
          options: typeAssertionOptions,
        },
      ],
      invalid: [
        // 同じファイルでも，許可した関数の外では報告する
        {
          code: 'export function other(x: unknown) { return x as string; }',
          options: typeAssertionOptions,
          errors: [typeAssertionError],
        },
        {
          code: 'export const value = 1 as unknown as string;',
          options: typeAssertionOptions,
          errors: [typeAssertionError, typeAssertionError],
        },
        // 別のファイルの同じ名前の関数は許可しない
        {
          code: 'export function allowed(x: unknown) { return x as string; }',
          filename: 'other/file.ts',
          options: typeAssertionOptions,
          errors: [typeAssertionError],
        },
      ],
    }
  );
});

describe('モジュールの読み込み時の例外', () => {
  ruleTester.run(
    'consistent-type-assertions',
    withExceptions(typeAssertion, [
      { file: 'file.ts', topLevel: true, reason: '' },
    ]),
    {
      valid: [
        {
          code: 'declare const x: unknown; export const value = x as string;',
          options: typeAssertionOptions,
        },
        // 静的なフィールドの初期値は，モジュールの読み込み時に実行される
        {
          code: 'declare const x: unknown; export class A { static value = x as string; }',
          options: typeAssertionOptions,
        },
        // 計算されたフィールド名は，クラスを定義するとき（モジュールの読み込み時）に実行される
        {
          code: 'declare const x: unknown; export class A { [x as string] = 0; }',
          options: typeAssertionOptions,
        },
      ],
      invalid: [
        // 関数の中は，呼んだときに実行されるため許可しない
        {
          code: 'export function f(x: unknown) { return x as string; }',
          options: typeAssertionOptions,
          errors: [typeAssertionError],
        },
        {
          code: 'declare const xs: unknown[]; export const values = xs.map((x) => x as string);',
          options: typeAssertionOptions,
          errors: [typeAssertionError],
        },
        // インスタンスのフィールドの初期値は，インスタンスを作るときに実行される
        {
          code: 'declare const x: unknown; export class A { value = x as string; }',
          options: typeAssertionOptions,
          errors: [typeAssertionError],
        },
      ],
    }
  );
});

describe('import するモジュールの例外', () => {
  const restrictedImports = tseslint.plugin.rules['no-restricted-imports'];
  const options = [{ paths: ['fs', 'node:fs', 'os', 'path'] }];
  const errors = [{ messageId: 'path' }];

  ruleTester.run(
    'no-restricted-imports',
    withExceptions(restrictedImports, [
      { file: 'file.ts', modules: ['fs', 'node:os'], reason: '' },
    ]),
    {
      valid: [
        { code: "import fs from 'fs'; export default fs;", options },
        // `node:` の有無によらず同じモジュールとして扱う（例外の指定・import のどちらに付けてもよい）
        { code: "import fs from 'node:fs'; export default fs;", options },
        { code: "import os from 'os'; export default os;", options },
        // export … from・import … = require も import として扱う
        { code: "export { readFile } from 'fs';", options },
        { code: "export * from 'fs';", options },
        { code: "import fs = require('fs'); export default fs;", options },
      ],
      invalid: [
        // 許可していないモジュールは，同じファイルでも報告する
        {
          code: "import path from 'path'; export default path;",
          options,
          errors,
        },
      ],
    }
  );

  ruleTester.run(
    'no-restricted-syntax',
    withExceptions(builtinRules.get('no-restricted-syntax'), [
      { file: 'file.ts', modules: ['fs'], reason: '' },
    ]),
    {
      valid: [
        // 動的な import も，許可したモジュールであれば報告しない
        {
          code: "export const load = () => import('fs');",
          options: ['ImportExpression'],
        },
        {
          code: "export const load = () => import('node:fs');",
          options: ['ImportExpression'],
        },
      ],
      invalid: [
        {
          code: "export const load = () => import('path');",
          options: ['ImportExpression'],
          errors: [{ messageId: 'restrictedSyntax' }],
        },
      ],
    }
  );
});

/** 位置（loc）だけを報告するルール（`debugger` 文の位置を，ファイル全体のノードに対して報告する） */
const locOnlyRule = {
  meta: { type: 'problem', schema: [], messages: { found: 'found' } },
  create(context) {
    return {
      DebuggerStatement(node) {
        context.report({
          node: context.sourceCode.ast,
          loc: node.loc,
          messageId: 'found',
        });
      },
    };
  },
};

/** 例外を適用する設定のテストで検査するファイル（型情報を使わないため，実在しなくてよい） */
const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const FILE = fileURLToPath(new URL('../../sample.js', import.meta.url));

/**
 * 設定の一覧で 1 つのコードを検査する
 *
 * @param {string} code 検査するコード
 * @param {import('eslint').Linter.Config[]} configs 設定の一覧
 * @returns 報告された違反
 */
function verify(code, configs) {
  return new Linter({ cwd: ROOT }).verify(code, configs, FILE);
}

describe('applyExceptions', () => {
  const plugin = { rules: { 'loc-only': locOnlyRule } };
  // 同じプラグインを 2 つの設定で宣言する（プラグインはすべての設定で置き換わる必要がある）
  const configs = [
    { plugins: { sample: plugin } },
    { plugins: { sample: plugin }, rules: { 'sample/loc-only': 'error' } },
  ];
  const groups = [
    {
      rules: ['sample/loc-only'],
      exceptions: [{ file: 'sample.js', functions: ['allowed'], reason: '' }],
    },
  ];

  test('ルールの名前を変えずに，例外の範囲の外の違反だけを報告する', () => {
    const messages = verify(
      'function allowed() { debugger; }\nfunction other() { debugger; }',
      applyExceptions(configs, groups)
    );
    expect(messages.map(({ ruleId, line }) => ({ ruleId, line }))).toEqual([
      { ruleId: 'sample/loc-only', line: 2 },
    ]);
  });

  test('位置だけを報告するルールは，報告の位置で例外の範囲を判定する', () => {
    // 報告のノードがファイル全体（モジュールの読み込み時の位置）でも，位置が関数の中であれば関数の中として扱う
    const topLevelGroups = [
      {
        rules: ['sample/loc-only'],
        exceptions: [{ file: 'sample.js', topLevel: true, reason: '' }],
      },
    ];
    const messages = verify(
      'debugger;\nfunction f() { debugger; }',
      applyExceptions(configs, topLevelGroups)
    );
    expect(messages.map(({ line }) => line)).toEqual([2]);
  });

  test('例外によって許可した違反を，ルール・例外・範囲とともに知らせる', () => {
    const uses = [];
    verify(
      'function allowed() { debugger; }',
      applyExceptions(configs, groups, (use) => uses.push(use))
    );
    expect(uses).toEqual([
      {
        ruleId: 'sample/loc-only',
        exception: groups[0].exceptions[0],
        scope: { kind: 'function', name: 'allowed' },
      },
    ]);
  });

  test('存在しないプラグイン・ルール，プラグインのない標準のルールには適用できない', () => {
    for (const ruleId of [
      'unknown/loc-only',
      'sample/unknown',
      'no-debugger',
    ]) {
      expect(() =>
        applyExceptions(configs, [{ rules: [ruleId], exceptions: [] }])
      ).toThrow();
    }
  });
});
