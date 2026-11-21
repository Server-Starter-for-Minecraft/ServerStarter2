// @ts-check
import { AST_NODE_TYPES, ESLintUtils } from '@typescript-eslint/utils';
import { createRule } from '../utils/createRule.js';
import {
  isInAllowedFunction,
  projectFilename,
  reportOutsideInSourceTest,
} from '../utils/scope.js';
import { isPromiseConstructor, mayBeThenable } from '../utils/types.js';

/**
 * 例外によるエラーハンドリングを禁止する
 *
 * ServerStarter2 では，失敗は Result 型（Failable / WithError）の戻り値で扱う。
 * 例外を投げる・捕まえる処理は，外部ライブラリや OS・Electron の API を呼ぶ最下層で
 * Result 型へ変換する関数（`safeExec` など）の中だけに限る。
 * private な関数の中であっても例外を使うと，呼び出し側が失敗に気付かずに成功として扱えてしまうため，例外は設けない。
 *
 * 検出するもの
 * - `throw`・`try/catch`（catch の無い `try/finally` は，例外を捕まえずに後始末を保証するだけのため対象外）
 * - `Promise.reject()`・`new Promise((resolve, reject) => ...)` の reject
 * - Promise の `.catch()`・`.then(onFulfilled, onRejected)`（例外を捕まえる処理）
 *
 * Promise かどうかは型で判定する（`p?.catch()`・`p['catch']()`・`globalThis.Promise.reject()`・
 * `const P = Promise; P.reject()`・`new Promise(executor)` の形も検出する）
 *
 * 変換を行う関数は，設定（`allowed`）にファイルと関数名を指定して許可する
 */

export default createRule({
  name: 'no-exception',
  meta: {
    type: 'problem',
    docs: {
      description:
        '例外（throw・try/catch・reject）によるエラーハンドリングを禁止する',
    },
    messages: {
      throw:
        '例外を投げずに，エラーを Failable の戻り値として返してください（errorMessage で作成する）',
      tryCatch:
        'try/catch を使わずに，util の safeExec / safeExecAsync で Failable に変換してください',
      reject:
        'Promise を reject せずに，エラーを Failable の値として resolve してください',
      catch:
        'Promise の失敗を捕まえずに，util の safeExecAsync で Failable に変換してください',
    },
    schema: [
      {
        type: 'object',
        properties: { allowed: { type: 'array' } },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [
    /** @type {{ allowed: import('../utils/scope.js').AllowedFunctions[] }} */ ({
      allowed: [],
    }),
  ],
  create(context, [{ allowed }]) {
    const report = reportOutsideInSourceTest(context);
    const services = ESLintUtils.getParserServices(context, true);
    const checker = services.program?.getTypeChecker();
    const file = projectFilename(context);

    /**
     * 許可された関数の外であれば報告する
     *
     * @param {import('@typescript-eslint/utils').TSESTree.Node} node 報告するノード
     * @param {'throw' | 'tryCatch' | 'reject' | 'catch'} messageId メッセージ
     */
    function reportUnlessAllowed(node, messageId) {
      if (isInAllowedFunction(node, file, allowed)) return;
      report({ node, messageId });
    }

    /**
     * Promise のように then を持つ値か（型情報が無い場合は判定しない）
     *
     * @param {import('@typescript-eslint/utils').TSESTree.Node} node 判定するノード
     */
    function isPromiseLike(node) {
      if (checker === undefined) return false;
      return mayBeThenable(checker, services.getTypeAtLocation(node));
    }

    /**
     * 標準の Promise のコンストラクタを指す式か（型情報が無い場合は名前で判定する）
     *
     * @param {import('@typescript-eslint/utils').TSESTree.Node} node 判定するノード
     */
    function isPromiseClass(node) {
      if (checker === undefined) {
        return (
          node.type === AST_NODE_TYPES.Identifier && node.name === 'Promise'
        );
      }
      return isPromiseConstructor(services.getTypeAtLocation(node));
    }

    /**
     * メンバーの名前（`a.b` の `b`，`a['b']` の `'b'`）を返す
     *
     * @param {import('@typescript-eslint/utils').TSESTree.MemberExpression} member メンバーの参照
     * @returns {string | undefined} 名前（式で指定されている場合は undefined）
     */
    function memberName(member) {
      if (
        !member.computed &&
        member.property.type === AST_NODE_TYPES.Identifier
      ) {
        return member.property.name;
      }
      if (
        member.property.type === AST_NODE_TYPES.Literal &&
        typeof member.property.value === 'string'
      ) {
        return member.property.value;
      }
      return undefined;
    }

    return {
      ThrowStatement(node) {
        reportUnlessAllowed(node, 'throw');
      },
      TryStatement(node) {
        // catch の無い try/finally は，例外を捕まえずに後始末を保証するだけのため対象外とする
        if (node.handler === null) return;
        reportUnlessAllowed(node, 'tryCatch');
      },
      CallExpression(node) {
        if (node.callee.type !== AST_NODE_TYPES.MemberExpression) return;
        const { object } = node.callee;
        const name = memberName(node.callee);
        if (name === undefined) return;

        // Promise.reject(...)
        if (name === 'reject' && isPromiseClass(object)) {
          reportUnlessAllowed(node, 'reject');
          return;
        }
        // promise.catch(...) / promise.then(onFulfilled, onRejected)
        if (
          (name === 'catch' ||
            (name === 'then' && node.arguments.length >= 2)) &&
          isPromiseLike(object)
        ) {
          reportUnlessAllowed(node, 'catch');
        }
      },
      NewExpression(node) {
        // new Promise((resolve, reject) => ...) の reject
        if (!isPromiseClass(node.callee)) return;
        const executor = node.arguments[0];
        if (executor === undefined) return;
        if (
          executor.type === AST_NODE_TYPES.ArrowFunctionExpression ||
          executor.type === AST_NODE_TYPES.FunctionExpression
        ) {
          if (executor.params.length >= 2) {
            reportUnlessAllowed(executor.params[1], 'reject');
          }
          return;
        }
        // 変数で渡した executor も，reject を受け取る（引数が 2 つ以上の）関数であれば報告する
        if (checker === undefined) return;
        const signatures = services
          .getTypeAtLocation(executor)
          .getCallSignatures();
        if (signatures.some((sig) => sig.getParameters().length >= 2)) {
          reportUnlessAllowed(executor, 'reject');
        }
      },
    };
  },
});
