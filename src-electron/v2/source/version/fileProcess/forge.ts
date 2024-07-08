import { deepcopy } from 'app/src-electron/util/deepcopy';
import { Runtime } from 'app/src-electron/v2/schema/runtime';
import { ForgeVersion } from 'app/src-electron/v2/schema/version';
import { ok, Result } from 'app/src-electron/v2/util/base';
import { Bytes } from 'app/src-electron/v2/util/binary/bytes';
import { Path } from 'app/src-electron/v2/util/binary/path';
import { Url } from 'app/src-electron/v2/util/binary/url';
import { JsonSourceHandler } from 'app/src-electron/v2/util/wrapper/jsonFile';
import { getJarPath, ReadyVersion, RemoveVersion } from './base';
import { constructExecPath, getNewForgeArgs } from './forgeArgAnalyzer';
import { getRuntimeObj } from './serverJar';
import { getVanillaVersionJson } from './vanilla';
import { VersionJson } from './versionJson';

function getServerID(version: ForgeVersion) {
  return `${version.id}_${version.forge_version}`;
}

export class ReadyForgeVersion extends ReadyVersion<ForgeVersion> {
  constructor(version: ForgeVersion) {
    // キャッシュから本番環境へコピーするファイルを追加
    super(version, ['user_jvm_args.txt']);
  }

  protected async generateVersionJson() {
    // バニラの情報をもとにForgeのversionJsonを生成
    const vanillaVerJson = await getVanillaVersionJson(this._version.id);
    if (vanillaVerJson.isErr) return vanillaVerJson;

    // ダウンロードURLを更新
    const returnVerJson = deepcopy(vanillaVerJson.value());
    returnVerJson.download = { url: this._version.download_url };

    return ok(returnVerJson);
  }
  protected async generateCachedJar(
    verJsonHandler: JsonSourceHandler<VersionJson>,
    readyRuntime: (runtime: Runtime) => Promise<Result<void>>
  ): Promise<Result<void>> {
    const verJson = await verJsonHandler.read();
    if (verJson.isErr) return verJson;

    // `installer.jar`をダウンロード
    const installerPath = this.cachePath.child('installer.jar');
    const installerRes = await downloadInstaller(
      verJson.value().download.url,
      installerPath
    );
    if (installerRes.isErr) return installerRes;

    // `installer.jar`を実行
    const runtime = await this.getRuntime(verJsonHandler);
    if (runtime.isErr) return runtime;
    const installerRunRes = await getServerJarFromInstaller(
      installerPath,
      runtime.value(),
      readyRuntime
    );
    if (installerRunRes.isErr) return installerRunRes;

    // 生成したファイル群をリネーム
    await renameFilesFromInstaller(this.cachePath, this._version);

    // 生成されたファイルを解析して，引数を更新
    const newVerJson = await getNewForgeArgs(
      this.cachePath,
      this._version,
      verJson.value()
    );
    if (newVerJson.isErr) return newVerJson;

    // 引数の更新を反映した`version.json`を書き出して終了
    return await verJsonHandler.write(newVerJson.value());
  }
  protected async getRuntime(
    verJsonHandler: JsonSourceHandler<VersionJson>
  ): Promise<Result<Runtime>> {
    const verJson = await verJsonHandler.read();
    if (verJson.isErr) return verJson;

    return ok(
      getRuntimeObj('universal', verJson.value().javaVersion?.majorVersion)
    );
  }
  get serverID(): string {
    return getServerID(this._version);
  }
}

export class RemoveForgeVersion extends RemoveVersion<ForgeVersion> {
  get serverID(): string {
    return getServerID(this._version);
  }
}

/**
 * ForgeのJarを入手するために必要な`installer.jar`を入手
 */
async function downloadInstaller(
  downloadURL: string,
  installFilePath: Path
): Promise<Result<void>> {
  // Jar(Forgeの場合は`installer.jar`)をダウンロード
  const downloadJar = await new Url(downloadURL).into(Bytes);
  if (downloadJar.isErr) return downloadJar;

  // generateVersionJsonHandler()において，installerのHashを書き込んでいないため，Hashのチェックは省略
  // `installer.jar`を書き出し
  const writeRes = await downloadJar.value().into(installFilePath);
  if (writeRes.isErr) return writeRes;

  return ok();
}

/**
 * 入手した`installer.jar`を実行して`server.jar`を書き出す
 */
async function getServerJarFromInstaller(
  installFilePath: Path,
  runtime: Runtime,
  readyRuntime: (runtime: Runtime) => Promise<Result<void>>
): Promise<Result<void>> {
  const readyRuntimeRes = await readyRuntime(runtime);
  if (readyRuntimeRes.isErr) return readyRuntimeRes;

  // `installer.jar`の実行引数（普通の`server.jar`の実行引数とは異なるため，決め打ちで下記に実装）
  const args = [
    '-jar',
    installFilePath.absolute().quotedPath,
    '--installServer',
  ];

  // TODO: @txkodo Runtimeを準備した後にどのようにしてinstallerを起動するのか
  // (インストーラーを実行して，Jarファイルを生成)

  return ok();
}

/**
 * `installer.jar`によって書き出したファイルを適切な名前にリネーム
 */
async function renameFilesFromInstaller(
  cachePath: Path,
  version: ForgeVersion
) {
  for (const file of await cachePath.iter()) {
    const filename = file.basename();

    // 生成されたjarのファイル名を変更 (jarを生成するバージョンだった場合)
    const match = filename.match(
      /(minecraft)?forge(-universal)?-[0-9\.-]+(-mc\d+)?(-universal|-shim)?.jar/
    );
    if (match) {
      await file.rename(getJarPath(cachePath));
      return;
    }

    // 生成されたbatのファイル名を変更 (batを生成するバージョンだった場合)
    if (filename === 'run.bat') {
      await file.rename(constructExecPath(cachePath, version, '.bat'));
    }

    // 生成されたshのファイル名を変更 (shを生成するバージョンだった場合)
    if (filename === 'run.sh') {
      await file.rename(constructExecPath(cachePath, version, '.sh'));
    }
  }
}
