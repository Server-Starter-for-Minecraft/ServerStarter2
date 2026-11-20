// @ts-check
import { AST_NODE_TYPES, ESLintUtils } from '@typescript-eslint/utils';
import ts from 'typescript';
import { createRule } from '../utils/createRule.js';
import {
  isInAllowedFunction,
  relativeFilename,
  reportOutsideInSourceTest,
} from '../utils/scope.js';
import { resolveSymbol } from '../utils/types.js';

/**
 * 例外を投げる API の呼び出しを，Failable へ変換する関数（`safeExec` など）の外で行うことを禁止する
 *
 * `JSON.parse` や zod の `parse` などは，入力が不正な場合に例外を投げる。
 * これらを変換せずに呼ぶと，例外がそのまま呼び出し元へ伝わり，アプリが止まる・失敗に気付けない原因となる。
 *
 * 判定は呼び出し側の名前ではなく，型チェッカーで解決した呼び出し先の宣言（名前・所属する型・宣言元のファイル）で行う。
 * 対象の API は設定（`throwingApis`）で指定する。
 * `safeExec` などに直接渡した関数の中での呼び出しは，例外が Failable に変換されるため許可する
 */

/**
 * @typedef {object} ThrowingApi
 * @property {string} name API の名前
 * @property {'call' | 'new'} kind 関数として呼ぶか，new で呼ぶか
 * @property {string} [owner] 所属する型・名前空間の名前（`JSON.parse` の `JSON` など）
 * @property {RegExp} declarationFile 宣言元のファイルのパスに一致する正規表現
 * @property {string} alternative 代わりに使う方法（メッセージに表示する）
 */

export default createRule({
  name: 'no-unsafe-throwing-call',
  meta: {
    type: 'problem',
    docs: {
      description:
        '例外を投げる API を，Failable へ変換する関数の外で呼ぶことを禁止する',
    },
    messages: {
      throwing: '「{{name}}」は例外を投げます。{{alternative}}',
    },
    schema: [
      {
        type: 'object',
        properties: {
          throwingApis: { type: 'array' },
          converters: { type: 'array', items: { type: 'string' } },
          allowed: { type: 'array' },
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [
    /** @type {{ throwingApis: ThrowingApi[]; converters: string[]; allowed: import('../utils/scope.js').AllowedFunctions[] }} */ ({
      throwingApis: [],
      converters: [],
      allowed: [],
    }),
  ],
  create(context, [{ throwingApis, converters, allowed }]) {
    const report = reportOutsideInSourceTest(context);
    const services = ESLintUtils.getParserServices(context);
    const checker = services.program.getTypeChecker();
    const file = relativeFilename(context.filename, context.cwd);

    /**
     * 呼び出し先の宣言が対象の API に一致すれば，その設定を返す
     *
     * @param {import('@typescript-eslint/utils').TSESTree.Node} callee 呼び出し先の式
     * @param {'call' | 'new'} kind 呼び出し方
     * @returns {ThrowingApi | undefined} 一致した API の設定
     */
    function findThrowingApi(callee, kind) {
      const tsNode = services.esTreeNodeToTSNodeMap.get(callee);
      const target = ts.isPropertyAccessExpression(tsNode)
        ? tsNode.name
        : tsNode;
      const symbol = resolveSymbol(checker, target);
      if (symbol === undefined) return undefined;
      return throwingApis.find((api) => {
        if (api.kind !== kind || api.name !== symbol.getName()) return false;
        return (symbol.declarations ?? []).some((decl) => {
          if (!api.declarationFile.test(decl.getSourceFile().fileName)) {
            return false;
          }
          if (api.owner === undefined) return true;
          const owner = decl.parent;
          return (
            owner !== undefined &&
            'name' in owner &&
            owner.name !== undefined &&
            /** @type {ts.Identifier} */ (owner.name).text === api.owner
          );
        });
      });
    }

    /**
     * Failable へ変換する関数（safeExec など）に直接渡した関数の中にあるか
     *
     * @param {import('@typescript-eslint/utils').TSESTree.Node} node 判定するノード
     */
    function isInsideConverter(node) {
      for (
        let current = node.parent;
        current != null;
        current = current.parent
      ) {
        if (
          (current.type === AST_NODE_TYPES.ArrowFunctionExpression ||
            current.type === AST_NODE_TYPES.FunctionExpression) &&
          current.parent?.type === AST_NODE_TYPES.CallExpression &&
          current.parent.arguments.includes(current)
        ) {
          const callee = current.parent.callee;
          const name =
            callee.type === AST_NODE_TYPES.Identifier
              ? callee.name
              : callee.type === AST_NODE_TYPES.MemberExpression &&
                  callee.property.type === AST_NODE_TYPES.Identifier
                ? callee.property.name
                : undefined;
          if (name !== undefined && converters.includes(name)) return true;
        }
      }
      return false;
    }

    /**
     * @param {import('@typescript-eslint/utils').TSESTree.CallExpression | import('@typescript-eslint/utils').TSESTree.NewExpression} node 呼び出し
     * @param {'call' | 'new'} kind 呼び出し方
     */
    function check(node, kind) {
      const api = findThrowingApi(node.callee, kind);
      if (api === undefined) return;
      if (isInsideConverter(node)) return;
      if (isInAllowedFunction(node, file, allowed)) return;
      report({
        node,
        messageId: 'throwing',
        data: {
          name: api.owner ? `${api.owner}.${api.name}` : api.name,
          alternative: api.alternative,
        },
      });
    }

    return {
      CallExpression(node) {
        check(node, 'call');
      },
      NewExpression(node) {
        check(node, 'new');
      },
    };
  },
});
