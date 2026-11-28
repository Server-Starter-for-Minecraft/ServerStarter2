// @ts-check
import { builtinRules } from 'eslint/use-at-your-own-risk';
import noBlockingCall from './rules/no-blocking-call.js';
import noException from './rules/no-exception.js';
import noFailableCast from './rules/no-failable-cast.js';
import noFailableCondition from './rules/no-failable-condition.js';
import noIgnoredFailable from './rules/no-ignored-failable.js';
import noInternalMock from './rules/no-internal-mock.js';
import noRestrictedModule from './rules/no-restricted-module.js';
import noSilentError from './rules/no-silent-error.js';
import noUnsafeThrowingCall from './rules/no-unsafe-throwing-call.js';

/**
 * ServerStarter2 の独自 ESLint ルール（プラグイン `serverstarter`）
 *
 * テストだけでは防げない規約違反（エラーハンドリング・非同期処理・層構造など）を静的解析で検出する。
 * ルールの対象や例外などの設定値は `config.js` に集約し，`eslint.config.js` から参照する
 */

/**
 * 例外（`config.js` の範囲を絞った例外）を適用するために包む標準のルール
 *
 * 例外はプラグインのルールにのみ適用できるため，標準のルールをこのプラグインのルールとして提供する
 * （`eslint.config.js` では標準のルールを使わず，こちらを使う）。
 * 標準のルールの一覧は ESLint の安定版の API ではない（`use-at-your-own-risk`）が，
 * 取得できなくなった場合はルールが見つからないエラーで lint が失敗するため，検査が黙って外れることはない
 */
const wrappedBuiltinRules = Object.fromEntries(
  ['no-restricted-syntax'].map((name) => [name, builtinRules.get(name)])
);

/** @type {Record<string, import('@typescript-eslint/utils').TSESLint.RuleModule<string, unknown[]>>} */
const rules = {
  ...wrappedBuiltinRules,
  'no-blocking-call': noBlockingCall,
  'no-exception': noException,
  'no-failable-cast': noFailableCast,
  'no-failable-condition': noFailableCondition,
  'no-ignored-failable': noIgnoredFailable,
  'no-internal-mock': noInternalMock,
  'no-restricted-module': noRestrictedModule,
  'no-silent-error': noSilentError,
  'no-unsafe-throwing-call': noUnsafeThrowingCall,
};

export default {
  meta: { name: 'serverstarter' },
  rules,
};
