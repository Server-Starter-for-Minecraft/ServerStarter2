// @ts-check
import { AST_NODE_TYPES, ESLintUtils } from '@typescript-eslint/utils';
import ts from 'typescript';
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
 * - `(f(), 0)`・`c && f()`・`c ? f() : g()`（式文の中のカンマ演算子・論理演算子・三項演算子で捨てる）
 * - `xs.map(() => void f())`（式文以外の void で捨てる）
 * - `await Promise.all([...])`・`list.map(f)`（エラーを含む配列を捨てる）
 * - `const [, b] = await Promise.all([f(), g()])`（配列の分割代入の穴で捨てる）
 * - `list.forEach((x) => f(x))`・`setTimeout(() => f(), 0)`（戻り値を使わない（void を返す）
 *   コールバックの引数に，結果を返す関数を渡す。引数の型で判定するため，関数名によらない）
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
      discardedCallback:
        'このコールバックの結果（失敗しうる処理の結果）は呼び出し先で捨てられます。for...of などで結果を確認してください',
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

    /**
     * 式文の中で値が捨てられる式を返す（カンマ演算子・論理演算子の右辺・三項演算子の分岐）
     *
     * 論理演算子の左辺は条件として使われるため対象外とする（Failable の判定は no-failable-condition で検査する）
     *
     * @param {Node} node 式文の式
     * @returns {Node[]} 値が捨てられる式
     */
    function discardedExpressions(node) {
      const expr = unwrap(node);
      switch (expr.type) {
        case AST_NODE_TYPES.SequenceExpression:
          return expr.expressions.flatMap(discardedExpressions);
        case AST_NODE_TYPES.LogicalExpression:
          return discardedExpressions(expr.right);
        case AST_NODE_TYPES.ConditionalExpression:
          return [
            ...discardedExpressions(expr.consequent),
            ...discardedExpressions(expr.alternate),
          ];
        default:
          return [expr];
      }
    }

    /**
     * 関数の型が，エラーを含む値を返すか
     *
     * @param {ts.Type} type 関数の型
     */
    function returnsErrorType(type) {
      return type
        .getCallSignatures()
        .some((sig) => containsError(checker, sig.getReturnType()));
    }

    /**
     * 引数の位置が，戻り値を使わない（void を返す）コールバックを受け取るか
     *
     * @param {Node} arg 引数
     */
    function expectsVoidCallback(arg) {
      const contextual = checker.getContextualType(
        /** @type {ts.Expression} */ (services.esTreeNodeToTSNodeMap.get(arg))
      );
      if (contextual === undefined) return false;
      const signatures = contextual.getCallSignatures();
      return (
        signatures.length > 0 &&
        signatures.every(
          (sig) => (sig.getReturnType().flags & ts.TypeFlags.Void) !== 0
        )
      );
    }

    return {
      ExpressionStatement(node) {
        for (const expr of discardedExpressions(node.expression)) {
          // 代入は結果を使っているため対象外
          if (expr.type === AST_NODE_TYPES.AssignmentExpression) continue;
          if (isHandlerCall(expr)) continue;
          if (hasError(expr)) {
            report({ node, messageId: 'ignored' });
            return;
          }
        }
      },
      // 式文以外の void（`() => void f()` など）でも結果を捨てる
      UnaryExpression(node) {
        if (node.operator !== 'void') return;
        if (node.parent.type === AST_NODE_TYPES.ExpressionStatement) return;
        if (hasError(unwrap(node.argument))) {
          report({ node, messageId: 'ignored' });
        }
      },
      // 戻り値を使わないコールバックに，結果を返す関数を渡す
      CallExpression(node) {
        for (const arg of node.arguments) {
          if (
            arg.type !== AST_NODE_TYPES.ArrowFunctionExpression &&
            arg.type !== AST_NODE_TYPES.FunctionExpression &&
            arg.type !== AST_NODE_TYPES.Identifier &&
            arg.type !== AST_NODE_TYPES.MemberExpression
          ) {
            continue;
          }
          if (!returnsErrorType(services.getTypeAtLocation(arg))) continue;
          if (expectsVoidCallback(arg)) {
            report({ node: arg, messageId: 'discardedCallback' });
          }
        }
      },
      // 配列の分割代入の穴（`const [, b] = ...`）で，エラーを含む要素を捨てる
      ArrayPattern(node) {
        const parent = node.parent;
        const init =
          parent.type === AST_NODE_TYPES.VariableDeclarator
            ? parent.init
            : parent.type === AST_NODE_TYPES.AssignmentExpression
              ? parent.right
              : null;
        if (init === null) return;
        const type = services.getTypeAtLocation(init);
        /** @type {(index: number) => ts.Type | undefined} */
        const elementType = checker.isTupleType(type)
          ? (index) =>
              checker.getTypeArguments(/** @type {ts.TypeReference} */ (type))[
                index
              ]
          : checker.isArrayType(type)
            ? () =>
                checker.getTypeArguments(
                  /** @type {ts.TypeReference} */ (type)
                )[0]
            : () => undefined;
        node.elements.forEach((element, index) => {
          if (element !== null) return;
          const elemType = elementType(index);
          if (elemType !== undefined && containsError(checker, elemType)) {
            report({ node, messageId: 'ignored' });
          }
        });
      },
    };
  },
});
