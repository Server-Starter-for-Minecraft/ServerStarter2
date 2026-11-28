import { describe, expect, test } from 'vitest';
import { withFixedTime } from './withTime';

const FIXED = new Date('2000-01-01T00:00:00Z');

/** 実際の時刻に戻っているか（固定した日時から十分に離れているか） */
function isRealTime() {
  return Math.abs(Date.now() - FIXED.getTime()) > 24 * 60 * 60 * 1000;
}

describe('withFixedTime', () => {
  test('実行中は日時が固定され，終了後は実際の時刻に戻る', async () => {
    const seen = await withFixedTime(FIXED, async () => new Date())();

    expect(seen).toEqual(FIXED);
    expect(isRealTime()).toBe(true);
  });

  test('関数が例外を投げた場合も，実際の時刻に戻る', () => {
    const throwing = withFixedTime(FIXED, () => {
      throw new Error('failed');
    });

    expect(throwing).toThrow('failed');
    expect(isRealTime()).toBe(true);
  });

  test('Promise が reject された場合も，失敗を伝えたうえで実際の時刻に戻る', async () => {
    const rejecting = withFixedTime(FIXED, async () => {
      throw new Error('failed');
    });

    await expect(rejecting()).rejects.toThrow('failed');
    expect(isRealTime()).toBe(true);
  });
});
