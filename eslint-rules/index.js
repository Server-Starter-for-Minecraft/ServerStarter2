// @ts-check
import noBlockingCall from './rules/no-blocking-call.js';
import noException from './rules/no-exception.js';
import noFailableCast from './rules/no-failable-cast.js';
import noIgnoredFailable from './rules/no-ignored-failable.js';
import noInternalMock from './rules/no-internal-mock.js';
import noSilentError from './rules/no-silent-error.js';
import noUnsafeThrowingCall from './rules/no-unsafe-throwing-call.js';
import requireAsyncIpcHandler from './rules/require-async-ipc-handler.js';

/**
 * ServerStarter2 の独自 ESLint ルール（プラグイン `serverstarter`）
 *
 * テストだけでは防げない規約違反（エラーハンドリング・非同期処理・層構造など）を静的解析で検出する。
 * ルールの対象や例外などの設定値は `config.js` に集約し，`eslint.config.js` から参照する
 */

/** @type {Record<string, import('@typescript-eslint/utils').TSESLint.RuleModule<string, unknown[]>>} */
const rules = {
  'no-blocking-call': noBlockingCall,
  'no-exception': noException,
  'no-failable-cast': noFailableCast,
  'no-ignored-failable': noIgnoredFailable,
  'no-internal-mock': noInternalMock,
  'no-silent-error': noSilentError,
  'no-unsafe-throwing-call': noUnsafeThrowingCall,
  'require-async-ipc-handler': requireAsyncIpcHandler,
};

export default {
  meta: { name: 'serverstarter' },
  rules,
};
