// @ts-check
import { AST_NODE_TYPES, ESLintUtils } from '@typescript-eslint/utils';
import path from 'node:path';
import { createRule } from '../utils/createRule.js';
import { relativeFilename } from '../utils/scope.js';
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
 * - `vi.mock(path)`・`vi.doMock(path)`：path が相対パス・プロジェクト内のエイリアス（`app/`・`src-electron/`・`src/`）
 * - `vi.spyOn(target, ...)`：target の宣言元がプロジェクト内のファイル（node_modules 以外）
 */

/** プロジェクト内のモジュールを指すエイリアス（リポジトリのルートからのパスに置き換える） */
const ALIASES = [
  ['app/', ''],
  ['src-electron/', 'src-electron/'],
  ['src/', 'src/'],
];

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
    const services = ESLintUtils.getParserServices(context, true);
    const checker = services.program?.getTypeChecker();
    const file = relativeFilename(context.filename, context.cwd);
    const cwd = context.cwd.replaceAll('\\', '/');

    /**
     * モジュールの指定（import のパス）を，リポジトリのルートからの拡張子なしのパスにする
     *
     * @param {string} specifier モジュールの指定
     * @returns {string | undefined} プロジェクト内のモジュールであればそのパス
     */
    function toProjectModule(specifier) {
      if (specifier.startsWith('.')) {
        return path.posix
          .normalize(path.posix.join(path.posix.dirname(file), specifier))
          .replace(/\.(ts|js|vue)$/, '');
      }
      const alias = ALIASES.find(([prefix]) => specifier.startsWith(prefix));
      if (alias === undefined) return undefined;
      return (alias[1] + specifier.slice(alias[0].length)).replace(
        /\.(ts|js|vue)$/,
        ''
      );
    }

    /** @param {string} module リポジトリのルートからのパス */
    const isBoundary = (module) =>
      boundaries.some((b) => b.replace(/\.(ts|js|vue)$/, '') === module);

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
        const method = callee.property.name;
        const first = node.arguments[0];
        if (first === undefined) return;

        if (method === 'mock' || method === 'doMock') {
          if (
            first.type !== AST_NODE_TYPES.Literal ||
            typeof first.value !== 'string'
          ) {
            return;
          }
          const module = toProjectModule(first.value);
          if (module !== undefined && !isBoundary(module)) {
            context.report({
              node,
              messageId: 'internalMock',
              data: { module },
            });
          }
          return;
        }

        if (method === 'spyOn' && checker !== undefined) {
          const symbol = resolveSymbol(
            checker,
            services.esTreeNodeToTSNodeMap.get(first)
          );
          const declFile = symbol?.declarations?.[0]?.getSourceFile().fileName;
          if (declFile === undefined || declFile.includes('/node_modules/'))
            return;
          const module = (
            declFile.startsWith(`${cwd}/`)
              ? declFile.slice(cwd.length + 1)
              : declFile
          ).replace(/\.(d\.ts|ts|js|vue)$/, '');
          // テストのファイルの中で宣言したもの（テスト用の偽物など）は対象外
          if (module === file.replace(/\.(ts|js|vue)$/, '')) return;
          if (!isBoundary(module)) {
            context.report({
              node,
              messageId: 'internalMock',
              data: { module },
            });
          }
        }
      },
    };
  },
});
