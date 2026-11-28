import { createRuleTester } from '../utils/ruleTester.js';
import rule from './no-restricted-module.js';

const ruleTester = createRuleTester();
const options = [{ modules: [{ name: 'electron', message: 'use runtime' }] }];
const errors = [
  {
    messageId: 'restricted',
    data: { name: 'electron', message: 'use runtime' },
  },
];

ruleTester.run('no-restricted-module', rule, {
  valid: [
    // 制限していないモジュール
    { code: "import { z } from 'zod';", options },
    { code: "export const m = require('zod');", options },
    { code: "export const load = () => import('./local');", options },
    // 名前が前方一致するだけの別のパッケージ
    { code: "import Store from 'electron-store';", options },
    { code: "export const m = require('electron-store');", options },
    // 型のみの import・型の参照はモジュールを読み込まない
    { code: "import type { App } from 'electron';", options },
    { code: "export type { App } from 'electron';", options },
    { code: "export type M = typeof import('electron');", options },
    // モジュール名が文字列で書かれていない呼び出し
    { code: 'const name = "x"; export const m = require(name);', options },
    { code: 'export const m = (s: string) => require(`${s}`);', options },
    // 型の注釈で囲んでも，禁止していないモジュールは報告しない
    { code: "export const m = require('zod' as string);", options },
  ],
  invalid: [
    { code: "import { app } from 'electron';", options, errors },
    { code: "import 'electron';", options, errors },
    // 型の指定子を含んでいても，値の import があればモジュールを読み込む
    { code: "import { type App, app } from 'electron';", options, errors },
    { code: "export { app } from 'electron';", options, errors },
    { code: "export * from 'electron';", options, errors },
    { code: "import electron = require('electron');", options, errors },
    { code: "export const load = () => import('electron');", options, errors },
    { code: "export const m = require('electron');", options, errors },
    { code: 'export const m = require(`electron`);', options, errors },
    // 実行時の値を変えない型の注釈で囲んでも，モジュール名で判定する
    {
      code: "export const m = require('electron' as string);",
      options,
      errors,
    },
    {
      code: "export const load = () => import('electron' satisfies string);",
      options,
      errors,
    },
    { code: "export const m = require(<string>'electron');", options, errors },
    // 配下のモジュール（Electron の公式の入口）も同じモジュールとして扱う
    { code: "import { app } from 'electron/main';", options, errors },
    { code: "export const m = require('electron/main');", options, errors },
    // createRequire で作った require（任意の名前の変数に入れられる）からの読み込み
    {
      code: "import { createRequire } from 'module'; export const m = createRequire(import.meta.url)('electron');",
      options,
      errors,
    },
    {
      code: "import { createRequire } from 'module'; const load = createRequire(import.meta.url); export const m = load('electron');",
      options,
      errors,
    },
    // 呼び出す関数によらず第 1 引数で判定する（意図的に広く判定する）
    { code: "export const m = anyFunction('electron');", options, errors },
  ],
});
