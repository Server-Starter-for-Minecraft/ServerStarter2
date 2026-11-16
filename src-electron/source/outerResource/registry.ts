import { api } from 'app/src-electron/core/api';
import { OuterResources } from 'app/src-electron/schema/outerResource';
import { isValid } from 'app/src-electron/util/error/error';
import { cachePath, OUTER_RESOURCE_BASE_URL } from '../const';
import { OuterResource, OuterResourceOptions } from './loader';
import { donationDefinition } from './resources/donation';

const options: OuterResourceOptions = {
  baseUrl: OUTER_RESOURCE_BASE_URL,
  cacheDir: cachePath.child('outerResources'),
};

/**
 * アプリで使う外部リソースの一覧
 *
 * 外部リソースを追加する場合は，`OuterResources` 型に追加したうえで，ここに定義を登録する
 */
const outerResources: {
  [K in keyof OuterResources]: OuterResource<unknown, OuterResources[K]>;
} = {
  donation: new OuterResource(donationDefinition, options),
};

/** 外部リソースの名前の一覧 */
const keys = Object.keys(outerResources) as (keyof OuterResources)[];

/**
 * 現在の外部リソースをすべて返す（フロントエンドからの要求に応じる）
 *
 * 配布元の取得は待たず，キャッシュまたは同梱の内容を返す
 */
export async function getOuterResources(): Promise<OuterResources> {
  const entries = await Promise.all(
    keys.map(async (key) => [key, await outerResources[key].get()] as const)
  );
  return Object.fromEntries(entries) as OuterResources;
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
