// Vitest は `src/` のエイリアスを持たないため，テストからも読み込めるよう `app/` 経由で参照する
import { resolveLocalizedText } from 'app/src/i18n/utils/localizedText';
import type {
  MinecraftVersionRange,
  ServerPropertyDefinitions,
  ServerPropertyDefinitionV1,
  ServerPropertyEntryV1,
} from 'app/src-electron/schema/outerResource/serverProperties';
import type { ServerPropertyAnnotation } from 'app/src-electron/schema/serverproperty';
import { pGroupKey, propertyClasses } from './classifications';

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

/**
 * バージョンの新しさを表す順位を返す（0 が最新。値が大きいほど古い）
 *
 * 一覧に無いバージョンは，一覧の更新より後に公開された新しいバージョンとみなして最新より新しい順位（-1）を返す
 */
function versionRank(order: VersionOrder, versionId: string): number {
  return order.indexOf(versionId);
}

/** 範囲の新しい側の端の順位（上限がない場合は -∞） */
function upperRank(order: VersionOrder, range?: MinecraftVersionRange) {
  return range?.to === undefined ? -Infinity : versionRank(order, range.to);
}

/** 範囲の古い側の端の順位（下限がない場合は +∞） */
function lowerRank(order: VersionOrder, range?: MinecraftVersionRange) {
  return range?.from === undefined ? Infinity : versionRank(order, range.from);
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
 * @param entry プロパティの定義
 * @param versionId ワールドの Minecraft のバージョン（不明な場合やワールドに依らない場合は `undefined` とし，最新の定義を使う）
 * @param order 新しい順に並べたバージョン ID の一覧
 * @returns 使う定義
 */
export function selectPropertyDefinition(
  entry: ServerPropertyEntryV1,
  versionId: string | undefined,
  order: VersionOrder
): ServerPropertyDefinitionV1 {
  // バージョンが不明な場合は，どのバージョンよりも新しいものとして扱う
  const rank = versionId === undefined ? -1 : versionRank(order, versionId);
  const { definitions } = entry;

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
 * @param definitions サーバープロパティの定義
 * @param key プロパティ名
 * @param versionId ワールドの Minecraft のバージョン（ワールドに依らない場合は `undefined`）
 * @param order 新しい順に並べたバージョン ID の一覧
 * @returns 注釈（定義のないプロパティは自由入力の文字列）
 */
export function getPropertyAnnotation(
  definitions: ServerPropertyDefinitions | undefined,
  key: string,
  versionId: string | undefined,
  order: VersionOrder
): ServerPropertyAnnotation {
  const entry = definitions?.[key];
  if (entry === undefined) return FALLBACK_ANNOTATION;
  // バージョンの範囲は注釈に含めない
  const { minecraftVersion, ...annotation } = selectPropertyDefinition(
    entry,
    versionId,
    order
  );
  return annotation;
}

/**
 * ワールドのバージョンでは廃止されたプロパティか
 *
 * 廃止されたプロパティは，server.properties に無い場合に既定値で補わない
 *
 * @param entry プロパティの定義
 * @param versionId ワールドの Minecraft のバージョン（ワールドに依らない場合は `undefined` とし，廃止とはみなさない）
 * @param order 新しい順に並べたバージョン ID の一覧
 */
export function isRemovedProperty(
  entry: ServerPropertyEntryV1 | undefined,
  versionId: string | undefined,
  order: VersionOrder
): boolean {
  if (entry?.removedIn === undefined || versionId === undefined) return false;
  return versionRank(order, versionId) <= versionRank(order, entry.removedIn);
}

/** アプリが知っているタブか */
function isGroupKey(group: string): group is pGroupKey {
  return group in propertyClasses;
}

/**
 * タブに表示するプロパティの一覧を返す
 *
 * 外部リソースでタブが指定されたプロパティはその指定に従い，指定のないプロパティはアプリ内の分類に従う。
 * 並び順はアプリ内の分類の順とし，外部リソースで追加されたプロパティはその後ろに並べる
 *
 * @param definitions サーバープロパティの定義
 * @param group タブ（「その他」は分類されていないプロパティを表示するため対象外）
 * @returns タブに表示するプロパティ名
 */
export function getGroupProperties(
  definitions: ServerPropertyDefinitions | undefined,
  group: Exclude<pGroupKey, 'other'>
): string[] {
  /** 外部リソースで指定された，アプリが知っているタブ（指定がなければ `undefined`） */
  const remoteGroups = (key: string) =>
    definitions?.[key]?.groups?.filter(isGroupKey);

  const builtIn = propertyClasses[group].filter(
    (key) => remoteGroups(key)?.includes(group) ?? true
  );
  const added = Object.keys(definitions ?? {}).filter(
    (key) => !builtIn.includes(key) && remoteGroups(key)?.includes(group)
  );
  return [...builtIn, ...added];
}

/**
 * いずれかのタブ（「その他」を除く）に分類されたプロパティか
 *
 * @param definitions サーバープロパティの定義
 * @param key プロパティ名
 */
export function isClassifiedProperty(
  definitions: ServerPropertyDefinitions | undefined,
  key: string
): boolean {
  const groups = Object.keys(propertyClasses).filter(
    (g): g is Exclude<pGroupKey, 'other'> => g !== 'other'
  );
  return groups.some((g) => getGroupProperties(definitions, g).includes(key));
}

/**
 * プロパティの説明文を返す
 *
 * 外部リソースの説明文を優先し，なければアプリ内（i18n）の説明文を使う
 *
 * @param definitions サーバープロパティの定義
 * @param key プロパティ名
 * @param locale 表示中の言語
 * @param builtIn アプリ内の説明文を返す関数（説明文がない場合は `undefined`）
 * @returns 説明文（どこにもなければ `undefined`）
 */
export function getPropertyDescription(
  definitions: ServerPropertyDefinitions | undefined,
  key: string,
  locale: string,
  builtIn: (key: string) => string | undefined
): string | undefined {
  const remote = definitions?.[key]?.description;
  if (remote !== undefined) return resolveLocalizedText(remote, locale);
  return builtIn(key);
}
