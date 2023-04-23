import { ForgeVersion } from 'app/src-electron/api/scheme';
import { VersionLoader } from './interface';
import { Failable, isFailure, isSuccess } from '../../../api/failable';
import { Path } from '../../utils/path/path';
import { getJavaComponent } from './vanilla';
import { BytesData } from '../../utils/bytesData/bytesData';
import * as cheerio from 'cheerio';
import { versionsPath } from '../const';
import { interactiveProcess } from '../../utils/subprocess';
import { readyJava } from '../../utils/java/java';
import { osPlatform } from '../../utils/os/os';

const forgeVersionsPath = versionsPath.child('forge');

const ForgeURL = 'https://files.minecraftforge.net/net/minecraftforge/forge/';

export const forgeVersionLoader: VersionLoader = {
  /** forgeのサーバーデータをダウンロード */
  async readyVersion(version: ForgeVersion) {
    // 適切なjavaのバージョンを取得
    const component = await getJavaComponent(version.id);
    if (isFailure(component)) return component;

    const versionPath = forgeVersionsPath.child(version.id);
    const serverCwdPath = versionPath;
    const jarpath = versionPath.child(`${version.type}-${version.id}.jar`);

    // 実行可能なファイル(jar/bat/sh)存在するかを確認し適切なコマンド引数を得る
    let programArguments = await getProgramArguments(serverCwdPath, jarpath);

    // 実行可能なファイルが存在しなかった場合
    if (isFailure(programArguments)) {
      // インストール
      const install = await installForgeVersion(version, versionPath, jarpath);

      // インストールに失敗した場合エラー
      if (isFailure(install)) return install;

      // 再び実行可能なファイル(jar/bat/sh)存在するかを確認し適切なコマンド引数を得る
      programArguments = await getProgramArguments(serverCwdPath, jarpath);

      // 実行可能なファイルが存在しなかった場合インストールに失敗したとみなしエラー
      if (isFailure(programArguments)) return programArguments;
    }

    return {
      programArguments,
      serverCwdPath,
      component,
    };
  },

  /** forgeのバージョンの一覧返す */
  getAllVersions: getAllForgeVersions,

  async defineLevelName(worldPath, serverCwdPath) {
    // サーバーのCWDからの相対パスでないと動かない
    const levelName = serverCwdPath
      .relativeto(worldPath.child('world'))
      .str()
      .replaceAll('\\', '/');
    return {
      levelName,
      args: [],
    };
  },
};

async function installForgeVersion(
  version: ForgeVersion,
  versionPath: Path,
  jarpath: Path
) {
  // versionフォルダを削除
  await versionPath.remove(true);

  const installerPath = versionPath.child(
    'forge-' + version.id + '-installer.jar'
  );

  // インストーラーのダウンロードURLを取得
  const serverURL = await getForgeDownloadUrl(version);

  // インストーラーを取得
  const serverData = await BytesData.fromURL(serverURL);
  if (isFailure(serverData)) return serverData;

  // インストーラーを保存
  await installerPath.write(serverData);

  // インストーラーを実行
  const installResult = await installForge(installerPath);
  if (isFailure(installResult)) return installResult;

  for (const file of await versionPath.iter()) {
    const filename = file.basename();

    // 生成されたjarのファイル名を変更 (jarを生成するバージョンだった場合)
    const match = filename.match(
      /(minecraft)?forge(-universal)?-[0-9\.-]+(-mc\d+)?(-universal)?.jar/
    );
    if (match) {
      await file.rename(jarpath);
      return;
    }
  }
}

async function getProgramArguments(serverCwdPath: Path, jarpath: Path) {
  // 1.17以降はrun.batが生成されるようになるのでその内容を解析して実行時引数を構成
  // TODO: osに応じてrun.shに対応
  if (osPlatform == 'windows-x64') {
    // windows
    const batPath = serverCwdPath.child('run.bat');
    if (batPath.exists()) {
      // 1.17.1以降
      return await getProgramArgumentsFromBat(batPath);
    }
  } else {
    // UNIX(macOS,linux)
    const shPath = serverCwdPath.child('run.sh');
    if (shPath.exists()) {
      // 1.17.1以降
      return await getProgramArgumentsFromSh(shPath);
    }
  }

  if (jarpath.exists()) return ['-jar', '"' + jarpath.absolute().str() + '"'];

  return new Error(
    `run.bat or run.sh or server jar file is needed in ${serverCwdPath.str()}`
  );
}

