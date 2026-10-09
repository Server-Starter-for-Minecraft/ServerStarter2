/** 表示する追加コンテンツの名前と説明 */
type ContentText = { name: string; description?: string };

/**
 * Minecraftの書式コード（§a など）を取り除いた表示用の文字列を返す
 *
 * データパックの名前や説明には文字色などの書式コードが含まれる場合があるため、表示や検索の前に取り除く
 *
 * @param text 名前や説明の文字列
 * @returns 書式コードを取り除いた文字列
 */
export function toDisplayText(text: string) {
  return text.replace(/§./g, '').trim();
}

/**
 * 検索ワードに一致する追加コンテンツのみに絞り込む
 *
 * 名前と説明を対象に大文字・小文字を区別せずに検索し、スペース区切りの複数の検索ワードはAND検索とする
 *
 * @param contents 追加コンテンツの一覧
 * @param query 検索ワード（空の場合は絞り込まない）
 * @returns 検索ワードに一致する追加コンテンツの一覧（元の順序を保つ）
 */
export function filterContents<T extends ContentText>(
  contents: T[],
  query: string
): T[] {
  const words = query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w);
  if (words.length === 0) return contents;

  return contents.filter((c) => {
    const text = toDisplayText(
      `${c.name} ${c.description ?? ''}`
    ).toLowerCase();
    return words.every((w) => text.includes(w));
  });
}
