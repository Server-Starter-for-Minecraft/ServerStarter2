// @ts-check
import { ESLintUtils } from '@typescript-eslint/utils';
import { createRule } from '../utils/createRule.js';
import { resolveSymbol } from '../utils/types.js';

/**
 * 処理が終わるまでメインプロセスを止める（ブロッキングする）API の呼び出しを禁止する
 *
 * 判定は呼び出し側の関数名ではなく，型チェッカーで解決した呼び出し先の宣言元で行う。
 * 宣言元が設定（`blockingModules`）に載っているモジュールの型定義であり，
 * そのモジュールが同期版の API として定めている名前（Node.js・Electron は末尾が `Sync`）を持つ場合に報告する。
 *
 * 自作の関数の中でブロッキングする API を呼んでいれば，その呼び出し箇所で報告されるため，
 * 自作の関数の名前に関係なく（`xxxAsync` と名付けても）検出できる
 */

/**
 * @typedef {object} BlockingModule
 * @property {string} name 報告に使うモジュール名
 * @property {RegExp} declarationFile 型定義ファイルのパスに一致する正規表現
 * @property {RegExp} blockingName そのモジュールでブロッキングする API の名前に一致する正規表現
 */

export default createRule({
  name: 'no-blocking-call',
  meta: {
    type: 'problem',
    docs: {
      description: 'メインプロセスを止める同期 API の呼び出しを禁止する',
    },
    messages: {
      blocking:
        '{{module}} の同期 API「{{name}}」はメインプロセスを止めます。非同期版の API（util の Path などの async メソッド）を使ってください',
    },
    schema: [
      {
        type: 'object',
        properties: {
          blockingModules: { type: 'array' },
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [
    /** @type {{ blockingModules: BlockingModule[] }} */ ({
      blockingModules: [],
    }),
  ],
  create(context, [{ blockingModules }]) {
    const services = ESLintUtils.getParserServices(context);
    const checker = services.program.getTypeChecker();

    return {
      CallExpression(node) {
        const callee = services.esTreeNodeToTSNodeMap.get(node.callee);
        // `a.b.c()` の場合は `c` のシンボルを調べる
        const target =
          'name' in callee && callee.name !== undefined ? callee.name : callee;
        const symbol = resolveSymbol(checker, target);
        if (symbol === undefined) return;

        for (const declaration of symbol.declarations ?? []) {
          const fileName = declaration.getSourceFile().fileName;
          const module = blockingModules.find(
            (m) =>
              m.declarationFile.test(fileName) &&
              m.blockingName.test(symbol.getName())
          );
          if (module !== undefined) {
            context.report({
              node,
              messageId: 'blocking',
              data: { module: module.name, name: symbol.getName() },
            });
            return;
          }
        }
      },
    };
  },
});
