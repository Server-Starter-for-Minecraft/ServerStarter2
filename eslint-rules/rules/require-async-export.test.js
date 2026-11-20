import { createRuleTester } from '../utils/ruleTester.js';
import rule from './require-async-export.js';

const ruleTester = createRuleTester();

ruleTester.run('require-async-export', rule, {
  valid: [
    // Promise を返す公開関数
    'export async function load() { return 1; }',
    'export const load = async () => 1;',
    // async キーワードがなくても Promise を返せばよい（型で判定する）
    'export function load(): Promise<number> { return Promise.resolve(1); }',
    // 関数でない値は対象外
    'export const VALUE = 1;',
    'export const config = { a: 1 };',
    // 型の export は対象外
    'export type F = () => number;',
    // 公開しない関数は対象外
    'function helper() { return 1; } export async function load() { return helper(); }',
    // クラスの private メンバー・コンストラクタ・getter は対象外
    `export class Store {
      constructor() {}
      get size() { return 1; }
      private helper() { return 1; }
      #inner() { return 1; }
      async load() { return this.helper() + this.#inner(); }
    }`,
  ],
  invalid: [
    {
      code: 'export function load() { return 1; }',
      errors: [{ messageId: 'notAsync' }],
    },
    {
      code: 'export const load = () => 1;',
      errors: [{ messageId: 'notAsync' }],
    },
    {
      code: 'export default function () { return 1; }',
      errors: [{ messageId: 'notAsync' }],
    },
    {
      // 後から export する形でも検出する
      code: 'function load() { return 1; } export { load };',
      errors: [{ messageId: 'notAsync' }],
    },
    {
      // public メソッドと，関数を値に持つ public プロパティ
      code: `export class Store {
        load() { return 1; }
        save = () => 1;
      }`,
      errors: [{ messageId: 'notAsync' }, { messageId: 'notAsync' }],
    },
    {
      // Promise を返す場合と返さない場合があるもの
      code: 'export function load(a: boolean) { return a ? Promise.resolve(1) : 1; }',
      errors: [{ messageId: 'notAsync' }],
    },
  ],
});
