/**
 * Minecraftのテキストコンポーネント（Raw JSON text format）を、装飾を除いた表示用の文字列に変換する
 *
 * `pack.mcmeta` の `description` などは、文字列のほかに `{ "text": "..." }` や
 * `{ "translate": "..." }`、配列などのテキストコンポーネントで記述できるため、表示前に文字列へまとめる。
 *
 * - 文字列・数値・真偽値はそのまま文字列にする
 * - 配列は各要素を変換して連結する
 * - オブジェクトは `text` / `translate`（`fallback` があればそちらを優先）/ `keybind` を本文とし、`extra` を後ろに連結する
 * - 上記以外（`score` や `selector` などゲーム内でしか解決できないもの、`null` など）は空文字とする
 *
 * 色などの書式は扱わない（文字列中の書式コード `§a` などはそのまま残る）。
 * また、翻訳の引数（`with`）は埋め込まない（`fallback` 中の `%s` などはそのまま残る）
 *
 * @param component テキストコンポーネントとして記述された値
 * @returns 表示用の文字列
 */
export function textComponentToString(component: unknown): string {
  if (typeof component === 'string') return component;
  if (typeof component === 'number' || typeof component === 'boolean') {
    return String(component);
  }
  if (Array.isArray(component)) {
    return component.map(textComponentToString).join('');
  }
  if (typeof component !== 'object' || component === null) return '';

  const obj = component as Record<string, unknown>;
  const extra = Array.isArray(obj.extra)
    ? obj.extra.map(textComponentToString).join('')
    : '';
  return `${componentBody(obj)}${extra}`;
}

/**
 * テキストコンポーネントのオブジェクトから、`extra` を除いた本文を取り出す
 *
 * @param obj テキストコンポーネントのオブジェクト
 * @returns 本文の文字列（本文として扱える項目がなければ空文字）
 */
function componentBody(obj: Record<string, unknown>): string {
  if ('text' in obj) return textComponentToString(obj.text);
  if (typeof obj.translate === 'string') {
    // 翻訳キーは解決できないため、代替文字列があればそれを、なければキーそのものを表示する
    return typeof obj.fallback === 'string' ? obj.fallback : obj.translate;
  }
  if (typeof obj.keybind === 'string') return obj.keybind;
  return '';
}
