// @ts-check
import { AST_NODE_TYPES } from '@typescript-eslint/utils';

/**
 * 独自ルールで使う，構文木の位置に関する処理
 */

/** @typedef {import('@typescript-eslint/utils').TSESTree.Node} Node */

/**
 * ノードを囲む関数・メソッドの名前を，内側から順に返す
 *
 * 名前は関数宣言の名前・関数を代入した変数名・メソッド名・関数を値に持つプロパティ名とする
 *
 * @param {Node} node 起点のノード
 * @returns {string[]} 囲む関数の名前（内側から順）
 */
export function enclosingFunctionNames(node) {
  /** @type {string[]} */
  const names = [];
  for (let current = node.parent; current != null; current = current.parent) {
    switch (current.type) {
      case AST_NODE_TYPES.FunctionDeclaration:
        if (current.id) names.push(current.id.name);
        break;
      case AST_NODE_TYPES.FunctionExpression:
      case AST_NODE_TYPES.ArrowFunctionExpression: {
        const parent = current.parent;
        if (
          parent?.type === AST_NODE_TYPES.VariableDeclarator &&
          parent.id.type === AST_NODE_TYPES.Identifier
        ) {
          names.push(parent.id.name);
        } else if (
          (parent?.type === AST_NODE_TYPES.MethodDefinition ||
            parent?.type === AST_NODE_TYPES.PropertyDefinition ||
            parent?.type === AST_NODE_TYPES.Property) &&
          parent.key.type === AST_NODE_TYPES.Identifier
        ) {
          names.push(parent.key.name);
        }
        break;
      }
      default:
        break;
    }
  }
  return names;
}

/**
 * リポジトリのルートからのパスに変換したファイル名を返す（区切り文字は `/`）
 *
 * @param {string} filename ESLint が渡すファイルの絶対パス
 * @param {string} cwd ESLint の実行ディレクトリ
 * @returns {string} リポジトリのルートからのパス
 */
export function relativeFilename(filename, cwd) {
  // 区切り文字とドライブ文字の大小（エディタは `e:\\` のように小文字で渡す場合がある）をそろえて比べる
  /** @param {string} p パス */
  const normalize = (p) =>
    p.replaceAll('\\', '/').replace(/^[a-z]:/, (drive) => drive.toUpperCase());
  const normalized = normalize(filename);
  const root = `${normalize(cwd).replace(/\/$/, '')}/`;
  return normalized.startsWith(root)
    ? normalized.slice(root.length)
    : normalized;
}

/**
 * プロジェクトのルート（型情報の tsconfig.json のあるディレクトリ）を返す（区切り文字は `/`）
 *
 * ESLint の実行ディレクトリ（cwd）はサブディレクトリからの実行やエディタの拡張機能で変わるため，
 * 読み込んだ tsconfig.json の位置をルートとする（型情報が無い場合のみ cwd を使う）
 *
 * @param {import('@typescript-eslint/utils').TSESLint.RuleContext<string, unknown[]>} context ルールのコンテキスト
 * @returns {string} プロジェクトのルートの絶対パス
 */
export function projectRoot(context) {
  const program = context.sourceCode.parserServices?.program;
  const configFile = program?.getCompilerOptions().configFilePath;
  if (typeof configFile !== 'string') return context.cwd.replaceAll('\\', '/');
  const normalized = configFile.replaceAll('\\', '/');
  return normalized.slice(0, normalized.lastIndexOf('/'));
}

/**
 * プロジェクトのルートからの，検査しているファイルのパスを返す（区切り文字は `/`）
 *
 * @param {import('@typescript-eslint/utils').TSESLint.RuleContext<string, unknown[]>} context ルールのコンテキスト
 * @returns {string} プロジェクトのルートからのパス
 */
export function projectFilename(context) {
  return relativeFilename(context.filename, projectRoot(context));
}

/**
 * ノードが in-source テスト（`if (import.meta.vitest) { ... }` の中）にあるか
 *
 * in-source テストは実装ファイルの中に書かれるが，テストのコードとして扱う
 * （ファイル名でテストのファイルと区別できないため，構文で判定する）
 *
 * @param {Node} node 判定するノード
 * @returns {boolean} in-source テストの中にあれば true
 */
export function isInSourceTest(node) {
  for (let current = node.parent; current != null; current = current.parent) {
    if (
      current.type === AST_NODE_TYPES.IfStatement &&
      current.test.type === AST_NODE_TYPES.MemberExpression &&
      current.test.object.type === AST_NODE_TYPES.MetaProperty &&
      current.test.property.type === AST_NODE_TYPES.Identifier &&
      current.test.property.name === 'vitest'
    ) {
      return true;
    }
  }
  return false;
}

/**
 * in-source テストの中を報告しない report 関数を作る
 *
 * 実装ファイルの中の in-source テストは，テストのファイルと同じく，本番のコード向けのルールの対象外とする
 *
 * @template {import('@typescript-eslint/utils').TSESLint.RuleContext<string, unknown[]>} C
 * @param {C} context ルールのコンテキスト
 * @returns {C['report']} in-source テストの中を除いて報告する関数
 */
export function reportOutsideInSourceTest(context) {
  return (descriptor) => {
    if ('node' in descriptor && isInSourceTest(descriptor.node)) return;
    context.report(descriptor);
  };
}
