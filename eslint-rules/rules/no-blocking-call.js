// @ts-check
import { AST_NODE_TYPES, ESLintUtils } from '@typescript-eslint/utils';
import ts from 'typescript';
import { createRule } from '../utils/createRule.js';
import { resolveSymbol } from '../utils/types.js';

/**
 * 処理が終わるまでメインプロセスを止める（ブロッキングする）API の呼び出しを禁止する
 *
 * 判定は呼び出し側の関数名ではなく，型チェッカーで解決した呼び出し先の宣言元で行う。
 * 宣言元が設定（`blockingModules`）に載っているモジュールの型定義であり，
 * そのモジュールが同期版の API として定めている名前（Node.js・Electron は末尾が `Sync`）を持つ場合に報告する。
 *
 * - 自作の関数の中でブロッキングする API を呼んでいれば，その呼び出し箇所で報告されるため，
 *   自作の関数の名前に関係なく（`xxxAsync` と名付けても）検出できる
 * - 呼び出し先は，呼び出しの式のシンボルに加えて解決したシグネチャの宣言でも判定するため，
 *   分割代入・別名・`fs['readFileSync']`・`.call` / `.apply` を通した呼び出しも検出できる
 * - 例外として許可する範囲は `eslint-rules/config.js` に登録し，`utils/exceptions.js` の仕組みで適用する
 */

/**
 * @typedef {object} BlockingModule
 * @property {string} name 報告に使うモジュール名
 * @property {RegExp} declarationFile 型定義ファイルのパスに一致する正規表現
 * @property {RegExp} blockingName そのモジュールでブロッキングする API の名前に一致する正規表現
 */

export default createRule({
  name: 'no-blocking-call',
  meta: {
    type: 'problem',
    docs: {
      description: 'メインプロセスを止める同期 API の呼び出しを禁止する',
    },
    messages: {
      blocking:
        '{{module}} の同期 API「{{name}}」はメインプロセスを止めます。非同期版の API（util の Path などの async メソッド）を使ってください',
    },
    schema: [
      {
        type: 'object',
        properties: {
          blockingModules: { type: 'array' },
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [
    /** @type {{ blockingModules: BlockingModule[] }} */ ({
      blockingModules: [],
    }),
  ],
  create(context, [{ blockingModules }]) {
    const services = ESLintUtils.getParserServices(context);
    const checker = services.program.getTypeChecker();

    /**
     * 宣言（とその名前）がブロッキングする API であれば，そのモジュールの設定を返す
     *
     * @param {ts.Declaration[]} declarations 宣言の一覧
     * @param {string} name API の名前
     * @returns {BlockingModule | undefined} 一致したモジュールの設定
     */
    function findBlockingModule(declarations, name) {
      for (const declaration of declarations) {
        const fileName = declaration.getSourceFile().fileName;
        const module = blockingModules.find(
          (m) => m.declarationFile.test(fileName) && m.blockingName.test(name)
        );
        if (module !== undefined) return module;
      }
      return undefined;
    }

    /**
     * 式が指す関数のシンボルで判定する（`a.b.c` は `c`，`a['c']` は `'c'`）
     *
     * @param {ts.Node} expr 関数を指す式
     * @returns {{ module: BlockingModule; name: string } | undefined} 判定の結果
     */
    function bySymbol(expr) {
      const target = ts.isPropertyAccessExpression(expr)
        ? expr.name
        : ts.isElementAccessExpression(expr)
          ? expr.argumentExpression
          : expr;
      const symbol = resolveSymbol(checker, target);
      if (symbol === undefined) return undefined;
      const module = findBlockingModule(
        symbol.declarations ?? [],
        symbol.getName()
      );
      if (module !== undefined) return { module, name: symbol.getName() };
      return byAliasSource(symbol);
    }

    /**
     * 別名の変数であれば，その元の API で判定する
     *
     * - `const st = fs.statSync`：初期化子の式で判定する
     * - `const { statSync } = fs`：分割代入の元のオブジェクトのプロパティで判定する
     * （関数の型を持つ定数として宣言された API は，シグネチャの宣言に名前が無いため，元の宣言まで辿る）
     *
     * @param {ts.Symbol} symbol 変数のシンボル
     * @returns {{ module: BlockingModule; name: string } | undefined} 判定の結果
     */
    function byAliasSource(symbol) {
      const declaration = symbol.valueDeclaration;
      if (declaration === undefined) return undefined;
      if (
        ts.isVariableDeclaration(declaration) &&
        ts.isIdentifier(declaration.name) &&
        declaration.initializer !== undefined &&
        // 自身を初期化子に持つ変数で無限に辿らないよう，式（関数を指すもの）のみを辿る
        (ts.isPropertyAccessExpression(declaration.initializer) ||
          ts.isElementAccessExpression(declaration.initializer))
      ) {
        return bySymbol(declaration.initializer);
      }
      if (
        ts.isBindingElement(declaration) &&
        ts.isObjectBindingPattern(declaration.parent) &&
        ts.isVariableDeclaration(declaration.parent.parent) &&
        declaration.parent.parent.initializer !== undefined
      ) {
        const key = declaration.propertyName ?? declaration.name;
        if (!ts.isIdentifier(key)) return undefined;
        const property = checker
          .getTypeAtLocation(declaration.parent.parent.initializer)
          .getProperty(key.text);
        if (property === undefined) return undefined;
        const module = findBlockingModule(
          property.declarations ?? [],
          key.text
        );
        return module && { module, name: key.text };
      }
      return undefined;
    }

    /**
     * 呼び出しが解決したシグネチャの宣言で判定する（別名・分割代入を通した呼び出しも，宣言は元の API になる）
     *
     * @param {ts.CallExpression} call 呼び出し
     * @returns {{ module: BlockingModule; name: string } | undefined} 判定の結果
     */
    function bySignature(call) {
      const declaration = checker.getResolvedSignature(call)?.declaration;
      if (
        declaration === undefined ||
        ts.isJSDocSignature(declaration) ||
        declaration.name === undefined ||
        !ts.isIdentifier(declaration.name)
      ) {
        return undefined;
      }
      const name = declaration.name.text;
      const module = findBlockingModule([declaration], name);
      return module && { module, name };
    }

    return {
      CallExpression(node) {
        const call = /** @type {ts.CallExpression} */ (
          services.esTreeNodeToTSNodeMap.get(node)
        );
        let found = bySymbol(call.expression) ?? bySignature(call);
        // `fs.readFileSync.call(fs, ...)`・`.apply(...)` は，呼び出される関数で判定する
        if (
          found === undefined &&
          node.callee.type === AST_NODE_TYPES.MemberExpression &&
          node.callee.property.type === AST_NODE_TYPES.Identifier &&
          ['call', 'apply'].includes(node.callee.property.name) &&
          ts.isPropertyAccessExpression(call.expression)
        ) {
          found = bySymbol(call.expression.expression);
        }
        if (found === undefined) return;
        context.report({
          node,
          messageId: 'blocking',
          data: { module: found.module.name, name: found.name },
        });
      },
    };
  },
});
