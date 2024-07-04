import { versionsCachePath } from 'app/src-electron/v2/core/const';
import { Runtime } from '../../../schema/runtime';
import { Version } from '../../../schema/version';
import { Result } from '../../../util/base';
import { Path } from '../../../util/binary/path';

/**
 * サーバーの本体ファイルであるJarの設置と削除を担当する
 */
export interface ServerVersionFileProcess<V extends Version> {
  setVersionFile: (
    version: V,
    path: Path,
    readyRuntime: (runtime: Runtime) => Promise<Result<void>>
  ) => Promise<
    Result<{
      runtime: Runtime;
      getCommand: (option: { jvmArgs: string[] }) => string[];
    }>
  >;
  removeVersionFile: (path: Path) => Promise<Result<void>>;
}

/**
 * サーバーJarファイルのパスを返す
 */
export function getJarPath(cwdPath: Path) {
  return cwdPath.child('version.jar');
}

/**
 * 当該バージョンのキャッシュデータを保持するディレクトリを返す
 * 
 * unknown versionの時には`undefined`を返す
 */
export function getCacheVerFolderPath(version: Version) {
  if (version.type === 'unknown') {
    return undefined;
  }
  return versionsCachePath.child(`${version.type}/${version.id}`);
}
