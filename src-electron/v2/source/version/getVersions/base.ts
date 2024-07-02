import { versionsCachePath } from 'app/src-electron/v2/core/const';
import {
  AllFabricVersion,
  AllForgeVersion,
  AllMohistmcVersion,
  AllPapermcVersion,
  AllSpigotVersion,
  AllVanillaVersion,
  Version,
} from '../../../schema/version';
import { err, Result } from '../../../util/base';
import {
  getFromGeneralVerConfig,
  getVerListHash,
  writeVersionListHash,
} from './config';

const ALL_VERSION_JSON_NAME = 'all.json';
export function getVersionCacheFilePath(verType: Version['type']) {
  return versionsCachePath.child(`${verType}/${ALL_VERSION_JSON_NAME}`);
}

export type AllVerison =
  | AllVanillaVersion
  | AllSpigotVersion
  | AllPapermcVersion
  | AllForgeVersion
  | AllMohistmcVersion
  | AllFabricVersion;

/**
 * 各バージョン情報を収集する機能を集約する
 *
 * |関数名|説明|
 * |:---:|:---|
 * |`getFromCache()`  | 各サーバーのキャッシュデータである`all.json`からバージョン一覧を取得|
 * |`getFromURL()`    | リモートAPI（バニラは`version_manifest_v2.json`）からバージョン一覧を取得|
 * |`write4Cache(obj)`| 取得した一覧情報`obj`を`all.json`に保存し，そのHashデータは`versions/config.json`に保存する|
 */
export interface VersionListLoader<T extends AllVerison> {
  getFromCache: () => Promise<Result<T>>;
  getFromURL: () => Promise<Result<T>>;
  write4Cache: (obj: T) => Promise<Result<void>>;
}

/**
 * 各バージョンの一覧を返す
 *
 * 各バージョンは専用の`loader`を作成し，それをこの関数に与えることで適切な一覧を返すことができる
 */
export async function getVersionlist<T extends AllVerison>(
  verType: Version['type'],
  useCache: boolean,
  loader: VersionListLoader<T>
): Promise<Result<T>> {
  const cacheRes = await checkHashVer(verType, useCache, loader);
  if (cacheRes.isOk) {
    return cacheRes;
  }

  // cacheを利用しなかった or cacheの読み取りに失敗した 場合はURLからデータを取得
  const allVers = await loader.getFromURL();
  if (allVers.isErr) {
    return allVers;
  }

  // 結果を各サーバーのバージョン一覧（`all.json`）に保存
  loader.write4Cache(allVers.value());
  // `all.json`のHash値を設定ファイルに保存
  writeVersionListHash(verType, allVers.value());

  // TODO: v2版のloggerに登録？
  // logger.success('load from remote');
  return allVers;
}

/**
 * キャッシュを用いてデータを取得して問題ないか確認し，
 * 問題がない場合は一覧データを返す
 */
async function checkHashVer<T extends AllVerison>(
  verType: Version['type'],
  useCache: boolean,
  loader: VersionListLoader<T>
): Promise<Result<T>> {
  if (!useCache) {
    return err(new Error('CACHE_WILL_NOT_USE'));
  }

  const cacheVers = await loader.getFromCache();
  if (cacheVers.isErr) {
    return cacheVers;
  }

  const versHash = await getVerListHash(cacheVers.value());
  if (versHash.isErr) {
    return versHash;
  }

  const versConfig = await getFromGeneralVerConfig();
  if (versConfig.isErr) {
    return versConfig;
  }

  if (versConfig.value().versions_sha1?.[verType] === versHash.value()) {
    return cacheVers;
  } else {
    return err(new Error('NOT_MATCHED_VERSION_LIST_HASH'));
  }
}