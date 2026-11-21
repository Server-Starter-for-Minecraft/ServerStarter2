// @ts-check
import {
  AST_NODE_TYPES,
  ASTUtils,
  ESLintUtils,
} from '@typescript-eslint/utils';
import { createRule } from '../utils/createRule.js';
import { reportOutsideInSourceTest } from '../utils/scope.js';
import { containsError, resolveSymbol } from '../utils/types.js';

/**
 * エラーを確認した後に，そのエラーを使わずに処理を終える（握りつぶす）ことを禁止する
 *
 * ログの方針として，エラーは原則として呼び出し元へ返し，API の監視でログに残す。
 * 返さずに処理を続ける場合は，ロガーへ渡すか WithError の errors に積み，
 * 意図して無視してよいエラーは `ignoreError(error, '理由')` で明示する。
 *
 * 判定方法
 * - `isError(x)`（`!isValid(x)`）が真の分岐で，x を一度も参照しない場合に報告する
 *   （返す・包んで返す・errors に積む・ロガーへ渡す・ignoreError に渡す，のいずれも x を参照する）
 * - `isValid(x)`（`!isError(x)`）が偽の分岐（else）で x を参照しない場合に報告する。
 *   else が無い場合は，if 文の後で x を参照しなければ報告する（エラーの経路で x が失われるため）
 * - 三項演算子も同様に判定する
 * - `isError(a) || isError(b)` のように `||`・`&&` で組み合わせた場合は，判定ごとに検査する
 * - エラーの分岐で別のエラー（errorMessage で作ったものなど）を返す・代入する・関数に渡す場合は，
 *   エラーを変換して伝えているため報告しない
 * - エラーの分岐が処理を抜けない（return などで終わらない）場合は，if 文の後で参照していれば報告しない
 * - `res.value` のように判定した場合は，`res` を丸ごと渡す・返す場合も参照とみなす
 * - 参照は変数の解決（スコープ解析）で判定する（コメント・文字列・同名の別の変数・プロパティ名は参照とみなさない）
 *
 * エラーの判定関数は，型チェッカーで解決した宣言（名前と宣言元のファイル）で特定する（設定 `guards`）
 */

/** @typedef {import('@typescript-eslint/utils').TSESTree.Node} Node */
/** @typedef {import('@typescript-eslint/utils').TSESTree.Expression} Expression */

/**
 * @typedef {object} ErrorGuard
 * @property {string} name 判定関数の名前
 * @property {'error' | 'valid'} kind エラーのときに真を返すか（error），正常のときに真を返すか（valid）
 * @property {RegExp} declarationFile 宣言元のファイルのパスに一致する正規表現
 */

