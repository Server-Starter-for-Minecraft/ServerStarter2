import { CustomMapData } from 'app/src-electron/schema/filedata';
import { errorMessage } from 'app/src-electron/util/error/construct';
import { Failable } from 'app/src-electron/util/error/failable';
import { Path } from 'app/src-electron/util/path';
import { ZipFile } from 'app/src-electron/util/zipFile';

const LEVEL_DAT = 'level.dat';

/** パスを受け適切なマップ形式だった場合CustomMapを返す */
export async function loadCustomMap(
  path: Path
): Promise<Failable<CustomMapData>> {
  let hasLevelDat: boolean;
  const isDirectory = await path.isDirectory();

  if (isDirectory) {
    // ディレクトリの場合
    hasLevelDat = path.child(LEVEL_DAT).exists();
  } else {
    if (path.extname() !== '.zip') {
      // zipでないファイル場合
      return errorMessage.data.path.invalidContent.invalidCustomMap({
        type: 'file',
        path: path.path,
      });
    }
    // zipの場合
    const zip = new ZipFile(path);
    // ZIP内に ( level.dat | */level.dat ) があった場合OK
    const levelDats = await zip.match(/^([^<>:;,?"*|/\\]+\/)?level\.dat$/);
    if (levelDats.length > 1) {
      return errorMessage.data.path.invalidContent.customMapZipWithMultipleLevelDat(
        {
          path: path.path,
          innderPath: levelDats.map((x) => x.path),
        }
      );
    }
    hasLevelDat = levelDats.length > 0;
  }

  if (!hasLevelDat)
    return errorMessage.data.path.invalidContent.invalidCustomMap({
      type: isDirectory ? 'directory' : 'file',
      path: path.path,
    });

  return {
    kind: 'map',
    path: path.path,
    isFile: !isDirectory,
  };
}
