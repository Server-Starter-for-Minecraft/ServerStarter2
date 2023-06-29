import { CustomMapData } from 'app/src-electron/schema/filedata';
import { errorMessage } from 'app/src-electron/util/error/construct';
import { isError, isValid } from 'app/src-electron/util/error/error';
import { Failable } from 'app/src-electron/util/error/failable';
import { Path } from 'app/src-electron/util/path';
import { ZipFile } from 'app/src-electron/util/zipFile';
import { File } from 'unzipper';
import { unzipPath } from '../const';
import { WorldSettings, serverJsonFile } from './files/json';
import {
  SERVER_PROPERTIES_PATH,
  serverPropertiesFile,
} from './files/properties';
import { ServerProperties } from 'app/src-electron/schema/serverproperty';

const LEVEL_DAT = 'level.dat';

async function findLevelDatInZip(zip: ZipFile): Promise<Failable<File>> {
  // ZIP内に ( level.dat | */level.dat ) があった場合OK
  const levelDats = await zip.match(/^([^<>:;,?"*|/\\]+\/)?level\.dat$/);
  if (levelDats.length > 1) {
    return errorMessage.data.path.invalidContent.customMapZipWithMultipleLevelDat(
      {
        path: zip.path.path,
        innderPath: levelDats.map((x) => x.path),
      }
    );
  }
  if (levelDats.length === 0) {
    return errorMessage.data.path.invalidContent.invalidCustomMap({
      type: 'file',
      path: zip.path.path,
    });
  }
  return levelDats[0];
}

/** パスを受け適切なマップ形式だった場合CustomMapを返す */
export async function loadCustomMap(
  path: Path
): Promise<Failable<CustomMapData>> {
  const isDirectory = await path.isDirectory();

  if (isDirectory) {
    // ディレクトリの場合
    if (!path.child(LEVEL_DAT).exists())
      // /level.dat がない場合エラー
      return errorMessage.data.path.invalidContent.invalidCustomMap({
        type: isDirectory ? 'directory' : 'file',
        path: path.path,
      });
  } else {
    if (path.extname() !== '.zip') {
      // zipでないファイル場合エラー
      return errorMessage.data.path.invalidContent.invalidCustomMap({
        type: 'file',
        path: path.path,
      });
    }
    // zipの場合
    const zip = new ZipFile(path);

    // /level.dat が取得できない場合エラー
    const datFile = await findLevelDatInZip(zip);
    if (isError(datFile)) return datFile;
  }

  return {
    kind: 'map',
    path: path.path,
    isFile: !isDirectory,
  };
}

/**
 * CustomMapのデータでワールドを上書きする
 * cwdPath: サーバーの実行パス e.g. servers/MyServer
 */
export async function importCustomMap(
  mapData: CustomMapData,
  cwdPath: Path,
  settings: WorldSettings
): Promise<
  Failable<{
    settings: WorldSettings;
    properties?: ServerProperties;
  }>
> {
  const importer = mapData.isFile ? importCustomMapDir : importCustomMapZip;
  const properties = await importer(
    new Path(mapData.path),
    cwdPath.child(LEVEL_DAT)
  );
  if (isError(properties)) return properties;

  // ワールドのディレクトリ構造をvanillaとして扱う
  settings.directoryType = 'vanilla';
  return {
    settings,
    properties,
  };
}

/** CustomMapのデータでワールドを上書きする */
async function importCustomMapDir(
  sourcePath: Path,
  worldPath: Path
): Promise<ServerProperties | undefined> {
  await sourcePath.copyTo(worldPath);

  if (!sourcePath.child(SERVER_PROPERTIES_PATH).exists()) return;

  // ワールドデータ内部にserver.propertiesが存在する場合
  const props = await serverPropertiesFile.load(sourcePath);
  if (isError(props)) return;

  return props;
}

/** CustomMapのデータでワールドを上書きする */
async function importCustomMapZip(
  zipPath: Path,
  worldPath: Path
): Promise<Failable<ServerProperties | undefined>> {
  const zip = new ZipFile(zipPath);

  // zip内のlevel.datを探し、なかった/複数あった場合はエラー
  const datFile = await findLevelDatInZip(zip);
  if (isError(datFile)) return datFile;
  const innerPath = datFile.path;

  // 一時ディレクトリを削除
  await unzipPath.remove(true);

  // zipを一時パスに展開
  await zip.extract(unzipPath);

  // 展開したパス直下にserver.propertiesがあった場合読み込んでおく
  let props: ServerProperties | undefined = undefined;
  if (unzipPath.child(SERVER_PROPERTIES_PATH).exists()) {
    const p = await serverPropertiesFile.load(unzipPath);
    if (isValid(p)) props = p;
  }
  // ワールドデータ内部にserver.propertiesが存在する場合

  // 必要なデータを移動
  await unzipPath.child(innerPath).moveTo(worldPath);

  // 一時ディレクトリを削除
  await unzipPath.remove(true);

  return props;
}
