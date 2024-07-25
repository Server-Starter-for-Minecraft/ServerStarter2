import { z, ZodType } from 'zod';
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
import { Result } from '../../../util/base';

const ALL_VERSION_JSON_NAME = 'all.json';
export function getVersionCacheFilePath(
  cachePath: Path,
  verType: Version['type']
) {
  return cachePath.child(`${verType}/${ALL_VERSION_JSON_NAME}`);
}

const AllVerison = z.union([
  AllVanillaVersion,
  AllSpigotVersion,
  AllPapermcVersion,
  AllForgeVersion,
  AllMohistmcVersion,
  AllFabricVersion,
]);
type AllVerison = z.infer<typeof AllVerison>;

/**
 * 各バージョン情報を収集する機能を集約する
 *
 * |関数名|説明|
 * |:---:|:---|
 * |`getFromCache()`  | 各サーバーのキャッシュデータである`all.json`からバージョン一覧を取得|
 * |`getFromURL()`    | リモートAPI（バニラは`version_manifest_v2.json`）からバージョン一覧を取得|
 * |`write4Cache(obj)`| 取得した一覧情報`obj`を`all.json`に保存し，そのHashデータは`versions/config.json`に保存する|
 */
export abstract class VersionListLoader<T extends AllVerison> {
  protected cachePath: Path;
  protected allVersHandler: JsonSourceHandler<T>;
  constructor(
    cachePath: Path,
    verType: Version['type'],
    T: ZodType<T, z.ZodTypeDef, any>
  ) {
    this.cachePath = cachePath;
    this.allVersHandler = JsonSourceHandler.fromPath(
      getVersionCacheFilePath(cachePath, verType),
      T
    );
  }
  /**
   * キャッシュデータからバージョン一覧を取得する
   */
  getFromCache(): Promise<Result<T>> {
    return this.allVersHandler.read();
  }
  /**
   * 外部データからバージョン一覧を取得する
   */
  abstract getFromURL(): Promise<Result<T>>;
  /**
   * 与えたオブジェクトをキャッシュに記録する
   */
  write4Cache(obj: T): Promise<Result<void>> {
    return this.allVersHandler.write(obj);
  }
}

/**
 * 各バージョンの一覧を返す
 *
 * 各バージョンは専用の`loader`を作成し，それをこの関数に与えることで適切な一覧を返すことができる
 */
export async function getVersionlist<T extends AllVerison>(
  useCache: boolean,
  loader: VersionListLoader<T>
): Promise<Result<T>> {
  if (useCache) {
    const cacheRes = await loader.getFromCache();
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
  const writeAllJsonRes = await loader.write4Cache(allVers.value());
  if (writeAllJsonRes.isErr) return writeAllJsonRes;

  // TODO: v2版のloggerに登録？
  // logger.success('load from remote');
  return allVers;
}
