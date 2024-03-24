// in source testing の記法

// in source testing とは実装と同じファイルに、その実装に関するテストを記述する手法
// https://vitest.dev/guide/in-source
// SeverStarter2ではユニットテストにこの記法を採用する

// これが実装
export function double(num: number) {
  return num * 2;
}

// これがテスト
// 最初2行はおまじない
if (import.meta.vitest) {
  const { test, expect } = import.meta.vitest;
  test('double', () => {
    expect(double(2)).toBe(4);
  });
}
