// @ts-check
import { AST_NODE_TYPES, ESLintUtils } from '@typescript-eslint/utils';
import ts from 'typescript';
import { createRule } from '../utils/createRule.js';
import { projectFilename, projectRoot } from '../utils/scope.js';
import { resolveSymbol } from '../utils/types.js';

/**
 * テストで，プロジェクト自身のモジュールを差し替える（mock する）ことを禁止する
 *
 * 自身のモジュールを差し替えると，テストが実装の内部構造（どのモジュールをどの順で呼ぶか）に依存し，
 * 振る舞いを変えないリファクタリングでもテストが壊れる。差し替えてよいのは外部との境界
 * （ネットワーク・OS・Electron など。設定 `boundaries` に登録したもの）だけとし，
 * それ以外は依存をコンストラクタや引数で渡す形にしてテストする。
 *
 * 検出するもの
 * - `vi.mock(path)`・`vi.doMock(path)`：path を TypeScript のモジュール解決（tsconfig の paths を含む）で
 *   解決した先がプロジェクト内のファイル（node_modules 以外）。`vi.mock(import(path))` の形も含む
 *   （解決できないパスは，効かないモックになるため別に報告する）
 * - `vi.spyOn(target, ...)`：target の宣言元，または target がクラスのインスタンス・prototype の場合は
 *   そのクラスの宣言元が，プロジェクト内のファイル（node_modules 以外）
 */

/**
 * ファイルの絶対パスを，プロジェクトのルートからの拡張子なしのパスにする
 *
 * @param {string} fileName ファイルの絶対パス
 * @param {string} root プロジェクトのルートの絶対パス
 * @returns {string} ルートからの拡張子なしのパス
 */
function toModulePath(fileName, root) {
  const normalized = fileName.replaceAll('\\', '/');
  const relative = normalized.startsWith(`${root}/`)
    ? normalized.slice(root.length + 1)
    : normalized;
  return relative.replace(/\.(d\.ts|ts|js|vue)$/, '');
}

/**
 * vi.mock の第 1 引数から，モジュールの指定（文字列）を取り出す
 *
 * @param {import('@typescript-eslint/utils').TSESTree.Node} node 第 1 引数
 * @returns {string | undefined} モジュールの指定（文字列で指定されていない場合は undefined）
 */
function moduleSpecifier(node) {
  if (node.type === AST_NODE_TYPES.Literal && typeof node.value === 'string') {
    return node.value;
  }
  if (
    node.type === AST_NODE_TYPES.TemplateLiteral &&
    node.expressions.length === 0
  ) {
    return node.quasis[0]?.value.cooked ?? undefined;
  }
  // vi.mock(import('./x'))
  if (node.type === AST_NODE_TYPES.ImportExpression) {
    return moduleSpecifier(node.source);
  }
  return undefined;
}

