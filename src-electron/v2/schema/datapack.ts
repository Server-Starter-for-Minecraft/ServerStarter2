import { NewType } from '../util/type/newtype';

export type DatapackHash = NewType<string, 'DatapackHash'>;
export type DatapackName = NewType<string, 'DatapackName'>;
export type DatapackId = NewType<string, 'DatapackId'>;

export type ZipDatapackIdentity = {
  readonly type: 'zip';
  readonly datapackId: DatapackId;
};

export type DirDatapackIdentity = {
  readonly type: 'dir';
  readonly datapackId: DatapackId;
};

/** データパックの同一性を示すデータ */
type DatapackIdentity = DirDatapackIdentity | ZipDatapackIdentity;

/** データパックの読み取り専用データ */
export type DatapackInfo = {
  readonly identity: DatapackIdentity;

  /** データパック説明文 */
  readonly description: string;
};

/** ワールドごとに設定できるデータパックのメタデータ */
export type DatapackAnnotation = {
  /** ファイル名 */
  name: string;
  /** データを共有していいか */
  canShare: boolean;
  /** データを他のワールドで使用していいか */
  canCopy: boolean;
  comment: string;
};

/** データパック+メタデータ */
export type DatapackMeta = {
  readonly info: DatapackInfo;
  annotation: DatapackAnnotation;
};
