/** 翻訳の引数として使える値 */
type FlatValue = string | number | string[];

/**
 * 入れ子のオブジェクトを，キーを `_` でつないだ平らなオブジェクトにする（翻訳の引数に使う）
 *
 * 例：`{ a: { b: 1 } }` → `{ a_b: 1 }`。
 * 文字列・数値・配列以外の値（真偽値・null など）は含めない。配列の要素は文字列にする
 *
 * @param obj 平らにするオブジェクト
 * @returns キーを `_` でつないだ平らなオブジェクト
 */
export function flattenObj(obj: object): Record<string, FlatValue> {
  const flat: Record<string, FlatValue> = {};
  for (const [key, entry] of Object.entries(obj)) {
    const value: unknown = entry;
    if (typeof value === 'string' || typeof value === 'number') {
      flat[key] = value;
    } else if (Array.isArray(value)) {
      flat[key] = value.map((v) => String(v));
    } else if (typeof value === 'object' && value !== null) {
      for (const [k, inner] of Object.entries(flattenObj(value))) {
        flat[`${key}_${k}`] = inner;
      }
    }
  }
  return flat;
}
