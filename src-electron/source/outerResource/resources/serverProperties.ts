import {
  ServerPropertiesResourceV1,
  ServerPropertiesResourceV1Parser,
  ServerPropertyDefinitions,
  ServerPropertyEntryV1,
} from 'app/src-electron/schema/outerResource/serverProperties';
import { DefaultServerPropertiesAnnotation } from 'app/src-electron/schema/serverproperty';
import { sourceLoggers } from '../../sourceLogger';
import { OuterResourceDefinition } from '../loader';

const loggers = () => sourceLoggers().outerResource.serverProperties;

/**
 * 同梱のサーバープロパティの定義
 *
 * アプリ内のプロパティの定義（`DefaultServerProperties`）から作るため，バージョンの範囲や説明文は持たない
 * （説明文とタブの分類はフロントエンドのアプリ内の定義を使う）
 */
const bundledEntries: ServerPropertyDefinitions = Object.fromEntries(
  Object.entries(DefaultServerPropertiesAnnotation).map(([key, annotation]) => [
    key,
    { definitions: [annotation] },
  ])
);

/**
 * 同梱の定義と外部リソースの定義を合わせる
 *
 * - プロパティは同梱と外部リソースの両方のものを使う（外部リソースから同梱のプロパティを消すことはできない）
 * - 外部リソースにあるプロパティは外部リソースの定義を優先する
 * - ただし同梱のプロパティの値はアプリ内の定義で読み込むため，同梱と型が異なる定義は使わない
 *
 * @param remote 外部リソースのプロパティの定義
 * @returns 合わせた定義
 */
export function mergeServerPropertyDefinitions(
  remote: ServerPropertyDefinitions
): ServerPropertyDefinitions {
  const merged: ServerPropertyDefinitions = { ...bundledEntries };
  for (const [key, entry] of Object.entries(remote)) {
    const bundledType = DefaultServerPropertiesAnnotation[key]?.type;
    if (bundledType === undefined) {
      merged[key] = entry;
      continue;
    }

    const definitions = entry.definitions.filter(
      (def) => def.type === bundledType
    );
    if (definitions.length < entry.definitions.length) {
      loggers().merge({ key, bundledType }).warn('ignored type mismatch');
    }
    merged[key] = {
      ...entry,
      definitions:
        definitions.length > 0 ? definitions : bundledEntries[key].definitions,
    };
  }
  return merged;
}

/**
 * プロパティの値の型を返す（すべてのバージョンで型が同じ場合のみ）
 *
 * server.properties の値（文字列）をこの型に変換して読み込むために使う
 *
 * @param entry プロパティの定義
 * @returns 値の型（バージョンによって型が異なる場合は `undefined`）
 */
export function getStablePropertyType(
  entry: ServerPropertyEntryV1
): ServerPropertyEntryV1['definitions'][number]['type'] | undefined {
  const types = new Set(entry.definitions.map((def) => def.type));
  return types.size === 1 ? [...types][0] : undefined;
}

/**
 * サーバープロパティの定義の外部リソース定義
 *
 * Minecraft の新しいバージョンで追加・変更されたプロパティを，アプリの更新なしでプロパティ画面に反映するために使う
 */
export const serverPropertiesDefinition: OuterResourceDefinition<
  ServerPropertiesResourceV1,
  ServerPropertyDefinitions
> = {
  key: 'serverProperties',
  schemaVersion: 1,
  fileName: 'serverProperties.json',
  schema: ServerPropertiesResourceV1,
  parser: ServerPropertiesResourceV1Parser,
  // 同梱の定義は `resolve` で必ず合わせるため，ここでは外部リソースの定義がない状態とする
  bundled: { properties: {} },
  async resolve(wire) {
    return mergeServerPropertyDefinitions(wire.properties);
  },
};
