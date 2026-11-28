// @ts-check
import { AST_NODE_TYPES, ESLintUtils } from '@typescript-eslint/utils';
import ts from 'typescript';
import { createRule } from '../utils/createRule.js';
import { reportOutsideInSourceTest } from '../utils/scope.js';
import { resolveSymbol, returnsThenable } from '../utils/types.js';

/**
 * 例外を投げる API の呼び出しを，Failable へ変換する関数（`safeExec` など）の外で行うことを禁止する
 *
 * `JSON.parse` や zod の `parse` などは，入力が不正な場合に例外を投げる。
 * これらを変換せずに呼ぶと，例外がそのまま呼び出し元へ伝わり，アプリが止まる・失敗に気付けない原因となる。
 *
 * 判定は呼び出し側の名前ではなく，型チェッカーで解決した呼び出し先の宣言（名前・所属する型・宣言元のファイル）で行う。
 * 対象の API は設定（`throwingApis`）で指定する。
 * - 別名・分割代入・`JSON['parse']` を通した呼び出しも，解決したシグネチャの宣言で判定する
 * - 呼び出さずに関数として渡す・変数に入れる（`map(JSON.parse)` など）ことも，変換されずに呼ばれるため報告する
 * - `safeExec` などに直接渡した関数の中での呼び出しは，例外が Failable に変換されるため許可する
 *   （その中でさらに作った関数（コールバックなど）は，後で try の外で呼ばれうるため許可しない）
 * - 同期の変換用の関数（`safeExec`）に非同期の関数を渡すと，reject は変換されないため報告する
 */

/**
 * @typedef {object} ThrowingApi
 * @property {string} name API の名前
 * @property {'call' | 'new'} kind 関数として呼ぶか，new で呼ぶか
 * @property {string} [owner] 所属する型・名前空間の名前（`JSON.parse` の `JSON` など）
 * @property {RegExp} declarationFile 宣言元のファイルのパスに一致する正規表現
 * @property {string} alternative 代わりに使う方法（メッセージに表示する）
 */

/**
 * @typedef {object} ExceptionConverter
 * @property {string} name 関数の名前
 * @property {RegExp} declarationFile 宣言元のファイルのパスに一致する正規表現
 * @property {boolean} async 非同期の関数（Promise の reject）を Failable に変換できるか
 */

/** @typedef {import('@typescript-eslint/utils').TSESTree.Node} Node */

