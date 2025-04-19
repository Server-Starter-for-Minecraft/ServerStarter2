type DymanicRecordOptions<K, V> = {
  /** valueの初期値コンストラクタ */
  init: () => V;
};

/**
 * 任意のキーにアクセスして常に必ず値を返すMap
 *
 * 初期化関数を受け取り、始めてアクセスされるキーの場合に内部で実行する
 */
export class InfinitMap<K, V> {
  private init: (key: K) => V;
  private getter: (key: K) => V | undefined;
  private setter: (key: K, value: V) => void;

  private constructor(
    init: (key: K) => V,
    getter: (key: K) => V | undefined,
    setter: (key: K, value: V) => void
  ) {
    this.init = init;
    this.getter = getter;
    this.setter = setter;
  }

  /** 誰からも参照されなくなった値も残り続ける */
  static objectKeyStrongValue<K extends object, V extends object>(
    init: (key: K) => V
  ): InfinitMap<K, V> {
    const map = new WeakMap<K, V>();
    const getter = (k: K) => map.get(k);
    const setter = (k: K, v: V) => map.set(k, v);
    return new InfinitMap(init, getter, setter);
  }

  /**
   * 誰からも参照されなくなった値は自動で削除される
   * @see https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/WeakRef
   */
  static objectKeyWeakValue<K extends object, V extends object>(
    init: (key: K) => V
  ): InfinitMap<K, V> {
    const map = new WeakMap<K, WeakRef<V>>();
    const getter = (k: K) => map.get(k)?.deref();
    const setter = (k: K, v: V) => map.set(k, new WeakRef(v));
    return new InfinitMap(init, getter, setter);
  }

  static objectKeyPrimitiveValue<
    K extends object,
    V extends number | string | boolean
  >(init: (key: K) => V): InfinitMap<K, V> {
    const map = new WeakMap<K, V>();
    const getter = (k: K) => map.get(k);
    const setter = (k: K, v: V) => map.set(k, v);
    return new InfinitMap(init, getter, setter);
  }

  /** 誰からも参照されなくなった値も残り続ける */
  static primitiveKeyStrongValue<K extends number | string, V extends object>(
    init: (key: K) => V
  ): InfinitMap<K, V> {
    const map = {} as Record<K, V>;
    const getter = (k: K) => map[k];
    const setter = (k: K, v: V) => (map[k] = v);
    return new InfinitMap(init, getter, setter);
  }

  /**
   * 誰からも参照されなくなった値は自動で削除される
   * @see https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/WeakRef
   */
  static primitiveKeyWeakValue<K extends number | string, V extends object>(
    init: (key: K) => V
  ): InfinitMap<K, V> {
    const map = {} as Record<K, WeakRef<V>>;
    const getter = (k: K) => map[k]?.deref();
    const setter = (k: K, v: V) => (map[k] = new WeakRef(v));
    return new InfinitMap(init, getter, setter);
  }

  static primitiveKeyPrimitiveValue<
    K extends number | string,
    V extends number | string | boolean
  >(init: (key: K) => V): InfinitMap<K, V> {
    const map = {} as Record<K, V>;
    const getter = (k: K) => map[k];
    const setter = (k: K, v: V) => (map[k] = v);
    return new InfinitMap(init, getter, setter);
  }

  /** キーに対する値を取得する、存在しない場合生成する */
  get(key: K): V {
    const val = this.getter(key);
    if (val !== undefined) return val;
    const newVal = this.init(key);
    this.setter(key, newVal);
    return newVal;
  }

  set(key: K, value: V) {
    this.setter(key, value);
  }
}

/** In Source Testing */
if (import.meta.vitest) {
  const { describe, test, expect } = import.meta.vitest;
  describe('InfinitMap', () => {
    test('key:primitive value:primitive', () => {
      const map = InfinitMap.primitiveKeyPrimitiveValue<string, string>(
        () => 'init'
      );
      expect(map.get('foo')).toBe('init');
      map.set('foo', 'modified');
      expect(map.get('foo')).toBe('modified');
      expect(map.get('bar')).toBe('init');
    });
  });
}
