// @ts-check
import { AST_NODE_TYPES, ESLintUtils } from '@typescript-eslint/utils';
import { createRule } from '../utils/createRule.js';
import { returnsThenable } from '../utils/types.js';

/**
 * フロントエンドから呼ばれる IPC の API（invoke）の処理を非同期（Promise を返す）にすることを必須とする
 *
 * バックエンドの処理がメインプロセスを止めると，フロントエンドの操作まで止まってしまう。
 * フロントエンドから呼ばれる処理（IPC の API と処理の対応付けの `handle` に登録した関数）は，
 * 戻り値の型が Promise であることを型チェッカーで確認する。
 *
 * 計算のみの関数まで非同期にする必要はないため，対象は IPC の API の処理に限る
 * （処理の中のブロッキングする I/O は no-blocking-call で，非同期処理の放置は no-floating-promises で検出する）
 */

export default createRule({
  name: 'require-async-ipc-handler',
  meta: {
    type: 'problem',
    docs: {
      description:
        'IPC の API（invoke）の処理は Promise を返す（非同期にする）',
    },
    messages: {
      notAsync:
        'IPC の API「{{name}}」の処理は Promise を返してください（async にする）。同期の処理はフロントエンドの操作を止めます',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const services = ESLintUtils.getParserServices(context);
    const checker = services.program.getTypeChecker();

    return {
      Property(node) {
        // `handle: { ApiName: 処理, ... }` の形の処理を対象とする
        if (
          node.key.type !== AST_NODE_TYPES.Identifier ||
          node.key.name !== 'handle' ||
          node.value.type !== AST_NODE_TYPES.ObjectExpression
        ) {
          return;
        }
        for (const api of node.value.properties) {
          if (api.type !== AST_NODE_TYPES.Property) continue;
          const type = services.getTypeAtLocation(api.value);
          if (returnsThenable(checker, type) === false) {
            const name =
              api.key.type === AST_NODE_TYPES.Identifier
                ? api.key.name
                : '(computed)';
            context.report({
              node: api,
              messageId: 'notAsync',
              data: { name },
            });
          }
        }
      },
    };
  },
});
