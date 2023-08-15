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
import { LevelDat } from './misc/levelDat';
import { BytesData } from 'app/src-electron/util/bytesData';
import { modFiles } from './files/addtional/mod';
import { asyncMap } from 'app/src-electron/util/objmap';
import { pluginFiles } from './files/addtional/plugin';
import { datapackFiles } from './files/addtional/datapack';

const LEVEL_DAT = 'level.dat';

async function findLevelDatInZip(
  zip: ZipFile
): Promise<Failable<[string, BytesData]>> {
  // ZIP内に ( level.dat | */level.dat ) があった場合OK
  const levelDats = await zip.match(/^([^<>:;,?"*|/\\]+\/)?level\.dat$/);
  if (isError(levelDats)) return levelDats;
  const keys = Object.keys(levelDats);
  if (keys.length > 1) {
    return errorMessage.data.path.invalidContent.customMapZipWithMultipleLevelDat(
      {
        path: zip.path.path,
        innderPath: keys,
      }
    );
  }
  if (keys.length === 0) {
    return errorMessage.data.path.invalidContent.invalidCustomMap({
      type: 'file',
      path: zip.path.path,
    });
  }
  const [path, filedata] = Object.entries(levelDats)[0];
  if (isError(filedata)) return filedata;
  return [path, filedata];
}

async function findIconPngInZip(zip: ZipFile): Promise<Failable<BytesData>> {
  // ZIP内に ( icon.png | */icon.png ) があった場合OK
  const pngs = await zip.match(/^([^<>:;,?"*|/\\]+\/)?icon\.png$/);
  if (isError(pngs)) return pngs;
  return Object.values(pngs)[0];
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

    dat = await datFile[1];

    // /icon.pngを読み込み
    const iconFile = await findIconPngInZip(zip);
    if (isValid(iconFile)) {
      dat = iconFile;
    }
  }

  if (isError(dat)) return dat;
  const datContent = await dat.nbt<LevelDat>();
  if (isError(datContent)) return datContent;

  const iconURI = await icon?.encodeURI('image/png');

  return {
    kind: 'map',
    path: path.path,
    levelName: datContent.Data.LevelName,
    versionName: datContent.Data.Version.Name,
    icon: iconURI,
    isFile: !isDirectory,
    lastPlayed: datContent.Data.LastPlayed,
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
  await Promise.all([
    // ディレクトリをコピー
    sourcePath.copyTo(worldPath),
    // シングルプレイで使用していたmod/plugin/datapackをキャッシュに追加
    cacheLocalMods(sourcePath),
    cacheLocalPlugins(sourcePath),
    cacheLocalDatapacks(sourcePath),
  ]);

  if (!sourcePath.child(SERVER_PROPERTIES_PATH).exists()) return;

  // ワールドデータ内部にserver.propertiesが存在する場合
  const props = await serverPropertiesFile.load(sourcePath);
  if (isError(props)) return;

  return props;
}

/** ローカルで使われていたであろうMOD一覧をキャッシュにコピー */
async function cacheLocalMods(sourcePath: Path): Promise<void> {
  const paths = await sourcePath.parent(2).child('mods').iter();
  const mods = (await asyncMap(paths, modFiles.loadNew)).filter(isValid);
  await asyncMap(mods, modFiles.appendCache);
}

/** ローカルで使われていたであろうPlugin一覧をキャッシュにコピー */
async function cacheLocalPlugins(sourcePath: Path): Promise<void> {
  const paths = await sourcePath.parent(2).child('plugins').iter();
  const plugins = (await asyncMap(paths, pluginFiles.loadNew)).filter(isValid);
  await asyncMap(plugins, pluginFiles.appendCache);
}

/** ローカルで使われていたであろうDatapack一覧をキャッシュにコピー */
async function cacheLocalDatapacks(sourcePath: Path): Promise<void> {
  const paths = await sourcePath.child('datapacks').iter();
  const datapacks = (await asyncMap(paths, datapackFiles.loadNew)).filter(
    isValid
  );
  await asyncMap(datapacks, datapackFiles.appendCache);
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
  const innerPath = datFile[0];

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
