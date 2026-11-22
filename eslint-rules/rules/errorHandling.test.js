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
    // in-source テストの else の側は本番で実行されるため対象
    {
      code: 'if (import.meta.vitest) { } else { throw new Error(); }',
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
    // オプショナルチェーン・要素アクセス・Promise と他の型の union
    ...[
      'export const f = (p: Promise<number> | undefined) => p?.catch(() => 0);',
      "export const f = (p: Promise<number>) => p['catch'](() => 0);",
      'export const f = (p: Promise<number> | { catch(): void }) => p.catch(() => 0);',
    ].map((code) => ({ code, errors: [{ messageId: 'catch' }] })),
    // Promise のコンストラクタを別の書き方で参照する
    ...[
      'export const f = async () => globalThis.Promise.reject(1);',
      'const P = Promise; export const f = async () => P.reject(1);',
      'declare const executor: (resolve: () => void, reject: () => void) => void; export const p = new Promise(executor);',
      'const { reject } = Promise; export const f = async () => reject(1);',
      'export const f = async () => Promise.reject.call(Promise, 1);',
    ].map((code) => ({ code, errors: [{ messageId: 'reject' }] })),
  ],
});

/** テストのコード（fixtures/file.ts）で宣言した，Failable へ変換する関数 */
const CONVERTERS = [
  { name: 'safeExec', declarationFile: /file.ts$/, async: false },
  { name: 'safeExecAsync', declarationFile: /file.ts$/, async: true },
];
const CONVERTER_PRELUDE = `
declare function safeExec<T>(f: () => T): T;
declare function safeExecAsync<T>(f: () => Promise<T>): Promise<T>;
`;
const throwingOptions = [
  { throwingApis: THROWING_APIS, converters: CONVERTERS },
];

