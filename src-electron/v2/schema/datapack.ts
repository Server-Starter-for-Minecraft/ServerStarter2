import { NewType } from '../util/type/newtype';

export type DatapackHash = NewType<string, 'DatapackHash'>;
export type DatapackName = NewType<string, 'DatapackName'>;
export type DatapackId = NewType<string, 'DatapackId'>;

/** データパックの読み取り専用データ */
export type DatapackInfo = {
  /**
   * データパックのID
   *
   * zipの場合は "zip_${sha1}"       になる
   * dirの場合は "dir_${ファイル名}" になる
   */
  readonly datapackId: DatapackId;

  /** データパックの種類 */
  readonly type: 'dir' | 'zip';

  /** データパック説明文 (pack.mcmetaの内容) */
  readonly description: string;
};

/** ワールドごとに設定できるデータパックのメタデータ */
export type DatapackAnnotation = {
  /** 名前(拡張子なし) */
  name: DatapackName;

  /** データを共有していいか デフォルト値=undefined */
  canShare?: boolean;

  /** データを他のワールドで使用していいか デフォルト値=undefined */
  canCopy?: boolean;

  /** データパックに対する任意のコメント デフォルト値="" */
  memo: string;
};

/** データパック+メタデータ */
export type DatapackMeta = {
  readonly info: DatapackInfo;
  annotation: DatapackAnnotation;
};
