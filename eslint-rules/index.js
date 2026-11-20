// @ts-check
/**
 * ServerStarter2 の独自 ESLint ルール（プラグイン `serverstarter`）
 *
 * テストだけでは防げない規約違反（エラーハンドリング・非同期処理・層構造など）を静的解析で検出する。
 * ルールの対象や例外などの設定値は `config.js` に集約し，`eslint.config.js` から参照する
 */

/** @type {Record<string, import('@typescript-eslint/utils').TSESLint.RuleModule<string, unknown[]>>} */
const rules = {};

export default {
  meta: { name: 'serverstarter' },
  rules,
};
