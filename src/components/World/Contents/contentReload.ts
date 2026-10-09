import { fileDataKey } from 'app/src-electron/schema/filedata';

/** 追加コンテンツの識別に用いる情報 */
type ContentEntry = { name: string; ext: string; type: string };

/** 保存先から読み込み直した結果 */
export type ReloadedContents<T> = {
  /** 画面に表示する追加コンテンツの一覧 */
  contents: T[];
  /** 画面に表示中の一覧から変化があったか */
  changed: boolean;
};

/**
 * 保存先から読み込み直した追加コンテンツを、画面に表示中の一覧に反映する
 *
 * - 保存先に直接追加・削除された追加コンテンツを反映する
 * - 導入操作の直後でまだ保存先にコピーされていない追加コンテンツ（ワールド外から導入したもの）は残す
 * - 変化がない場合は、ワールドの保存処理を発生させないよう表示中の一覧をそのまま返す
 *
 * @param current 画面に表示中の追加コンテンツの一覧
 * @param loaded 保存先から読み込んだ追加コンテンツの一覧
 * @returns 反映後の一覧と、変化があったか
 */
export function mergeReloadedContents<T extends ContentEntry>(
  current: T[],
  loaded: T[]
): ReloadedContents<T> {
  const loadedKeys = new Set(loaded.map(fileDataKey));

  // 保存先に無い、ワールド外から導入したばかりの追加コンテンツ
  const pending = current.filter(
    (c) => c.type !== 'world' && !loadedKeys.has(fileDataKey(c))
  );
  const contents = [...loaded, ...pending];

  const currentKeys = new Set(current.map(fileDataKey));
  const changed =
    contents.length !== current.length ||
    contents.some((c) => !currentKeys.has(fileDataKey(c)));

  return changed
    ? { contents, changed }
    : { contents: current, changed: false };
}
