// ここ読めばぜんぶ書いてあるのでよもう
// https://jestjs.io/ja/docs/expect

describe('example', async () => {
  test('example test 01', () => {
    // toBe 参照比較
    // toEqual 構造比較

    expect(1).toBe(1);
    expect(1).toEqual(1);

    expect('test').toBe('test');
    expect('test').toEqual('test');

    expect({ a: 1 }).not.toBe({ a: 1 });
    expect({ a: 1 }).toEqual({ a: 1 });

    expect([1]).not.toBe([1]);
    expect([1]).toEqual([1]);

    // 特殊な値は専用のものを使うとよい
    expect(NaN).toBeNaN();
    expect(null).toBeNull();
    expect(undefined).toBeUndefined();

    // 小数の比較はtoBeCloseToを使うこと
    expect(0.1 + 0.2).toBeCloseTo(0.3);
  });

  test('example test error', () => {
    class MyErr1 extends Error {}
    class MyErr2 extends Error {}

    function err() {
      throw new MyErr1('test err');
    }

    // エラーを捕捉する場合は関数にしておくこと
    expect(() => err()).toThrow();
    expect(() => err()).toThrow('test err');
    expect(() => err()).toThrow('err');
    expect(() => err()).toThrow(/e[r]+/);
    expect(() => err()).toThrow(MyErr1);
    expect(() => err()).not.toThrow(MyErr2);
  });

  test('example test acync', async () => {
    async function asyncFunc() {
      return 1;
    }

    async function asyncErr() {
      throw new Error('test err');
    }

    // awaitが成功
    await expect(asyncFunc()).resolves.toBe(1);

    // awaitが失敗
    await expect(asyncErr()).rejects.toThrow();
  });
});
