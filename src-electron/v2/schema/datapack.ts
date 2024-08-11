import { z } from 'zod';

// export const DatapackHash = z.string().brand('DatapackHash');
// export type DatapackHash = z.infer<typeof DatapackHash>;

// export const DatapackName = z.string().brand('DatapackName');
// export type DatapackName = z.infer<typeof DatapackName>;

export const DatapackId = z.string().brand('DatapackId');
export type DatapackId = z.infer<typeof DatapackId>;

export const ZipDatapackIdentity = z.object({
  type: z.literal('zip'),
  datapackId: DatapackId,
});
export type ZipDatapackIdentity = z.infer<typeof ZipDatapackIdentity>;

export const DirDatapackIdentity = z.object({
  type: z.literal('dir'),
  datapackId: DatapackId,
});
export type DirDatapackIdentity = z.infer<typeof DirDatapackIdentity>;

/** データパックの同一性を示すデータ */
const DatapackIdentity = z.discriminatedUnion('type', [
  ZipDatapackIdentity,
  DirDatapackIdentity,
]);
type DatapackIdentity = z.infer<typeof DatapackIdentity>;

/** データパックの読み取り専用データ */
export const DatapackInfo = z.object({
  identity: DatapackIdentity,

  /** データパック説明文 */
  description: z.string(),
});
export type DatapackInfo = z.infer<typeof DatapackInfo>;

/** ワールドごとに設定できるデータパックのメタデータ */
export const DatapackAnnotation = z.object({
  /** ファイル名 */
  name: z.string(),
  /** データを共有していいか */
  canShare: z.boolean(),
  /** データを他のワールドで使用していいか */
  canCopy: z.boolean(),
  comment: z.string(),
});
export type DatapackAnnotation = z.infer<typeof DatapackAnnotation>;

/** データパック+メタデータ */
export const DatapackMeta = z.object({
  info: DatapackInfo,
  annotation: DatapackAnnotation,
});
export type DatapackMeta = z.infer<typeof DatapackMeta>;
