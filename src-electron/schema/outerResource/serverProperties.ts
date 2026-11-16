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
 * 省略した側は範囲の制限がないものとする
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
   * プロパティ画面で表示するタブ（`base`・`player` など。アプリが知らないタブは無視する）
   *
   * 省略した場合はアプリ内の分類に従い，どこにも分類されなければ「その他」に表示する
   */
  groups: z.array(z.string()).optional(),
  /** プロパティの説明文（省略した場合はアプリ内の説明文を表示する） */
  description: LocalizedText.optional(),
  /**
   * プロパティが廃止された Minecraft のバージョン
   *
   * このバージョン以降のワールドでは，server.properties に無いプロパティを既定値で補わない
   * （server.properties にあるプロパティは表示する）
   */
  removedIn: z.string().min(1).optional(),
};

/** サーバープロパティ1件の定義（外部リソース `serverProperties.json` の1要素） */
export const ServerPropertyEntryV1 = z.object({
  ...entryFields,
  /**
   * バージョンごとの値の定義
   *
   * ワールドのバージョンに合う最初の定義を使い，合う定義がなければ最も近い範囲の定義を使う
   */
  definitions: z.array(ServerPropertyDefinitionV1).min(1),
});
export type ServerPropertyEntryV1 = z.infer<typeof ServerPropertyEntryV1>;

/** 外部リソース `serverProperties.json`（v1）の厳格なスキーマ（JSON Schema の生成・検証に使う） */
export const ServerPropertiesResourceV1 = z.object({
  /** プロパティ名と定義の組 */
  properties: z.record(z.string(), ServerPropertyEntryV1),
});
export type ServerPropertiesResourceV1 = z.infer<
  typeof ServerPropertiesResourceV1
>;

/** 外部リソース `serverProperties.json`（v1）の読み込み用パーサー（不正な定義だけを除いて読み込む） */
export const ServerPropertiesResourceV1Parser = z.object({
  properties: lenientRecord(
    z.object({
      ...entryFields,
      definitions: lenientArray(ServerPropertyDefinitionV1).refine(
        (defs) => defs.length > 0
      ),
    })
  ),
});

/**
 * フロントエンドへ渡すサーバープロパティの定義
 *
 * 同梱の定義と外部リソースの定義を合わせたもの（プロパティ名と定義の組）
 */
export type ServerPropertyDefinitions = Record<string, ServerPropertyEntryV1>;
