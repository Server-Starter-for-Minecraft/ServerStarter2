import { createRuleTester } from '../utils/ruleTester.js';
import rule from './no-internal-mock.js';

const ruleTester = createRuleTester();
// RuleTester ではファイル名がテストのコードの置き場所からの相対パスとなるため，境界もそこからのパスで指定する
const options = [{ boundaries: ['boundary.ts'] }];
// テストのコードは eslint-rules/fixtures/file.ts として解析される（相対パスはそこからの位置として解決する）
const filename = 'file.ts';

ruleTester.run('no-internal-mock', rule, {
  valid: [
    // 外部のパッケージは差し替えてよい
    {
      code: "import { vi } from 'vitest'; vi.mock('electron');",
      options,
      filename,
    },
    // 外部との境界として登録したモジュールは差し替えてよい
    {
      code: "import { vi } from 'vitest'; vi.mock('./boundary');",
      options,
      filename,
    },
    // node_modules のオブジェクトへの spyOn はよい
    {
      code: "import { vi } from 'vitest'; vi.spyOn(Math, 'random');",
      options,
      filename,
    },
    // テストのファイルの中で作った偽物への spyOn はよい
    {
      code: "import { vi } from 'vitest'; const fake = { run() {} }; vi.spyOn(fake, 'run');",
      options,
      filename,
    },
  ],
  invalid: [
    // 相対パス・エイリアスで指定した自身のモジュール
    {
      code: "import { vi } from 'vitest'; vi.mock('./internal');",
      options,
      filename,
      errors: [{ messageId: 'internalMock' }],
    },
    {
      code: "import { vi } from 'vitest'; vi.doMock('app/src-electron/source/world/local');",
      options,
      filename,
      errors: [{ messageId: 'internalMock' }],
    },
    {
      code: "import { vi } from 'vitest'; vi.mock('src-electron/source/world/local');",
      options,
      filename,
      errors: [{ messageId: 'internalMock' }],
    },
  ],
});