export default createRule({
  name: 'no-internal-mock',
  meta: {
    type: 'problem',
    docs: {
      description:
        'テストでプロジェクト自身のモジュールを差し替えることを禁止する',
    },
    messages: {
      internalMock:
        'プロジェクト自身のモジュール「{{module}}」を差し替えています。外部との境界以外は差し替えず，依存をコンストラクタや引数で渡してテストしてください（境界は eslint-rules/config.js の MOCKABLE_BOUNDARIES に登録する）',
      unresolvedMock:
        '差し替えるモジュール「{{module}}」が見つかりません。パスが誤っているとモックが効かず，実物が使われます',
      dynamicMock:
        '差し替えるモジュールは文字列（または import(文字列)）で指定してください（差し替えてよい境界かを検査できないため）',
    },
    schema: [
      {
        type: 'object',
        properties: {
          boundaries: { type: 'array', items: { type: 'string' } },
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [
    /** @type {{ boundaries: string[] }} */ ({ boundaries: [] }),
  ],
  create(context, [{ boundaries }]) {
    const services = ESLintUtils.getParserServices(context);
    const program = services.program;
    const checker = program.getTypeChecker();
    const root = projectRoot(context);
    const file = projectFilename(context).replace(/\.(ts|js|vue)$/, '');
    const boundaryModules = boundaries.map((b) =>
      b.replace(/\.(ts|js|vue)$/, '')
    );

    /**
     * 宣言元のファイルが，差し替えてはいけないプロジェクト内のモジュールであれば，そのパスを返す
     *
     * @param {string | undefined} fileName 宣言元のファイルの絶対パス
     * @returns {string | undefined} 差し替えてはいけないモジュールのパス
     */
    function internalModule(fileName) {
      if (fileName === undefined) return undefined;
      if (fileName.replaceAll('\\', '/').includes('/node_modules/')) {
        return undefined;
      }
      const module = toModulePath(fileName, root);
      // テストのファイルの中で宣言したもの（テスト用の偽物など）は対象外
      if (module === file) return undefined;
      return boundaryModules.includes(module) ? undefined : module;
    }

    /** @param {import('@typescript-eslint/utils').TSESTree.CallExpression} node vi.mock の呼び出し */
    function checkMock(node) {
      const first = node.arguments[0];
      if (first === undefined) return;
      const specifier = moduleSpecifier(first);
      if (specifier === undefined) {
        context.report({ node, messageId: 'dynamicMock' });
        return;
      }
      // 相対パスの起点は，TypeScript が扱うファイルの絶対パスとする（ESLint のファイル名は形式が環境で異なる）
      const containingFile = services.esTreeNodeToTSNodeMap
        .get(node)
        .getSourceFile().fileName;
      const resolved = ts.resolveModuleName(
        specifier,
        containingFile,
        program.getCompilerOptions(),
        ts.sys
      ).resolvedModule;
      if (resolved === undefined) {
        // 型定義の無い外部パッケージは解決できないため，相対パス・プロジェクト内のパスのみを報告する
        if (specifier.startsWith('.') || specifier.startsWith('/')) {
          context.report({
            node,
            messageId: 'unresolvedMock',
            data: { module: specifier },
          });
        }
        return;
      }
      if (resolved.isExternalLibraryImport) return;
      const module = internalModule(resolved.resolvedFileName);
      if (module !== undefined) {
        context.report({ node, messageId: 'internalMock', data: { module } });
      }
    }

    /** @param {import('@typescript-eslint/utils').TSESTree.CallExpression} node vi.spyOn の呼び出し */
    function checkSpyOn(node) {
      const first = node.arguments[0];
      if (first === undefined) return;
      const tsNode = services.esTreeNodeToTSNodeMap.get(first);
      // 対象の値の宣言元
      const symbol = resolveSymbol(checker, tsNode);
      const declared = symbol?.declarations?.[0]?.getSourceFile().fileName;
      // 対象がクラスのインスタンス・prototype の場合は，クラスの宣言元
      // （テストのファイルで作ったインスタンスでも，差し替えるのはクラスの実装のため）
      const typeSymbol = checker.getTypeAtLocation(tsNode).getSymbol();
      const classDeclared =
        typeSymbol !== undefined && typeSymbol.flags & ts.SymbolFlags.Class
          ? typeSymbol.declarations?.[0]?.getSourceFile().fileName
          : undefined;
      const module = internalModule(declared) ?? internalModule(classDeclared);
      if (module !== undefined) {
        context.report({ node, messageId: 'internalMock', data: { module } });
      }
    }

    return {
      CallExpression(node) {
        const callee = node.callee;
        if (
          callee.type !== AST_NODE_TYPES.MemberExpression ||
          callee.object.type !== AST_NODE_TYPES.Identifier ||
          callee.object.name !== 'vi' ||
          callee.property.type !== AST_NODE_TYPES.Identifier
        ) {
          return;
        }
        switch (callee.property.name) {
          case 'mock':
          case 'doMock':
            checkMock(node);
            return;
          case 'spyOn':
            checkSpyOn(node);
            return;
          default:
            return;
        }
      },
    };
  },
});
