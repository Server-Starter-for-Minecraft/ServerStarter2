// @ts-check
import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import { createRule } from '../utils/createRule.js';

/**
 * 指定したモジュールを読み込むことを，読み込み方によらず禁止する
 *
 * 標準の no-restricted-imports は静的な import しか検査しないため，`import('x')`・`require('x')`・
 * `createRequire(...)('x')` で読み込むと制限をすり抜けられる。
 * 静的な import・再エクスポート（`export ... from`）・`import x = require('x')`・動的な import と，
 * 第 1 引数がモジュール名の文字列である関数の呼び出しを報告する。
 * 型のみの import（`import type`）はモジュールを読み込まないため対象外とする。
 *
 * 関数の呼び出しは，呼び出す関数によらず第 1 引数だけで判定する（意図的に広く判定する）。
 * `createRequire` で作った require は任意の名前の変数に入れられるため，呼び出す関数の名前では見分けられないため。
 * モジュール名と同じ文字列を別の用途で関数に渡す場合も報告されるため，対象のファイルを絞って使う
 */

/**
 * @typedef {object} RestrictedModule
 * @property {string} name 禁止するモジュールの名前（配下のモジュール `name/...` も含む）
 * @property {string} message 違反時に表示する，代わりに使うものの案内
 */

/** @typedef {import('@typescript-eslint/utils').TSESTree.Node} Node */

/**
 * モジュール名を表す式から，モジュール名の文字列を取り出す
 *
 * 実行時の値を変えない型の注釈（`'x' as string`・`<string>'x'`・`'x' satisfies string`・`x!`）は取り除いて判定する
 *
 * @param {Node | null | undefined} source モジュール名を表す式
 * @returns {string | undefined} モジュール名（文字列リテラル・式を含まないテンプレートリテラル以外は undefined）
 */
function moduleNameOf(source) {
  if (
    source?.type === AST_NODE_TYPES.TSAsExpression ||
    source?.type === AST_NODE_TYPES.TSTypeAssertion ||
    source?.type === AST_NODE_TYPES.TSSatisfiesExpression ||
    source?.type === AST_NODE_TYPES.TSNonNullExpression
  ) {
    return moduleNameOf(source.expression);
  }
  if (source?.type === AST_NODE_TYPES.Literal) {
    return typeof source.value === 'string' ? source.value : undefined;
  }
  if (
    source?.type === AST_NODE_TYPES.TemplateLiteral &&
    source.expressions.length === 0
  ) {
    return source.quasis[0].value.cooked ?? undefined;
  }
  return undefined;
}

export default createRule({
  name: 'no-restricted-module',
  meta: {
    type: 'problem',
    docs: {
      description:
        '指定したモジュールの読み込みを，静的な import・動的な import・require のいずれでも禁止する',
    },
    messages: {
      restricted: '{{ name }} は読み込めません。{{ message }}',
    },
    schema: [
      {
        type: 'object',
        properties: {
          modules: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                message: { type: 'string' },
              },
              required: ['name', 'message'],
              additionalProperties: false,
            },
          },
        },
        required: ['modules'],
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [{ modules: /** @type {RestrictedModule[]} */ ([]) }],
  create(context, [{ modules }]) {
    /**
     * モジュール名に一致する禁止したモジュールを探す
     *
     * 配下のモジュール（`electron/main` など）も同じモジュールとして扱う。
     * 名前が前方一致するだけの別のパッケージ（`electron-store` など）は含めない
     *
     * @param {string} name 読み込むモジュールの名前
     * @returns {RestrictedModule | undefined} 一致した禁止したモジュール
     */
    const find = (name) =>
      modules.find((m) => name === m.name || name.startsWith(`${m.name}/`));

    /**
     * モジュール名が禁止したものであれば報告する
     *
     * @param {Node} node 報告する位置
     * @param {Node | null | undefined} source モジュール名を表す式
     */
    function check(node, source) {
      const name = moduleNameOf(source);
      if (name === undefined) return;
      const restricted = find(name);
      if (restricted === undefined) return;
      context.report({
        node,
        messageId: 'restricted',
        data: { name: restricted.name, message: restricted.message },
      });
    }

    return {
      ImportDeclaration(node) {
        if (node.importKind === 'type') return;
        check(node, node.source);
      },
      ExportNamedDeclaration(node) {
        if (node.exportKind === 'type') return;
        check(node, node.source);
      },
      ExportAllDeclaration(node) {
        if (node.exportKind === 'type') return;
        check(node, node.source);
      },
      // `import x = require('x')`（TypeScript の書き方）
      TSImportEqualsDeclaration(node) {
        if (node.importKind === 'type') return;
        if (
          node.moduleReference.type !== AST_NODE_TYPES.TSExternalModuleReference
        )
          return;
        check(node, node.moduleReference.expression);
      },
      ImportExpression(node) {
        check(node, node.source);
      },
      // require('x')・createRequire(...)('x') など，呼び出し方によらず第 1 引数で判定する
      CallExpression(node) {
        check(node, node.arguments[0]);
      },
    };
  },
});
