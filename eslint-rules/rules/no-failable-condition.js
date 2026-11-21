// @ts-check
import { AST_NODE_TYPES, ESLintUtils } from '@typescript-eslint/utils';
import ts from 'typescript';
import { createRule } from '../utils/createRule.js';
import { reportOutsideInSourceTest } from '../utils/scope.js';
import { isErrorMessageType, unionParts } from '../utils/types.js';

/**
 * 失敗しうる値（Failable）を真偽値として判定することを禁止する
 *
 * エラー（`ErrorMessage`）はオブジェクトのため，常に真と判定される。
 * `if (!result) return;` のように書くと，エラーが返ったときに成功（true）として扱われてしまう
 * （例：シャットダウンの確認がエラーを返したときに，確認なしでシャットダウンする）。
 * 条件式（if・while・三項演算子・`!`・`&&`/`||` の左辺）に，エラーと成功の値の両方を取りうる値を
 * 使うことを報告する
 */

/**
 * 型が，エラーと成功の値の両方を取りうるか（真偽値で判定すると，エラーと成功を区別できない型か）
 *
 * - `Failable<boolean>` などは対象（エラーが返ると真と判定される）
 * - `ErrorMessage | undefined`（`results.find(isError)` の結果など）は，真偽値の判定が
 *   「エラーがあるか」の確認になるため対象外
 * - Promise の判定は no-misused-promises が扱うため対象外
 *
 * @param {import('typescript').TypeChecker} checker 型チェッカー
 * @param {import('typescript').Type} type 判定する型
 * @returns {boolean} エラーと成功の値が混在すれば true
 */
function mixesErrorAndValue(checker, type) {
  // 型パラメータ（`R extends Failable<T>` など）は制約の型で判定する
  const parts = unionParts(checker.getNonNullableType(type)).flatMap((part) => {
    if (!(part.flags & ts.TypeFlags.TypeParameter)) return [part];
    const constraint = checker.getBaseConstraintOfType(part);
    return constraint === undefined || constraint === part
      ? [part]
      : unionParts(checker.getNonNullableType(constraint));
  });
  const errors = parts.filter((part) => isErrorMessageType(checker, part));
  return errors.length > 0 && errors.length < parts.length;
}

export default createRule({
  name: 'no-failable-condition',
  meta: {
    type: 'problem',
    docs: {
      description: 'Failable を真偽値として判定することを禁止する',
    },
    messages: {
      condition:
        'エラーを含む値を真偽値として判定しています（エラーは常に真になります）。isError / isValid で確認してから値を判定してください',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const report = reportOutsideInSourceTest(context);
    const services = ESLintUtils.getParserServices(context);
    const checker = services.program.getTypeChecker();

    /**
     * 条件として使われる式を検査する
     *
     * @param {import('@typescript-eslint/utils').TSESTree.Node | null | undefined} node 条件式
     */
    function check(node) {
      if (node === null || node === undefined) return;
      // `a && b` を条件にした場合は，両辺がそれぞれ真偽値として判定される
      // （左辺は LogicalExpression の検査で報告するため，ここでは右辺のみを辿る）
      if (
        node.type === AST_NODE_TYPES.LogicalExpression &&
        node.operator !== '??'
      ) {
        check(node.right);
        return;
      }
      if (mixesErrorAndValue(checker, services.getTypeAtLocation(node))) {
        report({ node, messageId: 'condition' });
      }
    }

    return {
      IfStatement: (node) => check(node.test),
      WhileStatement: (node) => check(node.test),
      DoWhileStatement: (node) => check(node.test),
      ForStatement: (node) => check(node.test),
      ConditionalExpression: (node) => check(node.test),
      UnaryExpression: (node) => {
        if (node.operator === '!') check(node.argument);
      },
      // 条件の外の `a || b`・`a && b` でも，左辺は真偽値として判定される
      // （`failable || 既定値` は，エラーのときに既定値にならない）
      LogicalExpression: (node) => {
        if (node.operator === '??') return;
        if (
          mixesErrorAndValue(checker, services.getTypeAtLocation(node.left))
        ) {
          report({ node: node.left, messageId: 'condition' });
        }
      },
    };
  },
});
