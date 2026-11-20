import { createRuleTester } from '../utils/ruleTester.js';
import rule from './require-async-ipc-handler.js';

const ruleTester = createRuleTester();

ruleTester.run('require-async-ipc-handler', rule, {
  valid: [
    // Promise を返す処理
    `async function getWorld() { return 1; }
     export const listener = { handle: { GetWorld: getWorld, Ping: async () => 1 } };`,
    // async キーワードがなくても Promise を返せばよい（型で判定する）
    `function load(): Promise<number> { return Promise.resolve(1); }
     export const listener = { handle: { Load: load } };`,
    // send（on）の処理は結果を返さないため対象外
    'export const listener = { on: { Command: () => undefined } };',
  ],
  invalid: [
    {
      code: `function getWorld() { return 1; }
       export const listener = { handle: { GetWorld: getWorld } };`,
      errors: [{ messageId: 'notAsync' }],
    },
    {
      code: 'export const listener = { handle: { Ping: () => 1 } };',
      errors: [{ messageId: 'notAsync' }],
    },
  ],
});
