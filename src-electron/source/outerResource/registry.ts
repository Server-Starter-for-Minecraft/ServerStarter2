import { api } from 'app/src-electron/core/api';
import { OuterResources } from 'app/src-electron/schema/outerResource';
import { isValid } from 'app/src-electron/util/error/error';
import { cachePath, OUTER_RESOURCE_BASE_URL } from '../const';
import {
  outerResourceKeys as keys,
  outerResourceDefinitions,
} from './definitions';
import { OuterResource, OuterResourceOptions } from './loader';

const options: OuterResourceOptions = {
  baseUrl: OUTER_RESOURCE_BASE_URL,
  cacheDir: cachePath.child('outerResources'),
};

/** 外部リソースの名前と，読み込み・保持する処理の対応（`outerResourceOf` で作る） */
type OuterResourceInstances = {
  [K in keyof OuterResources]?: OuterResource<unknown, OuterResources[K]>;
};
const instances: OuterResourceInstances = {};

/**
 * 外部リソースを読み込み・保持する処理を返す（定義は `definitions.ts` に登録する）
 *
 * 名前ごとに型が異なるため，一覧をまとめて作らずに名前ごとに作って保持する
 *
 * @param key 外部リソースの名前
 * @returns 外部リソースを読み込み・保持する処理（同じ名前には同じものを返す）
 */
function outerResourceOf<K extends keyof OuterResources>(
  key: K
): OuterResource<unknown, OuterResources[K]> {
  // 名前（K）に絞った型で扱うと，名前に対応する型のまま読み書きできる
  const cache: { [P in K]?: OuterResource<unknown, OuterResources[P]> } =
    instances;
  const cached = cache[key];
  if (cached !== undefined) return cached;
  const created = new OuterResource(outerResourceDefinitions[key], options);
  cache[key] = created;
  return created;
}

/**
 * 読み込み済みの外部リソースを，結果のオブジェクトに書き込む
 *
 * @param target 書き込む先
 * @param key 外部リソースの名前
 */
function assignLoaded<K extends keyof OuterResources>(
  target: { [P in K]?: OuterResources[P] },
  key: K
) {
  target[key] = outerResourceOf(key).current();
}

/**
 * 現在の外部リソースをすべて返す（フロントエンドからの要求に応じる）
 *
 * 配布元の取得は待たず，キャッシュまたは同梱の内容を返す。
 * 読み込みは必ず値を返すため，すべての外部リソースが含まれる（型の上では，読み込み前の値を表す Partial とする）
 */
export async function getOuterResources(): Promise<Partial<OuterResources>> {
  await Promise.all(keys.map(async (key) => outerResourceOf(key).get()));
  // 通知（UpdateOuterResources）と内容が前後しないよう，すべての外部リソースを同時点の内容で返す
  const resources: Partial<OuterResources> = {};
  for (const key of keys) assignLoaded(resources, key);
  return resources;
}

/**
 * 読み込み済みの外部リソースを返す（同期処理の中で使う）
 *
 * @param key 外部リソースの名前
 * @returns 外部リソースの内容（まだ読み込んでいない場合は `undefined`）
 */
export function getLoadedOuterResource<K extends keyof OuterResources>(
  key: K
): OuterResources[K] | undefined {
  return outerResourceOf(key).current();
}

/**
 * 配布元から外部リソースを取得し，1つでも更新できた場合はフロントエンドへ最新の内容を通知する
 *
 * 起動を遅らせないよう，完了を待たずに呼び出すこと。
 * 画面の準備前に通知した場合は届かないが，画面は準備後に `getOuterResources()` で最新の内容を取得する
 */
export async function refreshOuterResources(): Promise<void> {
  const results = await Promise.all(
    keys.map(async (key) => outerResourceOf(key).refresh())
  );
  if (results.some(isValid)) {
    api.send.UpdateOuterResources(await getOuterResources());
  }
}