export default createRule({
  name: 'no-silent-error',
  meta: {
    type: 'problem',
    docs: {
      description: 'エラーを確認した後に使わずに握りつぶすことを禁止する',
    },
    messages: {
      silent:
        'エラー「{{name}}」を使わずに処理を終えています。エラーを返す・WithError の errors に積む・ロガーへ渡す・意図して無視する場合は ignoreError(エラー, 理由) で明示する，のいずれかを行ってください',
    },
    schema: [
      {
        type: 'object',
        properties: { guards: { type: 'array' } },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [/** @type {{ guards: ErrorGuard[] }} */ ({ guards: [] })],
  create(context, [{ guards }]) {
    const report = reportOutsideInSourceTest(context);
    const services = ESLintUtils.getParserServices(context);
    const checker = services.program.getTypeChecker();
    const sourceCode = context.sourceCode;

    /**
     * 条件式に含まれるエラーの判定を返す（`&&`・`||` で組み合わせた場合はそれぞれの判定）
     *
     * 組み合わせた判定は，その分岐を通るときに必ずエラーであるものに限る
     * - `isError(a) || ...`・`isError(a) && ...`：真の分岐は a がエラーの経路
     * - `isValid(a) || ...`：偽の分岐は a がエラーの経路
     * - `x && isValid(x.y)` の偽の分岐は，x が無い場合にも通るため対象外とする
     *
     * @param {Expression} test 条件式
     * @param {'&&' | '||'} [operator] 組み合わせている演算子（組み合わせていない場合は undefined）
     * @returns {{ errorWhenTrue: boolean; target: Node }[]} 判定の内容
     */
    function parseGuards(test, operator) {
      if (
        test.type === AST_NODE_TYPES.LogicalExpression &&
        test.operator !== '??'
      ) {
        return [
          ...parseGuards(test.left, test.operator),
          ...parseGuards(test.right, test.operator),
        ];
      }
      const guard = parseGuard(test);
      if (guard === undefined) return [];
      if (operator === '&&' && !guard.errorWhenTrue) return [];
      return [guard];
    }

    /**
     * 条件式がエラーの判定であれば，判定の種類と判定対象の式を返す
     *
     * @param {Expression} test 条件式
     * @returns {{ errorWhenTrue: boolean; target: Node } | undefined} 判定の内容
     */
    function parseGuard(test) {
      let negated = false;
      let expr = test;
      while (
        expr.type === AST_NODE_TYPES.UnaryExpression &&
        expr.operator === '!'
      ) {
        negated = !negated;
        expr = expr.argument;
      }
      if (expr.type !== AST_NODE_TYPES.CallExpression) return undefined;
      const target = expr.arguments[0];
      if (
        target === undefined ||
        target.type === AST_NODE_TYPES.SpreadElement
      ) {
        return undefined;
      }
      const symbol = resolveSymbol(
        checker,
        services.esTreeNodeToTSNodeMap.get(expr.callee)
      );
      if (symbol === undefined) return undefined;
      const guard = guards.find(
        (g) =>
          g.name === symbol.getName() &&
          (symbol.declarations ?? []).some((d) =>
            g.declarationFile.test(d.getSourceFile().fileName)
          )
      );
      if (guard === undefined) return undefined;
      const errorWhenTrue = (guard.kind === 'error') !== negated;
      return { errorWhenTrue, target };
    }

    /**
     * 判定対象の式の参照を判定する関数を作る
     *
     * 判定対象の式の根の変数（`res.value` の `res`）をスコープから解決し，その変数の参照のうち，
     * 判定対象と同じ式（`res.value`）か，変数を丸ごと使うもの（`res` の後にプロパティが続かないもの）を参照とみなす
     *
     * @param {Node} target 判定対象の式
     * @returns {((ref: import('@typescript-eslint/utils').TSESLint.Scope.Reference) => boolean) | undefined} 参照かを判定する関数（変数を解決できない場合は undefined）
     */
    function referenceMatcher(target) {
      /** @type {string[]} */
      const properties = [];
      let root = target;
      while (
        root.type === AST_NODE_TYPES.MemberExpression &&
        !root.computed &&
        root.property.type === AST_NODE_TYPES.Identifier
      ) {
        properties.unshift(root.property.name);
        root = root.object;
      }
      if (root.type !== AST_NODE_TYPES.Identifier) return undefined;
      const variable = ASTUtils.findVariable(
        sourceCode.getScope(root),
        root.name
      );
      if (variable === null) return undefined;
      const variableRefs = new Set(variable.references);
      return (ref) => {
        if (!variableRefs.has(ref) || ref.identifier === root) return false;
        /** @type {Node} */
        let expr = ref.identifier;
        for (const property of properties) {
          const parent = expr.parent;
          if (
            parent?.type !== AST_NODE_TYPES.MemberExpression ||
            parent.object !== expr
          ) {
            // 変数を丸ごと使う（渡す・返すなど）
            return true;
          }
          if (
            parent.computed ||
            parent.property.type !== AST_NODE_TYPES.Identifier ||
            parent.property.name !== property
          ) {
            // 別のプロパティ（`res.errors` など）
            return false;
          }
          expr = parent;
        }
        return true;
      };
    }

    /**
     * 判定対象の式を，範囲の中で参照しているか
     *
     * @param {Node} target 判定対象の式
     * @param {(ref: import('@typescript-eslint/utils').TSESLint.Scope.Reference) => boolean} isReference 参照かを判定する関数
     * @param {(position: number) => boolean} inRange 範囲の中の位置か
     */
    function referencedIn(target, isReference, inRange) {
      const variable = ASTUtils.findVariable(
        sourceCode.getScope(target),
        rootName(target)
      );
      return (
        variable !== null &&
        variable.references.some(
          (ref) => inRange(ref.identifier.range[0]) && isReference(ref)
        )
      );
    }

    /**
     * 判定対象の式の根の変数名を返す
     *
     * @param {Node} target 判定対象の式
     * @returns {string} 根の変数名（変数でない場合は空文字列）
     */
    function rootName(target) {
      let root = target;
      while (root.type === AST_NODE_TYPES.MemberExpression) root = root.object;
      return root.type === AST_NODE_TYPES.Identifier ? root.name : '';
    }

    /**
     * 分岐が処理を抜ける（return・continue・break・throw で終わる）か
     *
     * @param {Node} branch 分岐
     */
    function exits(branch) {
      const last =
        branch.type === AST_NODE_TYPES.BlockStatement
          ? branch.body[branch.body.length - 1]
          : branch;
      return (
        last !== undefined &&
        (last.type === AST_NODE_TYPES.ReturnStatement ||
          last.type === AST_NODE_TYPES.ContinueStatement ||
          last.type === AST_NODE_TYPES.BreakStatement ||
          last.type === AST_NODE_TYPES.ThrowStatement)
      );
    }

    /**
     * 分岐の中で，エラーの型の値を返す・代入する・関数に渡しているか（エラーを別のエラーに変換して伝えているか）
     *
     * @param {Node | null} branch 分岐
     */
    function returnsError(branch) {
      if (branch === null) return false;
      /** @type {Node[]} */
      const stack = [branch];
      while (stack.length > 0) {
        const node = /** @type {Node} */ (stack.pop());
        /** @param {Node | null | undefined} value */
        const isErrorValue = (value) =>
          value !== null &&
          value !== undefined &&
          containsError(checker, services.getTypeAtLocation(value));
        if (node.type === AST_NODE_TYPES.ReturnStatement) {
          if (isErrorValue(node.argument)) return true;
          continue;
        }
        if (
          node.type === AST_NODE_TYPES.AssignmentExpression &&
          isErrorValue(node.right)
        ) {
          return true;
        }
        if (
          node.type === AST_NODE_TYPES.CallExpression &&
          node.arguments.some((arg) => isErrorValue(arg))
        ) {
          return true;
        }
        // 入れ子の関数の return は対象外
        if (
          node.type === AST_NODE_TYPES.FunctionDeclaration ||
          node.type === AST_NODE_TYPES.FunctionExpression ||
          node.type === AST_NODE_TYPES.ArrowFunctionExpression
        ) {
          continue;
        }
        for (const key of Object.keys(node)) {
          if (key === 'parent') continue;
          const child = /** @type {Record<string, unknown>} */ (node)[key];
          if (Array.isArray(child)) {
            for (const c of child) {
              if (c && typeof c === 'object' && 'type' in c) stack.push(c);
            }
          } else if (child && typeof child === 'object' && 'type' in child) {
            stack.push(/** @type {Node} */ (child));
          }
        }
      }
      return false;
    }

    /**
     * if 文の後（同じ関数の中）で判定対象の式を参照しているか
     *
     * @param {Node} statement if 文
     * @param {Node} target 判定対象の式
     * @param {(ref: import('@typescript-eslint/utils').TSESLint.Scope.Reference) => boolean} isReference 参照かを判定する関数
     */
    function referencedAfter(statement, target, isReference) {
      /** @type {Node | undefined} */
      let fn = statement.parent;
      while (
        fn != null &&
        fn.type !== AST_NODE_TYPES.FunctionDeclaration &&
        fn.type !== AST_NODE_TYPES.FunctionExpression &&
        fn.type !== AST_NODE_TYPES.ArrowFunctionExpression &&
        fn.type !== AST_NODE_TYPES.Program
      ) {
        fn = fn.parent;
      }
      if (fn == null) return false;
      const end = fn.range[1];
      return referencedIn(
        target,
        isReference,
        (position) => position >= statement.range[1] && position < end
      );
    }

    /**
     * 分岐を検査する
     *
     * @param {Node} node 報告する位置
     * @param {Expression} test 条件式
     * @param {Node} consequent 真の分岐
     * @param {Node | null} alternate 偽の分岐
     * @param {boolean} isStatement if 文か（三項演算子でないか）
     */
    function check(node, test, consequent, alternate, isStatement) {
      for (const guard of parseGuards(test)) {
        const isReference = referenceMatcher(guard.target);
        // 変数として解決できない式（関数の呼び出しの結果など）は判定できないため対象外
        if (isReference === undefined) continue;
        const targetText = sourceCode.getText(guard.target);
        const errorBranch = guard.errorWhenTrue ? consequent : alternate;

        const handled =
          errorBranch === null
            ? // エラーの分岐が無い場合は，その後で参照していればよい
              isStatement && referencedAfter(node, guard.target, isReference)
            : referencedIn(
                guard.target,
                isReference,
                (position) =>
                  position >= errorBranch.range[0] &&
                  position < errorBranch.range[1]
              ) ||
              (isStatement && returnsError(errorBranch)) ||
              (isStatement &&
                !exits(errorBranch) &&
                referencedAfter(node, guard.target, isReference));
        if (!handled) {
          report({ node, messageId: 'silent', data: { name: targetText } });
        }
      }
    }

    return {
      IfStatement(node) {
        check(node, node.test, node.consequent, node.alternate, true);
      },
      ConditionalExpression(node) {
        check(node, node.test, node.consequent, node.alternate, false);
      },
    };
  },
});
