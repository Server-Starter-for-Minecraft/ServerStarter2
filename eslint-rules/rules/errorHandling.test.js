import { THROWING_APIS } from '../config.js';
import { createRuleTester } from '../utils/ruleTester.js';
import noException from './no-exception.js';
import noFailableCast from './no-failable-cast.js';
import noFailableCondition from './no-failable-condition.js';
import noIgnoredFailable from './no-ignored-failable.js';
import noSilentError from './no-silent-error.js';
import noUnsafeThrowingCall from './no-unsafe-throwing-call.js';

const ruleTester = createRuleTester();

/** テストのコードで使う，ServerStarter2 のエラーの型と判定関数の宣言 */
const PRELUDE = `
type ErrorMessage = { type: 'error'; key: string; level: 'error' | 'warn' };
type Failable<T> = T | ErrorMessage;
type WithError<T> = { value: T; errors: ErrorMessage[] };
declare function isError<T>(value: Failable<T>): value is ErrorMessage;
declare function isValid<T>(value: Failable<T>): value is T;
declare function load(): Promise<Failable<number>>;
declare function loadSync(): Failable<number>;
declare function loadWithError(): Promise<WithError<number>>;
declare function ignoreError(error: ErrorMessage, reason: string): undefined;
declare const logger: { warn(value: unknown): void };
`;

ruleTester.run('no-exception', noException, {
  valid: [
    // 許可した関数の中では例外を扱える
    {
      code: 'export function safeExec<T>(f: () => T) { try { return f(); } catch (e) { return e; } }',
      options: [
        { allowed: [{ file: 'file.ts', functions: ['safeExec'], reason: '' }] },
      ],
    },
    // catch の無い try/finally は後始末を保証するだけのため許可する
    'export function f(g: () => void) { try { g(); } finally { console.log(1); } }',
    // in-source テストの中は対象外
    'if (import.meta.vitest) { throw new Error(); }',
  ],
  invalid: [
    {
      code: 'export function f() { throw new Error(); }',
      errors: [{ messageId: 'throw' }],
    },
    // private な関数・クラスの private メソッドでも例外は使えない
    {
      code: 'function f() { throw new Error(); }',
      errors: [{ messageId: 'throw' }],
    },
    {
      code: 'export class A { private f() { throw new Error(); } }',
      errors: [{ messageId: 'throw' }],
    },
    {
      code: 'export function f(g: () => void) { try { g(); } catch { return 1; } }',
      errors: [{ messageId: 'tryCatch' }],
    },
    {
      code: 'export const f = async () => Promise.reject(1);',
      errors: [{ messageId: 'reject' }],
    },
    {
      code: 'export const p = new Promise((resolve, reject) => reject(1));',
      errors: [{ messageId: 'reject' }],
    },
    // try/catch の代わりに Promise の catch を使う回避も検出する
    {
      code: 'export const f = (p: Promise<number>) => p.catch(() => 0);',
      errors: [{ messageId: 'catch' }],
    },
    {
      code: 'export const f = (p: Promise<number>) => p.then((x) => x, () => 0);',
      errors: [{ messageId: 'catch' }],
    },
  ],
});

ruleTester.run('no-unsafe-throwing-call', noUnsafeThrowingCall, {
  valid: [
    // Failable へ変換する関数に渡した関数の中では使える
    {
      code: 'declare function safeExec<T>(f: () => T): T; export const v = safeExec(() => JSON.parse("1"));',
      options: [
        { throwingApis: THROWING_APIS, converters: ['safeExec'], allowed: [] },
      ],
    },
    // zod の safeParse は例外を投げない
    {
      code: "import { z } from 'zod'; export const v = z.string().safeParse('a');",
      options: [{ throwingApis: THROWING_APIS, converters: [], allowed: [] }],
    },
    // 自作の parse は対象外（宣言元で判定する）
    {
      code: 'const p = { parse: (x: string) => x }; export const v = p.parse("a");',
      options: [{ throwingApis: THROWING_APIS, converters: [], allowed: [] }],
    },
  ],
  invalid: [
    {
      code: 'export const v = JSON.parse("1");',
      options: [{ throwingApis: THROWING_APIS, converters: [], allowed: [] }],
      errors: [{ messageId: 'throwing' }],
    },
    {
      code: "import { z } from 'zod'; export const v = z.string().parse('a');",
      options: [{ throwingApis: THROWING_APIS, converters: [], allowed: [] }],
      errors: [{ messageId: 'throwing' }],
    },
    {
      code: "export const v = new URL('a');",
      options: [{ throwingApis: THROWING_APIS, converters: [], allowed: [] }],
      errors: [{ messageId: 'throwing' }],
    },
  ],
});