ruleTester.run('no-unsafe-throwing-call', noUnsafeThrowingCall, {
  valid: [
    // Failable へ変換する関数に渡した関数の中では使える
    {
      code: `${CONVERTER_PRELUDE} export const v = safeExec(() => JSON.parse("1"));`,
      options: throwingOptions,
    },
    {
      code: `${CONVERTER_PRELUDE} export const v = safeExecAsync(async () => JSON.parse("1"));`,
      options: throwingOptions,
    },
    // zod の safeParse は例外を投げない
    {
      code: "import { z } from 'zod'; export const v = z.string().safeParse('a');",
      options: throwingOptions,
    },
    // 自作の parse は対象外（宣言元で判定する）
    {
      code: 'const p = { parse: (x: string) => x }; export const v = p.parse("a"); export const w = [""].map(p.parse);',
      options: throwingOptions,
    },
  ],
  invalid: [
    ...[
      'export const v = JSON.parse("1");',
      "import { z } from 'zod'; export const v = z.string().parse('a');",
      "export const v = new URL('a');",
      'export const v = decodeURIComponent("%");',
      // 別名・分割代入・要素アクセスを通した呼び出し
      'const { parse } = JSON; export const v = parse("1");',
      'export const v = JSON["parse"]("1");',
      // 呼び出さずに関数として渡す・変数に入れる
      'export const v = ["1"].map(JSON.parse);',
      'export const v = ["%"].map(decodeURIComponent);',
      // call / apply・オブジェクトのプロパティ・戻り値として渡す
      'export const v = JSON.parse.call(JSON, "1");',
      'export const v = JSON.parse.apply(JSON, ["1"]);',
      'export const handlers = { p: JSON.parse };',
      'export function f() { return JSON.parse; }',
      "import { z } from 'zod'; const s = z.string(); export const p = s.parse;",
    ].map((code) => ({
      code: `${CONVERTER_PRELUDE} ${code}`,
      options: throwingOptions,
      errors: [{ messageId: 'throwing' }],
    })),
    // 変換用の関数の中で作った関数（後で try の外で呼ばれうる）
    {
      code: `${CONVERTER_PRELUDE} export const v = safeExec(() => () => JSON.parse("1"));`,
      options: throwingOptions,
      errors: [{ messageId: 'throwing' }],
    },
    // 同名でも，宣言元が登録したファイルでない関数は変換用の関数とみなさない
    {
      code: `${CONVERTER_PRELUDE} export const v = safeExec(() => JSON.parse("1"));`,
      options: [
        {
          throwingApis: THROWING_APIS,
          converters: [
            { name: 'safeExec', declarationFile: /other.ts$/, async: false },
          ],
        },
      ],
      errors: [{ messageId: 'throwing' }],
    },
    // 同期の変換用の関数に非同期の関数を渡すと，reject は変換されない
    {
      code: `${CONVERTER_PRELUDE} export const v = safeExec(async () => JSON.parse("1"));`,
      options: throwingOptions,
      errors: [{ messageId: 'asyncInSyncConverter' }],
    },
    {
      code: `${CONVERTER_PRELUDE} declare function load(): Promise<number>; export const v = safeExec(load);`,
      options: throwingOptions,
      errors: [{ messageId: 'asyncInSyncConverter' }],
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
    // カンマ演算子・論理演算子の右辺・三項演算子で捨てる
    ...['(loadSync(), 0);', 'c && loadSync();', 'c ? loadSync() : 0;'].map(
      (statement) => ({
        code: `${PRELUDE} export function f(c: boolean) { ${statement} }`,
        errors: [{ messageId: 'ignored' }],
      })
    ),
    // 式文以外の void で捨てる
    {
      code: `${PRELUDE} export function f(xs: number[]) { return xs.map(() => void loadSync()); }`,
      errors: [{ messageId: 'ignored' }],
    },
    // 配列の分割代入の穴で捨てる
    {
      code: `${PRELUDE} export async function f() { const [, b] = await Promise.all([load(), Promise.resolve(1)]); return b; }`,
      errors: [{ messageId: 'ignored' }],
    },
    // 式文の中の void は 1 回だけ報告する
    {
      code: `${PRELUDE} export function f(c: boolean) { c && void loadSync(); }`,
      errors: [{ messageId: 'ignored' }],
    },
    // タプルの，パターンより後ろの要素を捨てる
    {
      code: `${PRELUDE} export async function f() { const [x] = await Promise.all([Promise.resolve(1), load()]); return x; }`,
      errors: [{ messageId: 'ignored' }],
    },
    // 型パラメータ（制約が Failable）の結果を捨てる
    {
      code: `${PRELUDE} export function f<R extends Failable<number>>(g: () => R) { g(); }`,
      errors: [{ messageId: 'ignored' }],
    },
    // 戻り値を使わないコールバック（forEach・setTimeout など）に，結果を返す関数を渡す
    {
      code: `${PRELUDE} export function f(xs: number[]) { xs.forEach(async () => load()); }`,
      errors: [{ messageId: 'discardedCallback' }],
    },
    {
      code: `${PRELUDE} export function f() { setTimeout(() => loadSync(), 0); }`,
      errors: [{ messageId: 'discardedCallback' }],
    },
    {
      code: `${PRELUDE} declare function on(cb: () => void): void; export function f() { on(loadSync); }`,
      errors: [{ messageId: 'discardedCallback' }],
    },
  ],
});

ruleTester.run('no-failable-cast', noFailableCast, {
  valid: [
    `${PRELUDE} export async function f() { const v = await load(); if (isError(v)) return v; return v as number; }`,
    `${PRELUDE} export const c = [1] as const;`,
    // 型パラメータは制約の型で判定する（Failable を制約に持つ型へのアサーションはエラーを消さない）
    `${PRELUDE} export function f<R extends Failable<number>>(x: Failable<number>) { return x as R; }`,
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
    // 型パラメータ（制約が Failable）の値を真偽値で判定する
    {
      code: `${PRELUDE} export function f<R extends Failable<boolean>>(r: R) { if (r) return 1; return 0; }`,
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
    // 偽の分岐がエラーの判定以外の条件（x が無い・ready でない）でも通る場合は，正常の判定を検査しない
    ...[
      'declare const x: { y: Failable<number> } | undefined; export function f() { if (x && isValid(x.y)) logger.warn(x.y); }',
      'declare const ready: boolean; export async function f() { const a = await load(); const b = await load(); if ((isValid(a) || isValid(b)) && ready) logger.warn(1); }',
    ].map((code) => ({ code: `${PRELUDE} ${code}`, options: [{ guards }] })),
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
    // 参照に見えるだけの記述（コメント・文字列・同名の別の変数・プロパティ名）は参照とみなさない
    ...[
      'if (isError(v)) { /* v is ignored */ return; }',
      "if (isError(v)) { logger.warn('v'); return; }",
      'if (isError(v)) { [1].forEach((v) => logger.warn(v)); return; }',
    ].map((branch) => ({
      code: `${PRELUDE} export async function f() { const v = await load(); ${branch} return v; }`,
      options: [{ guards }],
      errors: [{ messageId: 'silent' }],
    })),
    {
      code: `${PRELUDE} export async function f() { const v = await load(); if (isValid(v)) logger.warn(1); return { v: 1 }; }`,
      options: [{ guards }],
      errors: [{ messageId: 'silent' }],
    },
    // && で組み合わせた正常の判定の偽の分岐も，それぞれのエラーを検査する（|| と同じ意味の書き方）
    {
      code: `${PRELUDE} export async function f() { const a = await load(); const b = await load(); if (isValid(a) && isValid(b)) { return a + b; } else { return 0; } }`,
      options: [{ guards }],
      errors: [{ messageId: 'silent' }, { messageId: 'silent' }],
    },
    // || で組み合わせた判定も，それぞれのエラーを検査する
    {
      code: `${PRELUDE} export async function f() { const a = await load(); const b = await load(); if (isError(a) || isError(b)) return; return a + b; }`,
      options: [{ guards }],
      errors: [{ messageId: 'silent' }, { messageId: 'silent' }],
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