async function getProgramArgumentsFromBat(batPath: Path) {
  const data = await batPath.read();
  if (isFailure(data)) return data;

  // バッチフィルの中身を取得
  const txt = await data.text();

  for (const line of txt.split('\n')) {
    const pattern = /^\s*java @user_jvm_args\.txt ([^ ]+) %\*\s*$/;
    const match = line.match(pattern);
    if (match) {
      const arg = match[1];
      return [arg];
    }
  }
  return new Error('missing java command in run.bat file');
}

async function getProgramArgumentsFromSh(shPath: Path) {
  const data = await shPath.read();
  if (isFailure(data)) return data;

  // シェルスクリプトの中身を取得
  const txt = await data.text();

  for (const line of txt.split('\n')) {
    const pattern = /^\s*java @user_jvm_args\.txt ([^ ]+) "\$@"\s*$/;
    const match = line.match(pattern);
    if (match) {
      const arg = match[1];
      return [arg];
    }
  }
  return new Error('missing java command in run.sh file');
}

async function installForge(installerPath: Path): Promise<Failable<undefined>> {
  // TODO: forgeのインストール時に使用するjavaのバージョン17で大丈夫？
  // jre-legacyだとエラー出たのでとりあえずこれを使っている
  const javaPath = await readyJava('java-runtime-gamma', false);
  if (isFailure(javaPath)) return javaPath;

  const args = [
    '-jar',
    '"' + installerPath.absolute().str() + '"',
    '--installServer',
  ];

  console.log(
    javaPath.absolute().str(),
    args,
    installerPath.parent().absolute().str()
  );

  // インストール開始
  // -jar forge-*-installer.jar --installServer server
  const process = interactiveProcess(
    javaPath.absolute().str(),
    args,
    undefined,
    undefined,
    installerPath.parent().absolute().str(),
    true
  );
  return await process;
}

/** forgeのjarのダウンロードパスを返す 存在検証はしない */
export async function getForgeDownloadUrl(version: ForgeVersion) {
  return `https://maven.minecraftforge.net/net/minecraftforge/forge/${version.id}-${version.forge_version}/forge-${version.id}-${version.forge_version}-installer.jar`;
}

export async function getAllForgeVersions() {
  const indexPage = await BytesData.fromURL(ForgeURL);

  if (isFailure(indexPage)) return indexPage;

  const $ = cheerio.load(await indexPage.text());

  const ids: string[] = [];

  // TODO: Forgeのhtml構成が変わった瞬間終わるので対策を考えたい
  $('ul.section-content li.li-version-list ul li a').each((_, elem) => {
    const path = elem.attribs['href'];
    const match = path.match(/^index_([a-z0-9_\.-]+)\.html$/);
    console.group(path, match);
    if (match) ids.push(match[1]);
  });

  // 各バージョン後ごとの全ビルドを並列取得してflat化
  const versions = (await Promise.all(ids.map(scrapeForgeVersions)))
    .filter(isSuccess)
    .flatMap((x) => x);

  return versions;
}

const noInstallerVersionIds = new Set([
  '1.5.1',
  '1.5',
  '1.4.7',
  '1.4.6',
  '1.4.5',
  '1.4.4',
  '1.4.3',
  '1.4.2',
  '1.4.1',
  '1.4.0',
  '1.3.2',
  '1.2.5',
  '1.2.4',
  '1.2.3',
  '1.1',
]);

export async function scrapeForgeVersions(
  id: string
): Promise<Failable<ForgeVersion[]>> {
  if (noInstallerVersionIds.has(id))
    return new Error(`forge ${id} installer is not provided`);

  const versionUrl = `https://files.minecraftforge.net/net/minecraftforge/forge/index_${id}.html`;
  const page = await BytesData.fromURL(versionUrl);
  if (isFailure(page)) return page;

  const forge_versions: string[] = [];

  const $ = cheerio.load(await page.text());
  $('tbody > tr > td.download-version').each((_, elem) => {
    const element = $(elem);
    // 子要素を消して直接のテキストだけを取得
    element.children().remove();
    const path = element.text();
    if (typeof path === 'string') {
      forge_versions.push(path.trim());
    }
  });

  return forge_versions.map((forge_version) => ({
    id,
    forge_version,
    type: 'forge',
  }));
}
