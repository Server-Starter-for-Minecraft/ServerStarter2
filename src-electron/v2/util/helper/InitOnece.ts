/**
 * この型で定義された値は値が存在しないとき，事前に定義した生成フローに従って値を生成する
 */
export class InitOnece<T, U> {
  private init: (args: U) => T;
  private val: T | undefined;

  constructor(init: (args: U) => T) {
    this.init = init;
  }

  get(args: U) {
    // valが定義されていないときは定義する
    if (!this.val) {
      this.val = this.init(args);
    }

    // 定義済みの値を返す
    return this.val;
  }
}

/** In Source Testing */
if (import.meta.vitest) {
  const { test, expect } = import.meta.vitest;
  test('InitOnece', () => {
    const testVal = new InitOnece((text: string) => `test ${text}`);

    // 最初はデータが定義されていないため，与えられたデータで値を生成
    expect(testVal.get('first')).toBe('test first');

    // 次回以降はどのようなデータであっても内側に保持しているデータを返す
    expect(testVal.get('second')).toBe('test first');
  });
}
