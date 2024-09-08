/**
 * ダイアログを表示する際の初期値
 *
 * - `isShareWorld`: このワールドがShareWorldか否か
 * - `title`: 追加コンテンツの名称
 * - `shareable`: 当該追加コンテンツをShareWorldに入れて共有するか（ShareWorldの時にのみ変更可能）
 * - `description`: 自由記述のメモ欄
 */
export type DetailsEditorProp = {
  isShareWorld: boolean;
} & DetailsEditorReturns;

/**
 * 編集した情報を戻す
 */
export interface DetailsEditorReturns {
  title: string;
  shareable: boolean;
  description: string;
}
