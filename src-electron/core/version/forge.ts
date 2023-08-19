import { AllForgeVersion, ForgeVersion } from 'src-electron/schema/version';
import {
  VersionComponent,
  VersionLoader,
  genGetAllVersions,
  needEulaAgreementVanilla,
} from './base';
import { Failable } from '../../util/error/failable';
import { Path } from '../../util/path';
import { getJavaComponent } from './vanilla';
import { BytesData } from '../../util/bytesData';
import * as cheerio from 'cheerio';
import { versionsCachePath } from '../const';
import { interactiveProcess } from '../../util/subprocess';
import { readyJava } from '../../util/java/java';
import { osPlatform } from '../../util/os';
import { isError, isValid } from 'app/src-electron/util/error/error';
import { errorMessage } from 'app/src-electron/util/error/construct';
import { GroupProgressor } from '../progress/progress';

const forgeVersionsPath = versionsCachePath.child('forge');

const ForgeURL = 'https://files.minecraftforge.net/net/minecraftforge/forge/';

export const forgeVersionLoader: VersionLoader<ForgeVersion> = {
  /** forgeのサーバーデータをダウンロード */
  async readyVersion(
    version: ForgeVersion,
    cwdPath: Path,
    progress?: GroupProgressor
  ): Promise<Failable<VersionComponent>> {
    progress?.title({
      key: 'server.readyVersion.title',
      args: { version: version },
    });
    // 適切なjavaのバージョンを取得
    const component = await getJavaComponent(version.id);
    if (isError(component)) return component;

    const jarpath = cwdPath.child(`${version.type}-${version.id}.jar`);

    // 実行可能なファイル(jar/bat/sh)存在するかを確認し適切なコマンド引数を得る
    let programArguments = await getProgramArguments(cwdPath, jarpath);

    // 実行可能なファイルが存在しなかった場合
    if (isError(programArguments)) {
      // インストール
      const r = progress?.subtitle({
        key: 'server.readyVersion.forge.readyServerData',
      });
      const install = await installForgeVersion(version, cwdPath, jarpath);
      r?.delete();

      // インストールに失敗した場合エラー
      if (isError(install)) return install;

      // 再び実行可能なファイル(jar/bat/sh)存在するかを確認し適切なコマンド引数を得る
      programArguments = await getProgramArguments(cwdPath, jarpath);
      console.log(programArguments);

      // 実行可能なファイルが存在しなかった場合インストールに失敗したとみなしエラー
      if (isError(programArguments)) return programArguments;
    }

    return {
      programArguments,
      component,
    };
  },

  /** forgeのバージョンの一覧返す */
  getAllVersions: genGetAllVersions<ForgeVersion>('forge', getAllForgeVersions),
  needEulaAgreement: needEulaAgreementVanilla,
};

