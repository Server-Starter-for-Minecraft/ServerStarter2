// Vitest は `src/` のエイリアスを持たないため，テストからも読み込めるよう `app/` 経由で参照する
import { resolveLocalizedText } from 'app/src/i18n/utils/localizedText';
import type {
  MinecraftVersionRange,
  ServerPropertiesResource,
  ServerPropertyDefinitionV1,
  ServerPropertyEntryV1,
} from 'app/src-electron/schema/outerResource/serverProperties';
import {
  coercePropertyValue,
  type ServerPropertyAnnotation,
  type ServerPropertyType,
} from 'app/src-electron/schema/serverproperty';
import { builtInGroupKeys, propertyClasses } from './classifications';

/**
 * Minecraft のバージョンの前後関係を判定するための，新しい順に並べたバージョン ID の一覧
 *
 * バニラのバージョン一覧（配布一覧の並び順）を使う
 */
export type VersionOrder = readonly string[];

/** 定義のないプロパティの注釈（自由入力の文字列として表示する） */
const FALLBACK_ANNOTATION: ServerPropertyAnnotation = {
  type: 'string',
  default: '',
};

/** どのタブにも属さないプロパティを表示するタブの識別子（常に末尾に表示する） */
export const OTHER_GROUP_ID = 'other';

/**
 * プロパティの定義を返す
 *
 * `constructor` などの継承したキーを定義とみなさないよう `Object.hasOwn` で判定する
 */
function entryOf(
  resource: ServerPropertiesResource | undefined,
  key: string
): ServerPropertyEntryV1 | undefined {
  const properties = resource?.properties;
  return properties && Object.hasOwn(properties, key)
    ? properties[key]
    : undefined;
}

/** バージョンの新しさを表す順位（0 が最新で，値が大きいほど古い。一覧に無い場合は `undefined`） */
function versionRank(order: VersionOrder, versionId: string) {
  const rank = order.indexOf(versionId);
  return rank < 0 ? undefined : rank;
}

/**
 * 範囲の新しい側の端の順位
 *
 * 上限がない場合と，上限がアプリの知らない（一覧の更新より後の）バージョンの場合は，上限なしとして -∞ を返す
 */
function upperRank(order: VersionOrder, range?: MinecraftVersionRange) {
  if (range?.to === undefined) return -Infinity;
  return versionRank(order, range.to) ?? -Infinity;
}

/**
 * 範囲の古い側の端の順位
 *
 * 下限がない場合は +∞ を返す。下限がアプリの知らないバージョンの場合は，
 * 一覧の更新より後に公開されたバージョンとみなし，一覧のどのバージョンよりも新しい -1 を返す
 */
function lowerRank(order: VersionOrder, range?: MinecraftVersionRange) {
  if (range?.from === undefined) return Infinity;
  return versionRank(order, range.from) ?? -1;
}

/** 最新の定義（範囲の新しい側の端が最も新しいもの。同じ場合は古い側の端が新しいもの） */
function latestDefinition(
  definitions: ServerPropertyDefinitionV1[],
  order: VersionOrder
) {
  return [...definitions].sort(
    (a, b) =>
      upperRank(order, a.minecraftVersion) -
        upperRank(order, b.minecraftVersion) ||
      lowerRank(order, a.minecraftVersion) -
        lowerRank(order, b.minecraftVersion)
  )[0];
}

/**
 * ワールドのバージョンで使うプロパティの値の定義を選ぶ
 *
 * プロパティを非表示にすることはなく，アプリの対応が新しいバージョンに追いついていなくても必ず定義を返す。
 *
 * 1. バージョンに合う最初の定義
 * 2. 合う定義がなければ，そのバージョンより前に終わった範囲のうち最も新しい定義
 *    （新しいバージョンへの対応が遅れている場合や，範囲の間のバージョンでは，直前の定義を使い続ける）
 * 3. それもなければ（すべての範囲より古いバージョン），最も古い定義
 *
 * ワールドのバージョンが不明な場合（バージョン一覧に無い場合を含む）は，最新のバージョンとみなして最新の定義を使う
 *
 * @param entry プロパティの定義
 * @param versionId ワールドの Minecraft のバージョン（ワールドに依らない場合は `undefined`）
 * @param order 新しい順に並べたバージョン ID の一覧
 * @returns 使う定義
 */
