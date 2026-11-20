// @ts-check
import { AST_NODE_TYPES, ESLintUtils } from '@typescript-eslint/utils';
import { createRule } from '../utils/createRule.js';
import { returnsThenable } from '../utils/types.js';

/**
 * バックエンドが公開する関数を非同期（Promise を返す）にすることを必須とする
 *
 * バックエンドの処理がメインプロセスを止めると，フロントエンドの操作まで止まってしまう。
 * そのため，バックエンドが export する関数・クラスの public メソッドは，原則としてすべて Promise を返す形にする。
 *
 * 判定は `async` キーワードの有無ではなく，型チェッカーで求めた戻り値の型（Promise のように `then` を持つか）で行う。
 * 関数でない値（zod のスキーマ・定数など）や型の export は対象外とする。
 *
 * 構造上どうしても同期にする必要があるもの（コンストラクタの中で使うファクトリなど）は，
 * 設定（`allowed`）にファイルと名前を指定して個別に除外する（ファイル全体を除外しないため）
 */

/**
 * @typedef {object} AllowedExport
 * @property {string} file 対象のファイル（リポジトリのルートからのパス）
 * @property {string} name 同期のままとする関数・メソッドの名前
 * @property {string} reason 同期のままとする理由
 */

/** @typedef {import('@typescript-eslint/utils').TSESTree.Node} Node */

export default createRule({
  name: 'require-async-export',
  meta: {
    type: 'problem',
    docs: {
      description:
        'バックエンドが公開する関数・メソッドは Promise を返す（非同期にする）',
    },
    messages: {
      notAsync:
        '公開する関数「{{name}}」は Promise を返してください（async にする）。バックエンドの同期処理はフロントエンドの操作を止めます',
    },
    schema: [
      {
        type: 'object',
        properties: {
          allowed: { type: 'array' },
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [
    /** @type {{ allowed: AllowedExport[] }} */ ({ allowed: [] }),
  ],
  create(context, [{ allowed }]) {
    const services = ESLintUtils.getParserServices(context);
    const checker = services.program.getTypeChecker();
    const fileName = context.filename.replaceAll('\\', '/');
    const allowedNames = new Set(
      allowed.filter((a) => fileName.endsWith(a.file)).map((a) => a.name)
    );

    /**
     * 関数の値を持つノードが Promise を返さない場合に報告する
     *
     * @param {Node} node 型を調べるノード（関数・変数・プロパティ）
     * @param {Node} reportNode 報告する位置
     * @param {string} name 報告に使う名前
     */
    function check(node, reportNode, name) {
      if (allowedNames.has(name)) return;
      const type = services.getTypeAtLocation(node);
      if (returnsThenable(checker, type) === false) {
        context.report({
          node: reportNode,
          messageId: 'notAsync',
          data: { name },
        });
      }
    }

    /**
     * クラスの public なメンバー（メソッド・関数を値に持つプロパティ）を検査する
     *
     * @param {import('@typescript-eslint/utils').TSESTree.ClassDeclaration | import('@typescript-eslint/utils').TSESTree.ClassExpression} cls クラス
     */
    function checkClass(cls) {
      for (const member of cls.body.body) {
        if (
          member.type !== AST_NODE_TYPES.MethodDefinition &&
          member.type !== AST_NODE_TYPES.PropertyDefinition
        ) {
          continue;
        }
        // private・protected・#private のメンバーはクラスの外から呼ばれないため対象外
        if (
          member.accessibility === 'private' ||
          member.accessibility === 'protected' ||
          member.key.type === AST_NODE_TYPES.PrivateIdentifier
        ) {
          continue;
        }
        const name =
          member.key.type === AST_NODE_TYPES.Identifier
            ? member.key.name
            : '(computed)';
        if (member.type === AST_NODE_TYPES.MethodDefinition) {
          // コンストラクタ・getter・setter は async にできないため対象外
          if (member.kind !== 'method') continue;
          check(member.value, member.key, name);
        } else if (member.value !== null) {
          check(member.value, member.key, name);
        }
      }
    }

    /**
     * export される宣言を検査する
     *
     * @param {Node} decl 宣言
     */
    function checkDeclaration(decl) {
      switch (decl.type) {
        case AST_NODE_TYPES.FunctionDeclaration:
          check(decl, decl.id ?? decl, decl.id?.name ?? 'default');
          break;
        case AST_NODE_TYPES.VariableDeclaration:
          for (const declarator of decl.declarations) {
            if (declarator.init === null) continue;
            const name =
              declarator.id.type === AST_NODE_TYPES.Identifier
                ? declarator.id.name
                : '(destructured)';
            check(declarator.id, declarator.id, name);
          }
          break;
        case AST_NODE_TYPES.ClassDeclaration:
        case AST_NODE_TYPES.ClassExpression:
          checkClass(decl);
          break;
        case AST_NODE_TYPES.ArrowFunctionExpression:
        case AST_NODE_TYPES.FunctionExpression:
          check(decl, decl, 'default');
          break;
        default:
          break;
      }
    }

    return {
      ExportNamedDeclaration(node) {
        if (node.exportKind === 'type') return;
        if (node.declaration !== null) {
          checkDeclaration(node.declaration);
          return;
        }
        // `export { f }` の形で後から export する場合（他のファイルからの再 export は，そのファイル側で検査する）
        if (node.source !== null) return;
        for (const specifier of node.specifiers) {
          if (specifier.exportKind === 'type') continue;
          const local = specifier.local;
          if (local.type !== AST_NODE_TYPES.Identifier) continue;
          check(local, specifier, local.name);
        }
      },
      ExportDefaultDeclaration(node) {
        checkDeclaration(node.declaration);
      },
    };
  },
});
