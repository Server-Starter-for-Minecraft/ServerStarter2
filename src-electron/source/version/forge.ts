import * as cheerio from 'cheerio';
import {
  AllForgeVersion,
  ForgeVersion,
  VersionId,
} from 'src-electron/schema/version';
import { GroupProgressor } from 'app/src-electron/common/progress';
import { runtimeContainer } from 'app/src-electron/core/setup';
import { JavaMajorVersion } from 'app/src-electron/schema/runtime';
import { errorMessage } from 'app/src-electron/util/error/construct';
import { isError, isValid } from 'app/src-electron/util/error/error';
import { versionsCachePath } from '../../source/const';
import { BytesData } from '../../util/binary/bytesData';
import { Path } from '../../util/binary/path';
import { interactiveProcess } from '../../util/binary/subprocess';
import { Failable } from '../../util/error/failable';
import { osPlatform } from '../../util/os/os';
import {
  genGetAllVersions,
  needEulaAgreementVanilla,
  VersionComponent,
  VersionLoader,
} from './base';
import { getJavaComponent } from './vanilla';

const forgeVersionsPath = versionsCachePath.child('forge');

const ForgeURL = 'https://files.minecraftforge.net/net/minecraftforge/forge/';

/** @param ext:拡張子(.jar/.sh/.bat) */
function constructExecPath(cwdPath: Path, version: ForgeVersion, ext: string) {
  return cwdPath.child(`${version.type}-${version.id}${ext}`);
}

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

    // 実行可能なファイル(jar/bat/sh)存在するかを確認し適切なコマンド引数を得る
    let programArguments = await getProgramArguments(cwdPath, version);

    // 実行可能なファイルが存在しなかった場合
    if (isError(programArguments)) {
      // インストール
      const r = progress?.subtitle({
        key: 'server.readyVersion.forge.readyServerData',
      });
      const install = await installForgeVersion(version, cwdPath);
      r?.delete();

      // インストールに失敗した場合エラー
      if (isError(install)) return install;

      // 再び実行可能なファイル(jar/bat/sh)存在するかを確認し適切なコマンド引数を得る
      programArguments = await getProgramArguments(cwdPath, version);
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

async function installForgeVersion(version: ForgeVersion, cwdPath: Path) {
  // 元のforge関連のファイルを削除
  await uninstallForgeVersion(cwdPath);

  const installerPath = cwdPath.child(`forge-${version.id}-installer.jar`);

  // インストーラーのダウンロードURLを取得
  const serverURL = version.download_url;

  // インストーラーを取得
  const serverData = await BytesData.fromURL(serverURL);

  if (isError(serverData)) return serverData;

  // インストーラーを保存
  const failableWriteInstaller = await installerPath.write(serverData);
  if (isError(failableWriteInstaller)) return failableWriteInstaller;

  // インストーラーを実行
  const installResult = await installForge(installerPath);
  if (isError(installResult)) return installResult;

  const allPaths = await cwdPath.iter();
  if (isError(allPaths)) return allPaths;

  for (const file of allPaths) {
    const filename = file.basename();

    // 生成されたjarのファイル名を変更 (jarを生成するバージョンだった場合)
    const match = filename.match(
      /(minecraft)?forge(-universal)?-[0-9\.-]+(-mc\d+)?(-universal|-shim)?.jar/
    );
    if (match) {
      await file.rename(constructExecPath(cwdPath, version, '.jar'));
      return;
    }

    // 生成されたbatのファイル名を変更 (batを生成するバージョンだった場合)
    if (filename === 'run.bat') {
      await file.rename(constructExecPath(cwdPath, version, '.bat'));
    }

    // 生成されたshのファイル名を変更 (shを生成するバージョンだった場合)
    if (filename === 'run.sh') {
      await file.rename(constructExecPath(cwdPath, version, '.sh'));
    }
  }
}

async function uninstallForgeVersion(cwdPath: Path): Promise<Failable<void>> {
  const allPaths = await cwdPath.iter();
  if (isError(allPaths)) return allPaths;

  const removeRes = await Promise.all(
    allPaths.map((file) => {
      const filename = file.basename();
      // forge関連の実行系ファイルを削除
      const match = filename.match(/forge-.*\.(jar|bat|sh)/);
      if (match) return file.remove();
    })
  );

  if (removeRes.filter(isError).length > 0) {
    return errorMessage.data.path.deletionFailed({
      type: 'file',
      path: cwdPath.path,
    });
  }
}

async function getProgramArguments(serverCwdPath: Path, version: ForgeVersion) {
  // 1.17以降はrun.batが生成されるようになるのでその内容を解析して実行時引数を構成
  let runPath: Path;
  if (osPlatform == 'windows-x64') {
    // windows
    runPath = constructExecPath(serverCwdPath, version, '.bat');
    if (runPath.exists()) {
      // 1.17.1以降
      return await getProgramArgumentsFromBat(runPath);
    }
  } else {
    // UNIX(macOS,linux)
    runPath = constructExecPath(serverCwdPath, version, '.sh');
    if (runPath.exists()) {
      // 1.17.1以降
      return await getProgramArgumentsFromSh(runPath);
    }
  }

  const jarpath = constructExecPath(serverCwdPath, version, '.jar');
  if (jarpath.exists()) return ['-jar', jarpath.absolute().strQuoted()];

  return errorMessage.data.path.notFound({
    type: 'file',
    path: `${runPath.path}|${jarpath.path}`,
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
  // 最新版のForgeを用いてインストールを行う
  // TODO: 旧バージョンに対しては当該server.jarで使用するバージョンでインストールを行う
  const javaPath = await runtimeContainer.ready(
    { type: 'universal', majorVersion: JavaMajorVersion.parse(0) },
    'windows-x64',
    false,
  );
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

  // 各バージョンごとの全ビルドを並列取得してflat化
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
  const parsedId = VersionId.safeParse(id);
  if (noInstallerVersionIds.has(id) || !parsedId.success)
    return errorMessage.core.version.forgeInstallerNotProvided({ version: id });

  const versionUrl = `https://files.minecraftforge.net/net/minecraftforge/forge/index_${id}.html`;
  const page = await BytesData.fromURL(versionUrl);
  if (isError(page)) return page;

  const forge_versions: { version: string; url: string }[] = [];

  const $ = cheerio.load(await page.text());
  $('.download-list > tbody > tr').each((_, elem) => {
    const downloadVersion = $('.download-version', elem);

    downloadVersion.children();
    // 子要素を消して直接のテキストだけを取得
    downloadVersion.children().remove();
    const version = downloadVersion.text().trim();

    const url = $('.download-links > li', elem)
      .map((_, x) => {
        const children = $(x).children();

        const isInstaller = children.first().text().trim() === 'Installer';

        if (!isInstaller) return;

        return children.children().last().attr()?.href;
      })
      .filter((x) => x !== undefined)[0];

    if (version && url) {
      forge_versions.push({
        version,
        url,
      });
    }
  });

  // recommendedを取得
  let recommended: { version: string; url: string } | undefined = undefined;

  $('div.downloads > div.download > div.title > small').each((i, elem) => {
    if (i !== 1) return;

    const element = $(elem);
    // 子要素を消して直接のテキストだけを取得
    const path = element.text();

    if (typeof path !== 'string') return;
    const match = path.match(/^[\d\.]+ - (.+)$/);
    if (match === null) return;
    const reco = match[1];
    recommended = forge_versions.find((x) => x.version === reco);
  });

  return {
    id: parsedId.data,
    forge_versions,
    recommended,
  };
}
