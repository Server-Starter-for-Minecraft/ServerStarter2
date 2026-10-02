import { describe, expect, test } from 'vitest';
import { WorldID } from 'app/src-electron/schema/world';
import { nextWorldAfterDeletion } from './worldDeletion';

const [w1, w2, w3] = ['w1', 'w2', 'w3'] as WorldID[];

describe('nextWorldAfterDeletion', () => {
  test('削除したワールド以外で表示順が先頭のワールドを表示する', () => {
    expect(nextWorldAfterDeletion([w1, w2, w3], w1)).toBe(w2);
    expect(nextWorldAfterDeletion([w1, w2, w3], w2)).toBe(w1);
  });

  test('表示中のワールドが削除したワールドのみの場合は表示できるワールドがない', () => {
    // 非表示コンテナのワールドは候補に含めないため、表示中のワールドが1つだけの場合
    expect(nextWorldAfterDeletion([w1], w1)).toBeUndefined();
  });
});
