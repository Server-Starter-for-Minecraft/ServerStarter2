import { BLOCKING_MODULES } from '../config.js';
import { createRuleTester } from '../utils/ruleTester.js';
import rule from './no-blocking-call.js';

const ruleTester = createRuleTester();
const options = [{ blockingModules: BLOCKING_MODULES }];

ruleTester.run('no-blocking-call', rule, {
  valid: [
    // 非同期版の API
    {
      code: "import { promises } from 'fs'; await promises.readFile('a');",
      options,
    },
    {
      code: "import { readFile } from 'fs/promises'; await readFile('a');",
      options,
    },
    // 自作の関数は，名前の末尾が Sync でも宣言元が対象のモジュールでなければ報告しない
    {
      code: 'function loadSync() { return 1; } loadSync();',
      options,
    },
  ],
  invalid: [
    {
      code: "import { existsSync } from 'fs'; existsSync('a');",
      options,
      errors: [{ messageId: 'blocking' }],
    },
    {
      // 名前空間経由・別名を付けた import でも，宣言元で判定する
      code: "import fs from 'fs'; fs.readFileSync('a');",
      options,
      errors: [{ messageId: 'blocking' }],
    },
    {
      code: "import { execSync as run } from 'child_process'; run('ls');",
      options,
      errors: [{ messageId: 'blocking' }],
    },
    {
      // 自作の関数の名前を Async にしても，中のブロッキングする呼び出しで検出する
      code: "import { readFileSync } from 'fs'; export async function loadAsync() { return readFileSync('a'); }",
      options,
      errors: [{ messageId: 'blocking' }],
    },
  ],
});