export function selectPropertyDefinition(
  entry: ServerPropertyEntryV1,
  versionId: string | undefined,
  order: VersionOrder
): ServerPropertyDefinitionV1 {
  const { definitions } = entry;
  const rank =
    versionId === undefined ? undefined : versionRank(order, versionId);
  if (rank === undefined) return latestDefinition(definitions, order);

  const matched = definitions.find(
    (def) =>
      upperRank(order, def.minecraftVersion) <= rank &&
      rank <= lowerRank(order, def.minecraftVersion)
  );
  if (matched !== undefined) return matched;

  const endedBefore = definitions
    .filter((def) => rank < upperRank(order, def.minecraftVersion))
    .sort(
      (a, b) =>
        upperRank(order, a.minecraftVersion) -
        upperRank(order, b.minecraftVersion)
    );
  if (endedBefore.length > 0) return endedBefore[0];

  return [...definitions].sort(
    (a, b) =>
      lowerRank(order, b.minecraftVersion) -
      lowerRank(order, a.minecraftVersion)
  )[0];
}

/**
 * プロパティ画面で使うプロパティの注釈（型・既定値・選択肢など）を返す
 *
 * @param resource サーバープロパティの外部リソース
 * @param key プロパティ名
 * @param versionId ワールドの Minecraft のバージョン（ワールドに依らない場合は `undefined`）
 * @param order 新しい順に並べたバージョン ID の一覧
 * @returns 注釈（定義のないプロパティは自由入力の文字列）
 */
export function getPropertyAnnotation(
  resource: ServerPropertiesResource | undefined,
  key: string,
  versionId: string | undefined,
  order: VersionOrder
): ServerPropertyAnnotation {
  const entry = entryOf(resource, key);
  if (entry === undefined) return FALLBACK_ANNOTATION;
  const { minecraftVersion, ...annotation } = selectPropertyDefinition(
    entry,
    versionId,
    order
  );
  // バージョンの範囲は注釈に含めない
  void minecraftVersion;
  return annotation;
}

/**
 * ワールドのバージョンにまだ存在しないプロパティか
 *
 * すべての定義に対応バージョンの下限（`from`）があり，ワールドがそのどれよりも古い場合に `true` を返す。
 * このようなプロパティは，server.properties に無い場合に既定値で補わない
 *
 * @param resource サーバープロパティの外部リソース
 * @param key プロパティ名
 * @param versionId ワールドの Minecraft のバージョン（ワールドに依らない場合は `undefined` とし，存在するものとみなす）
 * @param order 新しい順に並べたバージョン ID の一覧
 */
export function isNotYetIntroduced(
  resource: ServerPropertiesResource | undefined,
  key: string,
  versionId: string | undefined,
  order: VersionOrder
): boolean {
  const entry = entryOf(resource, key);
  const rank =
    versionId === undefined ? undefined : versionRank(order, versionId);
  if (entry === undefined || rank === undefined) return false;
  return entry.definitions.every(
    (def) => rank > lowerRank(order, def.minecraftVersion)
  );
}

/** プロパティ画面のタブ */
export type PropertyGroup = {
  /** タブの識別子 */
  id: string;
  /** タブの表示名 */
  label: string;
};

/**
 * プロパティ画面のタブの一覧を返す（末尾は「その他」）
 *
 * 外部リソースでタブを定義している場合はその定義を使い，なければアプリ内のタブを使う。
 * 「その他」（`other`）は予約されたタブで，常にアプリの表示名で末尾に表示する（外部リソースの `other` の定義は使わない）
 *
 * @param resource サーバープロパティの外部リソース
 * @param locale 表示中の言語
 * @param builtInLabel アプリ内のタブの表示名を返す関数（「その他」の表示名にも使う）
 * @returns タブの一覧（表示順）
 */
export function getPropertyGroups(
  resource: ServerPropertiesResource | undefined,
  locale: string,
  builtInLabel: (id: string) => string
): PropertyGroup[] {
  const groups =
    resource?.groups !== undefined && resource.groups.length > 0
      ? resource.groups.map(({ id, label }) => ({
          id,
          label: resolveLocalizedText(label, locale),
        }))
      : builtInGroupKeys.map((id) => ({ id, label: builtInLabel(id) }));
  return [
    ...groups.filter((g) => g.id !== OTHER_GROUP_ID),
    { id: OTHER_GROUP_ID, label: builtInLabel(OTHER_GROUP_ID) },
  ];
}

