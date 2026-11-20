import { describe, expect, test } from 'vitest';
import { findIncreasedSuppressions } from './suppressions';

describe('findIncreasedSuppressions', () => {
  test('抑制の件数が変わらない・減った場合は何も返さない', () => {
    const before = {
      'a.ts': { 'rule-a': { count: 2 } },
      'b.ts': { 'rule-b': { count: 1 } },
    };
    const after = { 'a.ts': { 'rule-a': { count: 1 } } };

    expect(findIncreasedSuppressions(before, after)).toEqual([]);
  });

  test('新しいファイル・ルールの抑制が追加された場合は報告する', () => {
    const after = { 'new.ts': { 'rule-a': { count: 1 } } };

    expect(findIncreasedSuppressions({}, after)).toEqual([
      { file: 'new.ts', rule: 'rule-a', before: 0, after: 1 },
    ]);
  });

  test('合計の件数が同じでも，ファイルとルールの組ごとに増えていれば報告する', () => {
    const before = {
      'a.ts': { 'rule-a': { count: 1 } },
    };
    // a.ts の抑制を 1 件直し，b.ts に 1 件追加した（合計は同じ）
    const after = {
      'b.ts': { 'rule-a': { count: 1 } },
    };

    expect(findIncreasedSuppressions(before, after)).toEqual([
      { file: 'b.ts', rule: 'rule-a', before: 0, after: 1 },
    ]);
  });
});
