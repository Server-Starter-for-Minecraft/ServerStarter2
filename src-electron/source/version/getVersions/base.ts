import { z, ZodType } from 'zod';
import { Failable } from 'app/src-electron/schema/error';
import { Path } from 'app/src-electron/util/binary/path';
import { isError, isValid } from 'app/src-electron/util/error/error';
import { JsonSourceHandler } from 'app/src-electron/util/wrapper/jsonFile';
import { AllVersion, Version, VersionType } from '../../../schema/version';
import { getVersionMainfest } from './manifest';

const ALL_VERSION_JSON_NAME = 'all.json';
export function getVersionCacheFilePath(
  cachePath: Path,
  verType: Version['type']
) {
  return cachePath.child(`${verType}/${ALL_VERSION_JSON_NAME}`);
}

/**
 * 各バージョン情報を収集する機能を集約する
 *
 * |関数名|説明|
 * |:---:|:---|
 * |`getFromCache()`  | 各サーバーのキャッシュデータである`all.json`からバージョン一覧を取得|
 * |`getFromURL()`    | リモートAPI（バニラは`version_manifest_v2.json`）からバージョン一覧を取得|
 * |`write4Cache(obj)`| 取得した一覧情報`obj`を`all.json`に保存し，そのHashデータは`versions/config.json`に保存する|
 */
export abstract class VersionListLoader<T extends VersionType> {
  protected cachePath: Path;
  protected allVersHandler: JsonSourceHandler<AllVersion<T>>;
  constructor(
    cachePath: Path,
    verType: Version['type'],
    T: ZodType<AllVersion<T>, z.ZodTypeDef, any>
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
  getFromCache(): Promise<Failable<AllVersion<T>>> {
    return this.allVersHandler.read();
  }
  /**
   * 外部データからバージョン一覧を取得する
   */
  abstract getFromURL(): Promise<Failable<AllVersion<T>>>;
  /**
   * 与えたオブジェクトをキャッシュに記録する
   */
  write4Cache(obj: AllVersion<T>): Promise<Failable<void>> {
    return this.allVersHandler.write(obj);
  }
  /**
   * HTMLから取得したID一覧をManifestに掲載の順番で並び替える
   *
   * cf) 処理工数がかかるため，不必要に実行しない
   */
  protected async sortIds(ids: string[]) {
    const manifest = await getVersionMainfest(this.cachePath, true);
    if (isError(manifest)) return;

    // Manifest掲載のバージョン順を取得
    const entries: [string, number][] = manifest.versions.map(
      (version, index) => [version.id, index]
    );
    const versionIndexMap = Object.fromEntries(entries);

    // 取得したバージョン順で`ids`を並び替え
    ids.sort((a, b) => versionIndexMap[a] - versionIndexMap[b]);
  }
}

/**
 * 各バージョンの一覧を返す
 *
 * 各バージョンは専用の`loader`を作成し，それをこの関数に与えることで適切な一覧を返すことができる
 */
export async function getVersionlist<T extends VersionType>(
  useCache: boolean,
  loader: VersionListLoader<T>
): Promise<Failable<AllVersion<T>>> {
  if (useCache) {
    const cacheRes = await loader.getFromCache();
    if (isValid(cacheRes)) return cacheRes;
  }

  // cacheを利用しなかった or cacheの読み取りに失敗した 場合はURLからデータを取得
  const allVers = await loader.getFromURL();
  if (isError(allVers)) return allVers;

  // 結果を各サーバーのバージョン一覧（`all.json`）に保存
  const writeAllJsonRes = await loader.write4Cache(allVers);
  if (isError(writeAllJsonRes)) return writeAllJsonRes;

  // TODO: v2版のloggerに登録？
  // logger.success('load from remote');
  return allVers;
}
