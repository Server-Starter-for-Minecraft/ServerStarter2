import { CustomMapData } from 'app/src-electron/schema/filedata';
import { errorMessage } from 'app/src-electron/util/error/construct';
import { isError, isValid } from 'app/src-electron/util/error/error';
import { Failable } from 'app/src-electron/util/error/failable';
import { Path } from 'app/src-electron/util/path';
import { ZipFile } from 'app/src-electron/util/zipFile';
import { File } from 'unzipper';
import { LEVEL_NAME, unzipPath } from '../const';
import { WorldSettings } from './files/json';
import {
  SERVER_PROPERTIES_PATH,
  serverPropertiesFile,
} from './files/properties';
import { ServerProperties } from 'app/src-electron/schema/serverproperty';
import { BytesData } from 'app/src-electron/util/bytesData';
import { LevelDat } from './misc/levelDat';

const LEVEL_DAT = 'level.dat';

async function findLevelDatInZip(zip: ZipFile): Promise<Failable<File>> {
  // ZIP内に ( level.dat | */level.dat ) があった場合OK
  const levelDats = await zip.match(/^([^<>:;,?"*|/\\]+\/)?level\.dat$/);
  if (isError(levelDats)) return levelDats;
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

async function findIconPngInZip(zip: ZipFile): Promise<File | undefined> {
  // ZIP内に ( icon.png | */icon.png ) があった場合OK
  const levelDats = await zip.match(/^([^<>:;,?"*|/\\]+\/)?icon\.png$/);
  if (isError(levelDats)) return undefined;
  return levelDats[0];
}

/** パスを受け適切なマップ形式だった場合CustomMapを返す */
export async function loadCustomMap(
  path: Path
): Promise<Failable<CustomMapData>> {
  const isDirectory = await path.isDirectory();

  /** level.dat の内容 */
  let dat: Failable<BytesData>;

  /** icon.png の内容 */
  let icon: BytesData | undefined;

  if (isDirectory) {
    // ディレクトリの場合

    // level.dat の読み込み
    const datPath = path.child(LEVEL_DAT);
    if (!datPath.exists()) {
      // /level.dat がない場合エラー
      return errorMessage.data.path.invalidContent.invalidCustomMap({
        type: isDirectory ? 'directory' : 'file',
        path: path.path,
      });
    }
    dat = await BytesData.fromPath(datPath);

    // /icon.pngを読み込み
    const iconPath = path.child('icon.png');
    const iconData = await iconPath.read();
    icon = isValid(iconData) ? iconData : undefined;
  } else {
    // zipの場合
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

    dat = await BytesData.fromBuffer(await datFile.buffer());

    // /icon.pngを読み込み
    const iconFile = await findIconPngInZip(zip);
    if (iconFile !== undefined) {
      dat = await BytesData.fromBuffer(await iconFile.buffer());
    }
  }

  if (isError(dat)) return dat;
  const datContent = await dat.nbt<LevelDat>('gzip');
  if (isError(datContent)) return datContent;

  const iconURI = await icon?.encodeURI('image/png');

  return {
    kind: 'map',
    path: path.path,
    levelName: datContent.Data.LevelName,
    versionName: datContent.Data.Version.Name,
    icon: iconURI,
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
  const importer = mapData.isFile ? importCustomMapZip : importCustomMapDir;
  const properties = await importer(
    new Path(mapData.path),
    cwdPath.child(LEVEL_NAME)
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
  const extracted = await zip.extract(unzipPath);

  // zipの展開失敗したらエラー
  if (isError(extracted)) return extracted;

  // 展開したパス直下にserver.propertiesがあった場合読み込んでおく
  let props: ServerProperties | undefined = undefined;
  if (unzipPath.child(SERVER_PROPERTIES_PATH).exists()) {
    const p = await serverPropertiesFile.load(unzipPath);
    if (isValid(p)) props = p;
  }
  // ワールドデータ内部にserver.propertiesが存在する場合

  // ワールドデータを移動
  await unzipPath.child(innerPath).parent().moveTo(worldPath);

  // ワールド以外のデータ(readmeとか?)も可能であれば移動
  if (unzipPath.exists()) {
    const targetPath = worldPath.parent().child(zipPath.stemname());
    if (!targetPath.exists()) {
      await unzipPath.moveTo(targetPath);
    }
  }

  // 一時ディレクトリを削除
  await unzipPath.remove(true);

  return props;
}
