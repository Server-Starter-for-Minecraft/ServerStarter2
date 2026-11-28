import { z } from 'zod';

/**
 * ESLint の一括抑制ファイル（`eslint-suppressions.json`）の形式
 *
 * `{ [ファイルのパス]: { [ルール名]: { count: 抑制している違反の件数 } } }`
 */
export const EslintSuppressions = z.record(
  z.string(),
  z.record(z.string(), z.object({ count: z.number().int().nonnegative() }))
);
export type EslintSuppressions = z.infer<typeof EslintSuppressions>;

/** 抑制の件数が増えたファイルとルールの組 */
export type IncreasedSuppression = {
  file: string;
  rule: string;
  /** 変更前の件数（抑制がなかった場合は 0） */
  before: number;
  /** 変更後の件数 */
  after: number;
};

/**
 * 変更前と比べて，抑制している違反の件数が増えたファイルとルールの組を返す
 *
 * 合計の件数ではなくファイルとルールの組ごとに比べる
 * （1 件直して別の 1 件を抑制に追加する入れ替えを見逃さないため）
 *
 * @param before 変更前（ベースブランチ）の抑制ファイルの内容
 * @param after 変更後の抑制ファイルの内容
 * @returns 件数が増えた組の一覧（増えていなければ空）
 */
export function findIncreasedSuppressions(
  before: EslintSuppressions,
  after: EslintSuppressions
): IncreasedSuppression[] {
  return Object.entries(after).flatMap(([file, rules]) =>
    Object.entries(rules)
      .map(([rule, { count }]) => ({
        file,
        rule,
        before: before[file]?.[rule]?.count ?? 0,
        after: count,
      }))
      .filter((entry) => entry.after > entry.before)
  );
}
