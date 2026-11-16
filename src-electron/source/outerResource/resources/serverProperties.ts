import {
  ServerPropertiesResource,
  ServerPropertiesResourceV1,
  ServerPropertiesResourceV1Parser,
  ServerPropertyDefinitions,
  ServerPropertyEntryV1,
} from 'app/src-electron/schema/outerResource/serverProperties';
import { DefaultServerPropertiesAnnotation } from 'app/src-electron/schema/serverproperty';
import bundledJson from '../bundled/v1/serverProperties.json';
import type {
  OuterResourceContext,
  OuterResourceDefinition,
} from '../definition';

/**
 * 同梱のサーバープロパティの定義
 *
 * アプリ内のプロパティの定義（`DefaultServerProperties`）から作るため，バージョンの範囲や説明文は持たない
 * （外部リソース（同梱データを含む）に説明文やタブの指定がないプロパティは，フロントエンドのアプリ内の定義を使う）
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
 * @param warn 使わなかった定義を記録する関数
 * @returns 合わせた定義
 */
export function mergeServerPropertyDefinitions(
  remote: ServerPropertyDefinitions,
  warn: OuterResourceContext['warn'] = () => {}
): ServerPropertyDefinitions {
  /** 外部リソースの定義のうち，使える定義に絞ったもの */
  const usable = Object.entries(remote).map(([key, entry]) => {
    // `constructor` などの継承したキーを同梱のプロパティとみなさないよう Object.hasOwn で判定する
    if (!Object.hasOwn(DefaultServerPropertiesAnnotation, key)) {
      return [key, entry] as const;
    }
    const bundledType = DefaultServerPropertiesAnnotation[key].type;
    const definitions = entry.definitions.filter(
      (def) => def.type === bundledType
    );
    if (definitions.length < entry.definitions.length) {
      warn('ignored definitions whose type differs from the bundled one', {
        property: key,
        bundledType,
      });
    }
    return [
      key,
      {
        ...entry,
        definitions:
          definitions.length > 0
            ? definitions
            : bundledEntries[key].definitions,
      },
    ] as const;
  });
  // `__proto__` などのキーでもプロトタイプを書き換えないよう，代入ではなく Object.fromEntries で作る
  return Object.fromEntries([...Object.entries(bundledEntries), ...usable]);
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
  ServerPropertiesResource
> = {
  key: 'serverProperties',
  schemaVersion: 1,
  fileName: 'serverProperties.json',
  schema: ServerPropertiesResourceV1,
  parser: ServerPropertiesResourceV1Parser,
  // リリース時のビルドで配布元の最新の内容に更新される同梱データ（`bun run outer-resources pull`）
  // アプリ内の定義は `resolve` で必ず合わせるため，読み込めない場合は外部リソースの定義がない状態とする
  bundled: ServerPropertiesResourceV1Parser.safeParse(bundledJson).data ?? {
    properties: {},
  },
  async resolve(wire, ctx) {
    return {
      groups: wire.groups,
      properties: mergeServerPropertyDefinitions(wire.properties, ctx.warn),
    };
  },
};
