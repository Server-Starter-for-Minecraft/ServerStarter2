// @ts-check
import { AST_NODE_TYPES, ESLintUtils } from '@typescript-eslint/utils';
import { createRule } from '../utils/createRule.js';
import { reportOutsideInSourceTest } from '../utils/scope.js';
import { containsError } from '../utils/types.js';

/**
 * 型アサーションで，失敗しうる値（Failable・WithError）のエラーを型から消すことを禁止する
 *
 * `result as Value` のように書くと，エラーかどうかを確認しないまま成功した値として扱えてしまう。
 * エラーを含む型から含まない型への型アサーション（`as`・`<T>x`・`x!`）を報告する
 */

export default createRule({
  name: 'no-failable-cast',
  meta: {
    type: 'problem',
    docs: {
      description:
        '型アサーションで Failable のエラーを型から消すことを禁止する',
    },
    messages: {
      cast: '型アサーションでエラーの可能性を消しています。isError / isValid で確認してから値を使ってください',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const report = reportOutsideInSourceTest(context);
    const services = ESLintUtils.getParserServices(context);
    const checker = services.program.getTypeChecker();

    /**
     * @param {import('@typescript-eslint/utils').TSESTree.TSAsExpression | import('@typescript-eslint/utils').TSESTree.TSTypeAssertion | import('@typescript-eslint/utils').TSESTree.TSNonNullExpression} node 型アサーション
     */
    function check(node) {
      // `as const` は型を狭めるだけなので対象外
      if (
        node.type !== AST_NODE_TYPES.TSNonNullExpression &&
        node.typeAnnotation.type === AST_NODE_TYPES.TSTypeReference &&
        node.typeAnnotation.typeName.type === AST_NODE_TYPES.Identifier &&
        node.typeAnnotation.typeName.name === 'const'
      ) {
        return;
      }
      const source = services.getTypeAtLocation(node.expression);
      const target = services.getTypeAtLocation(node);
      if (containsError(checker, source) && !containsError(checker, target)) {
        report({ node, messageId: 'cast' });
      }
    }

    return {
      TSAsExpression: check,
      TSTypeAssertion: check,
      TSNonNullExpression: check,
    };
  },
});