export default createRule({
  name: 'no-unsafe-throwing-call',
  meta: {
    type: 'problem',
    docs: {
      description:
        '例外を投げる API を，Failable へ変換する関数の外で呼ぶことを禁止する',
    },
    messages: {
      throwing: '「{{name}}」は例外を投げます。{{alternative}}',
      asyncInSyncConverter:
        '「{{name}}」は同期の処理の例外のみを変換します。非同期の関数は safeExecAsync に渡してください（reject は変換されません）',
    },
    schema: [
      {
        type: 'object',
        properties: {
          throwingApis: { type: 'array' },
          converters: { type: 'array' },
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [
    /** @type {{ throwingApis: ThrowingApi[]; converters: ExceptionConverter[] }} */ ({
      throwingApis: [],
      converters: [],
    }),
  ],
  create(context, [{ throwingApis, converters }]) {
    const report = reportOutsideInSourceTest(context);
    const services = ESLintUtils.getParserServices(context);
    const checker = services.program.getTypeChecker();

    /**
     * シンボルの宣言が対象の API に一致すれば，その設定を返す
     *
     * @param {ts.Symbol | undefined} symbol 判定するシンボル
     * @param {'call' | 'new'} kind 呼び出し方
     * @returns {ThrowingApi | undefined} 一致した API の設定
     */
    function matchThrowingApi(symbol, kind) {
      if (symbol === undefined) return undefined;
      return throwingApis.find((api) => {
        if (api.kind !== kind || api.name !== symbol.getName()) return false;
        return (symbol.declarations ?? []).some((decl) => {
          if (!api.declarationFile.test(decl.getSourceFile().fileName)) {
            return false;
          }
          if (api.owner === undefined) return true;
          const owner = decl.parent;
          return (
            owner !== undefined &&
            'name' in owner &&
            owner.name !== undefined &&
            /** @type {ts.Identifier} */ (owner.name).text === api.owner
          );
        });
      });
    }

    /**
     * 式が指す値（関数）のシンボルを返す（`a.b` は `b`，`a['b']` は `'b'` のシンボル）
     *
     * @param {Node} node 式
     * @returns {ts.Symbol | undefined} シンボル
     */
    function referencedSymbol(node) {
      const tsNode = services.esTreeNodeToTSNodeMap.get(node);
      const target = ts.isPropertyAccessExpression(tsNode)
        ? tsNode.name
        : ts.isElementAccessExpression(tsNode)
          ? tsNode.argumentExpression
          : tsNode;
      return resolveSymbol(checker, target);
    }

    /**
     * 呼び出し先が対象の API であれば，その設定を返す
     *
     * 呼び出し先の式のシンボルで判定し，一致しない場合は解決したシグネチャの宣言で判定する
     * （`const { parse } = JSON; parse()` のような別名を通した呼び出しも検出する）
     *
     * @param {import('@typescript-eslint/utils').TSESTree.CallExpression | import('@typescript-eslint/utils').TSESTree.NewExpression} node 呼び出し
     * @param {'call' | 'new'} kind 呼び出し方
     * @returns {ThrowingApi | undefined} 一致した API の設定
     */
    function findThrowingApi(node, kind) {
      const bySymbol = matchThrowingApi(referencedSymbol(node.callee), kind);
      if (bySymbol !== undefined || kind === 'new') return bySymbol;
      // `JSON.parse.call(JSON, ...)`・`.apply(...)` は，呼び出される関数で判定する
      if (
        node.callee.type === AST_NODE_TYPES.MemberExpression &&
        node.callee.property.type === AST_NODE_TYPES.Identifier &&
        ['call', 'apply'].includes(node.callee.property.name)
      ) {
        const byCall = matchThrowingApi(
          referencedSymbol(node.callee.object),
          'call'
        );
        if (byCall !== undefined) return byCall;
      }
      const tsNode = services.esTreeNodeToTSNodeMap.get(node);
      const declaration = checker.getResolvedSignature(tsNode)?.declaration;
      if (
        declaration === undefined ||
        ts.isJSDocSignature(declaration) ||
        declaration.name === undefined
      ) {
        return undefined;
      }
      return matchThrowingApi(
        checker.getSymbolAtLocation(declaration.name),
        kind
      );
    }

    /**
     * 呼び出し先が変換用の関数（safeExec など）であれば，その設定を返す（宣言元で判定する）
     *
     * @param {Node} callee 呼び出し先の式
     * @returns {ExceptionConverter | undefined} 一致した変換用の関数の設定
     */
    function findConverter(callee) {
      const symbol = referencedSymbol(callee);
      if (symbol === undefined) return undefined;
      return converters.find(
        (converter) =>
          converter.name === symbol.getName() &&
          (symbol.declarations ?? []).some((decl) =>
            converter.declarationFile.test(decl.getSourceFile().fileName)
          )
      );
    }

    /**
     * 変換用の関数（safeExec など）に直接渡した関数の中にあるか
     *
     * 最も内側の関数だけを判定する（その関数の中で作った関数は，try の外で後から呼ばれうるため対象外）
     *
     * @param {Node} node 判定するノード
     */
    function isInsideConverter(node) {
      for (
        let current = node.parent;
        current != null;
        current = current.parent
      ) {
        if (
          current.type === AST_NODE_TYPES.ArrowFunctionExpression ||
          current.type === AST_NODE_TYPES.FunctionExpression ||
          current.type === AST_NODE_TYPES.FunctionDeclaration
        ) {
          const parent = current.parent;
          return (
            parent?.type === AST_NODE_TYPES.CallExpression &&
            parent.arguments.includes(current) &&
            findConverter(parent.callee) !== undefined
          );
        }
      }
      return false;
    }

    /**
     * 対象の API を変換せずに使っている場合に報告する
     *
     * @param {Node} node 報告するノード
     * @param {ThrowingApi | undefined} api 一致した API の設定
     */
    function reportUnsafe(node, api) {
      if (api === undefined) return;
      if (isInsideConverter(node)) return;
      report({
        node,
        messageId: 'throwing',
        data: {
          name: api.owner ? `${api.owner}.${api.name}` : api.name,
          alternative: api.alternative,
        },
      });
    }

    /**
     * 呼び出さずに関数として参照している（引数に渡す・変数に入れる）場合に検査する
     *
     * @param {Node} node 関数を指す式
     */
    function checkReference(node) {
      const parent = node.parent;
      // 呼び出し・new の対象と，.call / .apply の対象は，呼び出しの検査で扱う
      if (
        (parent?.type === AST_NODE_TYPES.CallExpression ||
          parent?.type === AST_NODE_TYPES.NewExpression) &&
        parent.callee === node
      ) {
        return;
      }
      if (
        parent?.type === AST_NODE_TYPES.MemberExpression &&
        parent.object === node
      ) {
        return;
      }
      const isPassedAsValue =
        (parent?.type === AST_NODE_TYPES.CallExpression &&
          parent.arguments.includes(/** @type {never} */ (node))) ||
        (parent?.type === AST_NODE_TYPES.VariableDeclarator &&
          parent.init === node) ||
        (parent?.type === AST_NODE_TYPES.AssignmentExpression &&
          parent.right === node) ||
        // オブジェクトのプロパティの値・配列の要素・関数の戻り値として渡す
        (parent?.type === AST_NODE_TYPES.Property && parent.value === node) ||
        parent?.type === AST_NODE_TYPES.ArrayExpression ||
        (parent?.type === AST_NODE_TYPES.ReturnStatement &&
          parent.argument === node) ||
        (parent?.type === AST_NODE_TYPES.ArrowFunctionExpression &&
          parent.body === node);
      if (!isPassedAsValue) return;
      reportUnsafe(node, matchThrowingApi(referencedSymbol(node), 'call'));
    }

    /**
     * 同期の変換用の関数に，非同期の関数を渡していないかを検査する
     *
     * @param {import('@typescript-eslint/utils').TSESTree.CallExpression} node 呼び出し
     */
    function checkConverterArgument(node) {
      const converter = findConverter(node.callee);
      if (converter === undefined || converter.async) return;
      for (const arg of node.arguments) {
        if (
          arg.type !== AST_NODE_TYPES.ArrowFunctionExpression &&
          arg.type !== AST_NODE_TYPES.FunctionExpression &&
          arg.type !== AST_NODE_TYPES.Identifier &&
          arg.type !== AST_NODE_TYPES.MemberExpression
        ) {
          continue;
        }
        const isAsync =
          ('async' in arg && arg.async) ||
          returnsThenable(checker, services.getTypeAtLocation(arg)) === true;
        if (isAsync) {
          report({
            node: arg,
            messageId: 'asyncInSyncConverter',
            data: { name: converter.name },
          });
        }
      }
    }

    return {
      CallExpression(node) {
        reportUnsafe(node, findThrowingApi(node, 'call'));
        checkConverterArgument(node);
      },
      NewExpression(node) {
        reportUnsafe(node, findThrowingApi(node, 'new'));
      },
      MemberExpression: checkReference,
      Identifier: checkReference,
    };
  },
});
