import { fileDataKey } from 'app/src-electron/schema/filedata';

/**
 * 一覧から指定した追加コンテンツを取り除く
 *
 * 名前が同じでも拡張子が異なる（フォルダーとファイルなど）別の追加コンテンツは取り除かない
 *
 * @param list 追加コンテンツの一覧（直接変更する）
 * @param content 取り除く追加コンテンツ
 */
export function removeContent<T extends Parameters<typeof fileDataKey>[0]>(
  list: T[],
  content: T
) {
  const idx = list.findIndex((c) => fileDataKey(c) === fileDataKey(content));
  if (idx >= 0) list.splice(idx, 1);
}