ruleTester.run('no-ignored-failable', noIgnoredFailable, {
  valid: [
    `${PRELUDE} export async function f() { const v = await load(); if (isError(v)) return v; return v + 1; }`,
    // エラーを処理する関数の戻り値は捨ててもよい
    {
      code: `${PRELUDE} declare function checkError<T>(v: Failable<T>): T | undefined; export function f() { checkError(loadSync()); }`,
      options: [
        { handlers: [{ name: 'checkError', declarationFile: /file\.ts$/ }] },
      ],
    },
  ],
  invalid: [
    {
      code: `${PRELUDE} export async function f() { await load(); }`,
      errors: [{ messageId: 'ignored' }],
    },
    {
      code: `${PRELUDE} export function f() { loadSync(); }`,
      errors: [{ messageId: 'ignored' }],
    },
    // void・型アサーションで捨てる回避も検出する
    {
      code: `${PRELUDE} export function f() { void load(); }`,
      errors: [{ messageId: 'ignored' }],
    },
    {
      code: `${PRELUDE} export async function f() { (await load()) as unknown; }`,
      errors: [{ messageId: 'ignored' }],
    },
    // WithError の結果を丸ごと捨てる
    {
      code: `${PRELUDE} export async function f() { await loadWithError(); }`,
      errors: [{ messageId: 'ignored' }],
    },
    // エラーを含む配列を捨てる
    {
      code: `${PRELUDE} export async function f() { await Promise.all([load(), load()]); }`,
      errors: [{ messageId: 'ignored' }],
    },
    // forEach のコールバックの結果は捨てられる
    {
      code: `${PRELUDE} export function f(xs: number[]) { xs.forEach(async () => load()); }`,
      errors: [{ messageId: 'forEach' }],
    },
  ],
});

ruleTester.run('no-failable-cast', noFailableCast, {
  valid: [
    `${PRELUDE} export async function f() { const v = await load(); if (isError(v)) return v; return v as number; }`,
    `${PRELUDE} export const c = [1] as const;`,
  ],
  invalid: [
    {
      code: `${PRELUDE} export async function f() { return (await load()) as number; }`,
      errors: [{ messageId: 'cast' }],
    },
    {
      code: `${PRELUDE} export async function f() { return (await load()) as unknown as number; }`,
      errors: [{ messageId: 'cast' }],
    },
  ],
});

