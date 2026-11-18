import { z } from 'zod';
import {
  BooleanServerPropertyAnnotation,
  NumberServerPropertyAnnotation,
  StringServerPropertyAnnotation,
} from '../serverproperty';
import { lenientArray, lenientRecord, LocalizedText } from './common';

/**
 * 定義が対応する Minecraft のバージョンの範囲（両端を含む）
 *
 * バージョンは Minecraft のバージョン ID（例：`1.19`・`24w14a`）で指定し，前後関係はバニラの配布一覧の並び順で判定する。
 * 省略した側は範囲の制限がないものとする。
 * 明示した範囲は存在期間が確認されたものとして扱うため，根拠のある場合にのみ指定する
 */
export const MinecraftVersionRange = z.object({
  /** この定義を使い始めるバージョン */
  from: z.string().min(1).optional(),
  /** この定義を使う最後のバージョン */
  to: z.string().min(1).optional(),
});
export type MinecraftVersionRange = z.infer<typeof MinecraftVersionRange>;

const versionRangeField = {
  /** 定義が対応するバージョンの範囲（省略した場合はすべてのバージョン） */
  minecraftVersion: MinecraftVersionRange.optional(),
};

/**
 * サーバープロパティの値の定義（型・既定値・選択肢・範囲など）
 *
 * アプリのプロパティ画面で使う注釈（`ServerPropertyAnnotation`）に，対応するバージョンの範囲を加えたもの
 */
export const ServerPropertyDefinitionV1 = z.discriminatedUnion('type', [
  StringServerPropertyAnnotation.extend(versionRangeField),
  BooleanServerPropertyAnnotation.extend(versionRangeField),
  NumberServerPropertyAnnotation.extend(versionRangeField),
]);
export type ServerPropertyDefinitionV1 = z.infer<
  typeof ServerPropertyDefinitionV1
>;

const entryFields = {
  /**
   * プロパティを表示するタブの識別子（`groups` で定義したタブ。複数のタブに表示できる）
   *
   * 省略した場合はアプリ内の分類に従い，どのタブにも属さなければ「その他」に表示する
   */
  groups: z.array(z.string()).optional(),
  /** プロパティの説明文（省略した場合はアプリ内の説明文を表示する） */
  description: LocalizedText.optional(),
};

/** サーバープロパティ1件の定義（外部リソース `serverProperties.json` の1要素） */
export const ServerPropertyEntryV1 = z.object({
  ...entryFields,
  /**
   * バージョンごとの値の定義
   *
   * ワールドのバージョンに合う最初の定義を使い，合う定義がなければ最も近い範囲の定義を使う。
   * 範囲は存在期間が確認できた場合にのみ明示する。明示した範囲の外では，プロパティ画面に表示しない
   * （server.properties の値は残す）。
   * - すべての定義に `from` を指定した場合：最も古い `from` より前のバージョン
   * - すべての定義に `to` を指定した場合：最も新しい `to` より後のバージョン（上限なしの定義があれば表示し続ける）
   */
  definitions: z.array(ServerPropertyDefinitionV1).min(1),
});
export type ServerPropertyEntryV1 = z.infer<typeof ServerPropertyEntryV1>;

/** プロパティ画面のタブ */
export const PropertyGroupV1 = z.object({
  /** タブの識別子（プロパティの `groups` で指定する） */
  id: z.string().min(1),
  /** タブの表示名 */
  label: LocalizedText,
});
export type PropertyGroupV1 = z.infer<typeof PropertyGroupV1>;

/** 外部リソース `serverProperties.json`（v1）の厳格なスキーマ（JSON Schema の生成・検証に使う） */
export const ServerPropertiesResourceV1 = z.object({
  /**
   * プロパティ画面のタブの一覧（表示順。識別子は重複させない）
   *
   * 「その他」（`other`）は予約されたタブで，どのタブにも属さないプロパティを表示するためにアプリが末尾に加える。
   * 省略した場合はアプリ内のタブを使う
   */
  groups: z
    .array(PropertyGroupV1)
    .refine(
      (groups) => new Set(groups.map((g) => g.id)).size === groups.length,
      {
        message: 'group ids must be unique',
      }
    )
    .optional(),
  /** プロパティ名と定義の組 */
  properties: z.record(z.string(), ServerPropertyEntryV1),
});
export type ServerPropertiesResourceV1 = z.infer<
  typeof ServerPropertiesResourceV1
>;

/** 外部リソース `serverProperties.json`（v1）の読み込み用パーサー（不正な定義だけを除いて読み込む） */
export const ServerPropertiesResourceV1Parser = z.object({
  // 識別子が重複したタブは，最初のものだけを使う
  groups: lenientArray(PropertyGroupV1)
    .transform((groups) =>
      groups.filter((g, idx) => groups.findIndex((x) => x.id === g.id) === idx)
    )
    .optional(),
  properties: lenientRecord(
    z.object({
      ...entryFields,
      definitions: lenientArray(ServerPropertyDefinitionV1).refine(
        (defs) => defs.length > 0
      ),
    })
  ),
});

/** サーバープロパティの定義（プロパティ名と定義の組） */
export type ServerPropertyDefinitions = Record<string, ServerPropertyEntryV1>;

/**
 * フロントエンドへ渡すサーバープロパティの外部リソース
 *
 * プロパティの定義は，同梱の定義と外部リソースの定義を合わせたもの
 */
export type ServerPropertiesResource = {
  /** プロパティ画面のタブの一覧（未定義の場合はアプリ内のタブを使う） */
  groups?: PropertyGroupV1[];
  /** プロパティの定義 */
  properties: ServerPropertyDefinitions;
};
