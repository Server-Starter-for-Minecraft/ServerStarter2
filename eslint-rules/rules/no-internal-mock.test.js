import { createRuleTester } from '../utils/ruleTester.js';
import rule from './no-internal-mock.js';

const ruleTester = createRuleTester();
// 境界はプロジェクトのルート（RuleTester では fixtures/tsconfig.json のあるディレクトリ）からのパスで指定する
// （fixtures/internal.ts をプロジェクト内のモジュール，fixtures/boundary.ts を境界として扱う）
const options = [{ boundaries: ['boundary.ts'] }];
const VI = "import { vi } from 'vitest';";

ruleTester.run('no-internal-mock', rule, {
  valid: [
    // 外部のパッケージは差し替えてよい
    { code: `${VI} vi.mock('vitest');`, options },
    // 型定義の無い（解決できない）外部のパッケージ
    { code: `${VI} vi.mock('some-untyped-package');`, options },
    // 外部との境界として登録したモジュールは，相対パス・エイリアスのどちらで指定しても差し替えてよい
    { code: `${VI} vi.mock('./boundary');`, options },
    { code: `${VI} vi.mock('app/boundary');`, options },
    {
      code: `${VI} import { network } from './boundary'; vi.spyOn(network, 'fetch');`,
      options,
    },
    // node_modules のオブジェクトへの spyOn はよい
    { code: `${VI} vi.spyOn(Math, 'random');`, options },
    // テストのファイルの中で作った偽物への spyOn はよい
    {
      code: `${VI} const fake = { run() {} }; vi.spyOn(fake, 'run');`,
      options,
    },
  ],
  invalid: [
    // 相対パス・エイリアス・テンプレートリテラル・import() で指定した自身のモジュール
    ...[
      "vi.mock('./internal');",
      "vi.mock('../fixtures/internal');",
      "vi.doMock('app/internal');",
      'vi.mock(`./internal`);',
      "vi.mock(import('./internal'));",
    ].map((call) => ({
      code: `${VI} ${call}`,
      options,
      errors: [{ messageId: 'internalMock' }],
    })),
    // 存在しないパスはモックが効かない
    {
      code: `${VI} vi.mock('./not-exists');`,
      options,
      errors: [{ messageId: 'unresolvedMock' }],
    },
    // 変数で指定すると，差し替えてよい境界かを検査できない
    {
      code: `${VI} const path = './internal'; vi.mock(path);`,
      options,
      errors: [{ messageId: 'dynamicMock' }],
    },
    // spyOn による自身のモジュールの差し替え（名前空間・公開したオブジェクト・クラスの prototype・インスタンス）
    ...[
      "import * as m from './internal'; vi.spyOn(m, 'fn');",
      "import { store } from './internal'; vi.spyOn(store, 'save');",
      "import { InternalClass } from './internal'; vi.spyOn(InternalClass.prototype, 'run');",
      "import { InternalClass } from './internal'; const h = new InternalClass(); vi.spyOn(h, 'run');",
    ].map((code) => ({
      code: `${VI} ${code}`,
      options,
      errors: [{ messageId: 'internalMock' }],
    })),
  ],
});
