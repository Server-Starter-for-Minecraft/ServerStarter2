import { api } from 'app/src-electron/core/api';
import { OuterResources } from 'app/src-electron/schema/outerResource';
import { isValid } from 'app/src-electron/util/error/error';
import { cachePath, OUTER_RESOURCE_BASE_URL } from '../const';
import type { OuterResourceDefinition } from './definition';
import {
  outerResourceKeys as keys,
  outerResourceDefinitions,
} from './definitions';
import { OuterResource, OuterResourceOptions } from './loader';

const options: OuterResourceOptions = {
  baseUrl: OUTER_RESOURCE_BASE_URL,
  cacheDir: cachePath.child('outerResources'),
};

/** アプリで使う外部リソース（定義は `definitions.ts` に登録する） */
const outerResources = Object.fromEntries(
  keys.map((key) => [
    key,
    // 定義と外部リソースの型の対応は `outerResourceDefinitions` の型で保証している
    new OuterResource(
      outerResourceDefinitions[key] as OuterResourceDefinition<
        unknown,
        unknown
      >,
      options
    ),
  ])
) as unknown as {
  [K in keyof OuterResources]: OuterResource<unknown, OuterResources[K]>;
};

/**
 * 現在の外部リソースをすべて返す（フロントエンドからの要求に応じる）
 *
 * 配布元の取得は待たず，キャッシュまたは同梱の内容を返す
 */
export async function getOuterResources(): Promise<OuterResources> {
  await Promise.all(keys.map((key) => outerResources[key].get()));
  // 通知（UpdateOuterResources）と内容が前後しないよう，すべての外部リソースを同時点の内容で返す
  return Object.fromEntries(
    keys.map((key) => [key, outerResources[key].current()])
  ) as OuterResources;
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
  return outerResources[key].current();
}

/**
 * 配布元から外部リソースを取得し，1つでも更新できた場合はフロントエンドへ最新の内容を通知する
 *
 * 起動を遅らせないよう，完了を待たずに呼び出すこと。
 * 画面の準備前に通知した場合は届かないが，画面は準備後に `getOuterResources()` で最新の内容を取得する
 */
export async function refreshOuterResources(): Promise<void> {
  const results = await Promise.all(
    keys.map((key) => outerResources[key].refresh())
  );
  if (results.some(isValid)) {
    api.send.UpdateOuterResources(await getOuterResources());
  }
}
