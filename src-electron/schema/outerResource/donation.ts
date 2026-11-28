import { z } from 'zod';
import { ImageURI } from '../brands';
import { HttpsUrl, ImageSource, lenientArray, LocalizedText } from './common';

/**
 * 寄付サービス（外部リソース `donation.json` の1要素）
 *
 * 配列の並び順がそのまま寄付ダイアログでの表示順になる
 */
export const DonationServiceV1 = z.object({
  /** サービスの識別子（重複させない） */
  id: z.string().min(1),
  /** サービス名（固有名詞のため翻訳しない） */
  name: z.string().min(1),
  /** 寄付ページの URL（ブラウザで開くため https に限る） */
  url: HttpsUrl,
  /** サービスのアイコン画像（未指定の場合はアイコンを表示しない） */
  icon: ImageSource.optional(),
  /** サービス名の文字色（サービスのブランドカラー。`#RRGGBB` 形式） */
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  /** サービスの説明文 */
  description: LocalizedText,
  /** 寄付ダイアログに表示するか（準備中のサービスは `false` にしておく） */
  visible: z.boolean(),
});
export type DonationServiceV1 = z.infer<typeof DonationServiceV1>;

/** 外部リソース `donation.json`（v1）の厳格なスキーマ（JSON Schema の生成・検証に使う） */
export const DonationResourceV1 = z.object({
  services: z
    .array(DonationServiceV1)
    .refine(
      (services) => new Set(services.map((s) => s.id)).size === services.length,
      {
        message: 'service ids must be unique',
      }
    ),
});
export type DonationResourceV1 = z.infer<typeof DonationResourceV1>;

/** 外部リソース `donation.json`（v1）の読み込み用パーサー（不正なサービスだけを除いて読み込む） */
export const DonationResourceV1Parser = z.object({
  // 識別子が重複したサービスは，最初のものだけを使う
  services: lenientArray(DonationServiceV1).transform((services) =>
    services.filter(
      (service, idx) => services.findIndex((s) => s.id === service.id) === idx
    )
  ),
});

/** フロントエンドへ渡す寄付サービス（アイコンを画像データへ解決したもの） */
export type DonationService = Omit<DonationServiceV1, 'icon'> & {
  /** アイコン画像（未定義の場合はアイコンを表示しない） */
  icon?: ImageURI;
};

/** フロントエンドへ渡す寄付サービスの一覧 */
export type DonationResource = {
  services: DonationService[];
};