async function installForgeVersion(
  version: ForgeVersion,
  cwdPath: Path,
  jarpath: Path
) {
  // versionフォルダを削除
  await cwdPath.remove();

  const installerPath = cwdPath.child('forge-' + version.id + '-installer.jar');

  // インストーラーのダウンロードURLを取得
  const serverURL = await getForgeDownloadUrl(version);

  // インストーラーを取得
  const serverData = await BytesData.fromURL(serverURL);

  if (isError(serverData)) return serverData;

  // インストーラーを保存
  await installerPath.write(serverData);

  // インストーラーを実行
  const installResult = await installForge(installerPath);
  if (isError(installResult)) return installResult;

  for (const file of await cwdPath.iter()) {
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
  let runPath: Path;
  if (osPlatform == 'windows-x64') {
    // windows
    runPath = serverCwdPath.child('run.bat');
    if (runPath.exists()) {
      // 1.17.1以降
      return await getProgramArgumentsFromBat(runPath);
    }
  } else {
    // UNIX(macOS,linux)
    runPath = serverCwdPath.child('run.sh');
    if (runPath.exists()) {
      // 1.17.1以降
      return await getProgramArgumentsFromSh(runPath);
    }
  }

  if (jarpath.exists()) return ['-jar', jarpath.absolute().strQuoted()];

  return errorMessage.data.path.notFound({
    type: 'file',
    path: runPath.path + '|' + jarpath.path,
  });
}

async function getProgramArgumentsFromBat(batPath: Path) {
  const data = await batPath.read();
  if (isError(data)) return data;

  // バッチフィルの中身を取得
  const txt = await data.text();

  for (const line of txt.split('\n')) {
    const pattern = /^\s*java @user_jvm_args\.txt (.+) %\*\s*$/;
    const match = line.match(pattern);
    if (match) {
      const arg = match[1];
      return ['"@user_jvm_args.txt"', ...arg.split(' ')];
    }
  }
  return errorMessage.data.path.invalidContent.missingJavaCommand({
    type: 'file',
    path: batPath.path,
  });
}

async function getProgramArgumentsFromSh(shPath: Path) {
  const data = await shPath.read();
  if (isError(data)) return data;

  // シェルスクリプトの中身を取得
  const txt = await data.text();

  for (const line of txt.split('\n')) {
    const pattern = /^\s*java @user_jvm_args\.txt (.+) "\$@"\s*$/;
    const match = line.match(pattern);
    if (match) {
      const arg = match[1];
      return ['@user_jvm_args.txt', ...arg.split(' ')];
    }
  }
  return errorMessage.data.path.invalidContent.missingJavaCommand({
    type: 'file',
    path: shPath.path,
  });
}

async function installForge(installerPath: Path): Promise<Failable<undefined>> {
  // TODO: forgeのインストール時に使用するjavaのバージョン17で大丈夫？
  // jre-legacyだとエラー出たのでとりあえずこれを使っている
  const javaPath = await readyJava('java-runtime-gamma', false);
  if (isError(javaPath)) return javaPath;

  const args = [
    '-jar',
    installerPath.absolute().strQuoted(),
    '--installServer',
  ];

  // インストール開始
  // -jar forge-*-installer.jar --installServer server
  const process = interactiveProcess(
    javaPath,
    args,
    undefined,
    undefined,
    installerPath.parent(),
    true
  );
  return await process;
}

/** forgeのjarのダウンロードパスを返す 存在検証はしない */
export async function getForgeDownloadUrl(version: ForgeVersion) {
  return `https://maven.minecraftforge.net/net/minecraftforge/forge/${version.id}-${version.forge_version}/forge-${version.id}-${version.forge_version}-installer.jar`;
}

export async function getAllForgeVersions(): Promise<
  Failable<AllForgeVersion>
> {
  const indexPage = await BytesData.fromURL(ForgeURL);

  if (isError(indexPage)) return indexPage;

  const $ = cheerio.load(await indexPage.text());

  const ids: string[] = [];

  // TODO: Forgeのhtml構成が変わった瞬間終わるので対策を考えたい
  $('ul.section-content li.li-version-list ul li a').each((_, elem) => {
    const path = elem.attribs['href'];
    const match = path.match(/^index_([a-z0-9_\.-]+)\.html$/);
    if (match) ids.push(match[1]);
  });

  // 各バージョン後ごとの全ビルドを並列取得してflat化
  const versions = (await Promise.all(ids.map(scrapeForgeVersions))).filter(
    isValid
  );

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
): Promise<Failable<AllForgeVersion[number]>> {
  if (noInstallerVersionIds.has(id))
    return errorMessage.core.version.forgeInstallerNotProvided({ version: id });

  const versionUrl = `https://files.minecraftforge.net/net/minecraftforge/forge/index_${id}.html`;
  const page = await BytesData.fromURL(versionUrl);
  if (isError(page)) return page;

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

  // recommendedを取得
  let recommended: string | undefined = undefined;
  $('div.downloads > div.download > div.title > small').each((i, elem) => {
    if (i !== 1) return;

    const element = $(elem);
    // 子要素を消して直接のテキストだけを取得
    const path = element.text();

    if (typeof path !== 'string') return;
    const match = path.match(/^[\d\.]+ - (.+)$/);
    if (match === null) return;
    const reco = match[1];
    if (!forge_versions.includes(reco)) return;
    recommended = reco;
  });

  return {
    id,
    forge_versions,
    recommended,
  };
}
