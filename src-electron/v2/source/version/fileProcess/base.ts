import { versionsCachePath } from 'app/src-electron/v2/core/const';
import { Runtime } from '../../../schema/runtime';
import { UnknownVersion, Version } from '../../../schema/version';
import { Result } from '../../../util/base';
import { Path } from '../../../util/binary/path';

/**
 * サーバーの本体ファイルであるJarの設置と削除を担当する
 *
 * setVersionFile()でデータを取得した際はremoveVersionFile()が走るときに取得したデータをキャッシュに格納する
 * （`libraries`はJarの実行によって生成されたものをコピーする形式とし，事前ダウンロードはしない）
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
  removeVersionFile: (version: V, path: Path) => Promise<Result<void>>;
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
export function getCacheVerFolderPath(version: UnknownVersion): undefined;
export function getCacheVerFolderPath(
  version: Exclude<Version, UnknownVersion>
): Path;
export function getCacheVerFolderPath(version: Version): Path | undefined;
export function getCacheVerFolderPath<V extends Version>(version: V) {
  return version.type === 'unknown'
    ? undefined
    : versionsCachePath.child(`${version.type}/${version.id}`);
}
