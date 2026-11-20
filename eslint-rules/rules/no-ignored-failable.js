// @ts-check
import { AST_NODE_TYPES, ESLintUtils } from '@typescript-eslint/utils';
import { createRule } from '../utils/createRule.js';
import { reportOutsideInSourceTest } from '../utils/scope.js';
import { containsError, resolveSymbol } from '../utils/types.js';

/**
 * 失敗しうる処理の結果（Failable・WithError）を使わずに捨てることを禁止する
 *
 * 結果を捨てると，処理が失敗しても誰も気付かず，成功したものとして処理が進む。
 * private な関数が Failable を返していても，呼び出し側が結果を確認せずに捨てれば失敗は握りつぶされるため，
 * 呼び出し側で必ず確認させる。
 *
 * 判定は戻り値の型（ServerStarter2 のエラーの構造を含むか）で行う。
 * 次のような回避の形も検出する
 * - `await f()`・`void f()`・`f() as unknown`（式文として結果を捨てる）
 * - `await Promise.all([...])`・`list.map(f)`（エラーを含む配列を捨てる）
 * - `list.forEach(async (x) => f(x))`（コールバックの結果が捨てられる）
 *
 * エラーを処理する関数（`checkError` など。設定 `handlers`）の戻り値は，捨てても見落としにならないため対象外とする
 */

/** @typedef {import('@typescript-eslint/utils').TSESTree.Node} Node */

export default createRule({
  name: 'no-ignored-failable',
  meta: {
    type: 'problem',
    docs: {
      description: 'Failable・WithError の結果を確認せずに捨てることを禁止する',
    },
    messages: {
      ignored:
        '失敗しうる処理の結果を捨てています。isError で確認してエラーを返すか，ロガーへ渡すか，意図して無視する場合は ignoreError で理由を明示してください',
      forEach:
        'forEach のコールバックの結果（失敗しうる処理の結果）は捨てられます。for...of で結果を確認してください',
    },
    schema: [
      {
        type: 'object',
        properties: { handlers: { type: 'array' } },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [
    /** @type {{ handlers: { name: string; declarationFile: RegExp }[] }} */ ({
      handlers: [],
    }),
  ],
  create(context, [{ handlers }]) {
    const report = reportOutsideInSourceTest(context);
    const services = ESLintUtils.getParserServices(context);
    const checker = services.program.getTypeChecker();

    /**
     * 結果を捨てる意味しか持たない包み（await・void・型アサーション・括弧）を外す
     *
     * @param {Node} node 式
     * @returns {Node} 内側の式
     */
    function unwrap(node) {
      switch (node.type) {
        case AST_NODE_TYPES.AwaitExpression:
          return unwrap(node.argument);
        case AST_NODE_TYPES.UnaryExpression:
          return node.operator === 'void' ? unwrap(node.argument) : node;
        case AST_NODE_TYPES.TSAsExpression:
        case AST_NODE_TYPES.TSTypeAssertion:
        case AST_NODE_TYPES.TSNonNullExpression:
        case AST_NODE_TYPES.TSSatisfiesExpression:
          return unwrap(node.expression);
        case AST_NODE_TYPES.ChainExpression:
          return unwrap(node.expression);
        default:
          return node;
      }
    }

    /**
     * エラーを処理する関数の呼び出しか
     *
     * @param {Node} node 判定する式
     */
    function isHandlerCall(node) {
      if (node.type !== AST_NODE_TYPES.CallExpression) return false;
      const symbol = resolveSymbol(
        checker,
        services.esTreeNodeToTSNodeMap.get(node.callee)
      );
      if (symbol === undefined) return false;
      return handlers.some(
        (h) =>
          h.name === symbol.getName() &&
          (symbol.declarations ?? []).some((d) =>
            h.declarationFile.test(d.getSourceFile().fileName)
          )
      );
    }

    /**
     * @param {Node} node 型を調べるノード
     */
    function hasError(node) {
      return containsError(checker, services.getTypeAtLocation(node));
    }

    return {
      ExpressionStatement(node) {
        const expr = unwrap(node.expression);
        // 代入は結果を使っているため対象外
        if (expr.type === AST_NODE_TYPES.AssignmentExpression) return;
        if (isHandlerCall(expr)) return;
        if (hasError(expr)) {
          report({ node, messageId: 'ignored' });
          return;
        }
        // forEach のコールバックがエラーを返す
        if (
          expr.type === AST_NODE_TYPES.CallExpression &&
          expr.callee.type === AST_NODE_TYPES.MemberExpression &&
          expr.callee.property.type === AST_NODE_TYPES.Identifier &&
          expr.callee.property.name === 'forEach'
        ) {
          const callback = expr.arguments[0];
          if (callback === undefined) return;
          const type = services.getTypeAtLocation(callback);
          const returnsError = type
            .getCallSignatures()
            .some((sig) => containsError(checker, sig.getReturnType()));
          if (returnsError) report({ node, messageId: 'forEach' });
        }
      },
    };
  },
});
