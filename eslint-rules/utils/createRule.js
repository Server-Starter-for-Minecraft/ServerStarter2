// @ts-check
import { ESLintUtils } from '@typescript-eslint/utils';

/**
 * 独自ルールを作成する
 *
 * ルールの説明ページとして，リポジトリ内のルールの実装ファイルを指す
 * （各ルールの先頭に，目的と判定方法を日本語で記述している）
 */
export const createRule = ESLintUtils.RuleCreator(
  (name) =>
    `https://github.com/Server-Starter-for-Minecraft/ServerStarter2/blob/main/eslint-rules/rules/${name}.js`
);