ruleTester.run('no-failable-condition', noFailableCondition, {
  valid: [
    // エラーかどうかを確認してから値を判定する
    `${PRELUDE} export async function f() { const v = await load(); if (isError(v) || !v) return 0; return v; }`,
    // エラーを含まない値の判定
    `${PRELUDE} export function f(v: number | undefined) { return v ? v : 0; }`,
    // ?? は真偽値の判定ではない
    `${PRELUDE} export function f(v: Failable<number> | undefined) { return v ?? 0; }`,
    // 配列（errors など）の判定は対象外
    `${PRELUDE} export async function f() { const r = await loadWithError(); return r.errors.length > 0 && r.errors ? 1 : 0; }`,
    // エラーか undefined の値の判定は「エラーがあるか」の確認になる
    `${PRELUDE} export async function f() { const err = [await load()].find(isError); if (err) return err; return 0; }`,
  ],
  invalid: [
    // エラーが返ると true と判定され，成功として扱われる
    {
      code: `${PRELUDE} declare function ask(): Promise<Failable<boolean>>; export async function f() { const ok = await ask(); if (!ok) return; return 1; }`,
      errors: [{ messageId: 'condition' }],
    },
    {
      code: `${PRELUDE} export function f() { const v = loadSync(); if (v) return v; return 0; }`,
      errors: [{ messageId: 'condition' }],
    },
    {
      code: `${PRELUDE} export function f() { const v = loadSync(); return v ? 1 : 0; }`,
      errors: [{ messageId: 'condition' }],
    },
    {
      code: `${PRELUDE} export function f() { let v = loadSync(); while (v) { v = loadSync(); } }`,
      errors: [{ messageId: 'condition' }],
    },
    // 条件の外の || / && でも，エラーのときに既定値にならない
    {
      code: `${PRELUDE} export function f() { return loadSync() || 0; }`,
      errors: [{ messageId: 'condition' }],
    },
    // 条件の中の && の右辺・undefined を含む Failable
    {
      code: `${PRELUDE} export function f(c: boolean, v: Failable<number> | undefined) { if (c && v) return 1; return 0; }`,
      errors: [{ messageId: 'condition' }],
    },
    // WithError の value がエラーかどうかを真偽値で判定する
    {
      code: `${PRELUDE} declare function ask(): Promise<WithError<Failable<boolean>>>; export async function f() { const r = await ask(); if (r.value) return 1; return 0; }`,
      errors: [{ messageId: 'condition' }],
    },
  ],
});

const guards = [
  { name: 'isError', kind: 'error', declarationFile: /file\.ts$/ },
  { name: 'isValid', kind: 'valid', declarationFile: /file\.ts$/ },
];

ruleTester.run('no-silent-error', noSilentError, {
  valid: [
    // エラーを返す
    {
      code: `${PRELUDE} export async function f() { const v = await load(); if (isError(v)) return v; return v; }`,
      options: [{ guards }],
    },
    // ロガーへ渡す
    {
      code: `${PRELUDE} export async function f() { const v = await load(); if (isError(v)) { logger.warn(v); return; } }`,
      options: [{ guards }],
    },
    // 意図して無視することを明示する
    {
      code: `${PRELUDE} export async function f() { const v = await load(); return isValid(v) ? v : ignoreError(v, '理由'); }`,
      options: [{ guards }],
    },
    // 別のエラーに変換して返す
    {
      code: `${PRELUDE} declare const other: ErrorMessage; export async function f() { const v = await load(); if (isError(v)) return other; return v; }`,
      options: [{ guards }],
    },
    // isValid の後でエラーも含めて返す
    {
      code: `${PRELUDE} export async function f() { const v = await load(); if (isValid(v)) logger.warn(1); return v; }`,
      options: [{ guards }],
    },
    // res.value を判定し，res を丸ごと返す
    {
      code: `${PRELUDE} export async function f() { const res = await loadWithError(); if (isError(res.value)) logger.warn(1); return res; }`,
      options: [{ guards }],
    },
  ],
  invalid: [
    {
      code: `${PRELUDE} export async function f() { const v = await load(); if (isError(v)) return; return v; }`,
      options: [{ guards }],
      errors: [{ messageId: 'silent' }],
    },
    // 既定値への置き換え（エラーをどこにも渡さない）
    {
      code: `${PRELUDE} export async function f() { const v = await load(); return isValid(v) ? v : 0; }`,
      options: [{ guards }],
      errors: [{ messageId: 'silent' }],
    },
    // 否定した判定でも検出する
    {
      code: `${PRELUDE} export async function f() { const v = await load(); if (!isValid(v)) return 0; return v; }`,
      options: [{ guards }],
      errors: [{ messageId: 'silent' }],
    },
    // isValid の else が無く，その後でエラーを使わない
    {
      code: `${PRELUDE} export async function f() { const v = await load(); if (isValid(v)) logger.warn(v); }`,
      options: [{ guards }],
      errors: [{ messageId: 'silent' }],
    },
  ],
});
