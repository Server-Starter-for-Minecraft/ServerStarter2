import { Path } from 'app/src-electron/v2/util/binary/path';
import { JsonSourceHandler } from 'app/src-electron/v2/util/wrapper/jsonFile';
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

const ALL_VERSION_JSON_NAME = 'all.json';
export function getVersionCacheFilePath(
  cachePath: Path,
  verType: Version['type']
) {
  return cachePath.child(`${verType}/${ALL_VERSION_JSON_NAME}`);
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
  getFromCache: (cachePath: Path) => Promise<Result<T>>;
  getFromURL: () => Promise<Result<T>>;
  write4Cache: (cachePath: Path, obj: T) => Promise<Result<void>>;
}

/**
 * 各バージョンの一覧を返す
 *
 * 各バージョンは専用の`loader`を作成し，それをこの関数に与えることで適切な一覧を返すことができる
 */
export async function getVersionlist<T extends AllVerison>(
  cachePath: Path,
  useCache: boolean,
  loader: VersionListLoader<T>
): Promise<Result<T>> {
  if (useCache) {
    const cacheRes = await loader.getFromCache(cachePath);
    if (cacheRes.isOk) {
      return cacheRes;
    }
  }

  // cacheを利用しなかった or cacheの読み取りに失敗した 場合はURLからデータを取得
  const allVers = await loader.getFromURL();
  if (allVers.isErr) {
    return allVers;
  }

  // 結果を各サーバーのバージョン一覧（`all.json`）に保存
  const writeAllJsonRes = await loader.write4Cache(cachePath, allVers.value());
  if (writeAllJsonRes.isErr) return writeAllJsonRes;

  // TODO: v2版のloggerに登録？
  // logger.success('load from remote');
  return allVers;
}

/**
 * `getFromCache()`における取得処理を共通化して宣言する
 *
 * 当該サーバーの`all.json`がある場合は，このキャッシュデータを読み取る，
 */
export async function getFromCacheBase<T>(
  cachePath: Path,
  verType: Version['type'],
  handler: JsonSourceHandler<T>
): Promise<Result<T>> {
  if (!getVersionCacheFilePath(cachePath, verType).exists()) {
    return err(new Error(`NOT_FOUND_VERSION_LIST_(${verType.toUpperCase()})`));
  }
  return handler.read();
}