/**
 * プロパティを表示するタブの識別子を返す
 *
 * 外部リソースでタブを指定したプロパティはその指定に従い，指定のないプロパティはアプリ内の分類に従う
 */
function groupsOf(
  resource: ServerPropertiesResource | undefined,
  key: string
): string[] {
  return (
    entryOf(resource, key)?.groups ??
    builtInGroupKeys.filter((g) => propertyClasses[g].includes(key))
  );
}

/**
 * タブに表示するプロパティの一覧を返す
 *
 * 並び順はアプリ内の分類の順とし，それ以外のプロパティは外部リソースでの定義順に後ろへ並べる。
 * 「その他」には，表示中のプロパティのうち，表示中のどのタブにも属さないものを表示する
 *
 * @param resource サーバープロパティの外部リソース
 * @param groupId タブの識別子
 * @param targetKeys 表示するワールド（または標準設定）のプロパティ名（「その他」の対象）
 * @returns タブに表示するプロパティ名
 */
export function getGroupProperties(
  resource: ServerPropertiesResource | undefined,
  groupId: string,
  targetKeys: string[]
): string[] {
  if (groupId === OTHER_GROUP_ID) {
    // 「その他」は予約されたタブのため，`groups` に `other` を指定したプロパティも「その他」に表示する
    const groupIds = new Set(
      getPropertyGroups(resource, '', () => '')
        .map((g) => g.id)
        .filter((id) => id !== OTHER_GROUP_ID)
    );
    return getCandidateProperties(resource, targetKeys).filter(
      (key) => !groupsOf(resource, key).some((g) => groupIds.has(g))
    );
  }

  const builtIn = (
    Object.hasOwn(propertyClasses, groupId) ? propertyClasses[groupId] : []
  ).filter((key) => groupsOf(resource, key).includes(groupId));
  const added = Object.keys(resource?.properties ?? {}).filter(
    (key) => !builtIn.includes(key) && groupsOf(resource, key).includes(groupId)
  );
  return [...builtIn, ...added];
}

/**
 * プロパティ画面に表示しうるプロパティ（表示中の値と，定義のあるプロパティ）を返す
 *
 * 値の無いプロパティも，入力欄を表示した時点で既定値が入る（タブや検索の対象を揃えるために使う）
 *
 * @param resource サーバープロパティの外部リソース
 * @param targetKeys 表示するワールド（または標準設定）のプロパティ名
 * @returns プロパティ名（表示中の値の順，その後ろに定義の順）
 */
export function getCandidateProperties(
  resource: ServerPropertiesResource | undefined,
  targetKeys: string[]
): string[] {
  const keys = [...targetKeys, ...Object.keys(resource?.properties ?? {})];
  return keys.filter((key, idx) => keys.indexOf(key) === idx);
}

/**
 * プロパティの値を，プロパティ画面で選んだ定義の型に合わせる
 *
 * バージョンによって型が異なるプロパティや，外部リソースの更新で型が変わったプロパティを，
 * 入力欄（トグル・数値欄・選択式など）で編集できるようにするために使う
 *
 * @param value 現在の値
 * @param type 選んだ定義の型
 * @returns 型に合わせた値（変換できない場合は元の値）
 */
export function convertPropertyValue(
  value: string | number | boolean,
  type: ServerPropertyType
): string | number | boolean {
  if (typeof value === type) return value;
  if (type === 'string') return String(value);
  if (typeof value !== 'string') return value;
  const converted = coercePropertyValue(value, type);
  return typeof converted === type ? converted : value;
}

/**
 * プロパティの説明文を返す
 *
 * 外部リソースの説明文を優先し，なければアプリ内（i18n）の説明文を使う
 *
 * @param resource サーバープロパティの外部リソース
 * @param key プロパティ名
 * @param locale 表示中の言語
 * @param builtIn アプリ内の説明文を返す関数（説明文がない場合は `undefined`）
 * @returns 説明文（どこにもなければ `undefined`）
 */
export function getPropertyDescription(
  resource: ServerPropertiesResource | undefined,
  key: string,
  locale: string,
  builtIn: (key: string) => string | undefined
): string | undefined {
  const remote = entryOf(resource, key)?.description;
  if (remote !== undefined) return resolveLocalizedText(remote, locale);
  return builtIn(key);
}
