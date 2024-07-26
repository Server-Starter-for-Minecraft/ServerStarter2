import { deepcopy } from 'app/src-electron/util/deepcopy';
import { Runtime } from 'app/src-electron/v2/schema/runtime';
import { ForgeVersion, VersionId } from 'app/src-electron/v2/schema/version';
import { ok, Result } from 'app/src-electron/v2/util/base';
import { Bytes } from 'app/src-electron/v2/util/binary/bytes';
import { Path } from 'app/src-electron/v2/util/binary/path';
import { Url } from 'app/src-electron/v2/util/binary/url';
import { JsonSourceHandler } from 'app/src-electron/v2/util/wrapper/jsonFile';
import { ExecRuntime, getJarPath, ReadyVersion, RemoveVersion } from './base';
import { constructExecPath, getNewForgeArgs } from './forgeArgAnalyzer';
import { getRuntimeObj } from './serverJar';
import { getVanillaVersionJson } from './vanilla';
import { VersionJson } from './versionJson';

function getServerID(version: ForgeVersion) {
  return `${version.id}_${version.forge_version}`;
}

// ReadyVersionの標準対応以外のキャッシュからコピーすべきファイル群
const SUPPORT_SECONDARY_FILES = ['version.bat', 'version.sh'];

export class ReadyForgeVersion extends ReadyVersion<ForgeVersion> {
  constructor(version: ForgeVersion, cacheFolder: Path) {
    // キャッシュから本番環境へコピーするファイルを追加
    super(version, cacheFolder, SUPPORT_SECONDARY_FILES);
  }

  protected async generateVersionJson() {
    // バニラの情報をもとにForgeのversionJsonを生成
    const vanillaVerJson = await getVanillaVersionJson(
      this._version.id,
      this._cacheFolder,
      true
    );
    if (vanillaVerJson.isErr) return vanillaVerJson;

    // ダウンロードURLを更新
    const returnVerJson = deepcopy(vanillaVerJson.value());
    returnVerJson.download = { url: this._version.download_url };

    return ok(returnVerJson);
  }
  protected async generateCachedJar(
    verJsonHandler: JsonSourceHandler<VersionJson>,
    execRuntime: ExecRuntime
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
      execRuntime
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

    return ok(getRuntimeObj('universal', verJson.value().javaVersion));
  }
  get serverID(): string {
    return getServerID(this._version);
  }
}

export class RemoveForgeVersion extends RemoveVersion<ForgeVersion> {
  constructor(version: ForgeVersion, cacheFolder: Path) {
    // キャッシュから本番環境へコピーするファイルを追加
    super(version, cacheFolder, SUPPORT_SECONDARY_FILES);
  }
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
 * 入手した`installer.jar`を実行して`***.(jar|bat|sh)`を書き出す
 *
 * 何が書き出されるかはバージョン次第
 */
async function getServerJarFromInstaller(
  installFilePath: Path,
  runtime: Runtime,
  execRuntime: ExecRuntime
): Promise<Result<void>> {
  // `installer.jar`の実行引数（普通の`server.jar`の実行引数とは異なるため，決め打ちで下記に実装）
  const args = [
    '-jar',
    installFilePath.absolute().quotedPath,
    '--installServer',
  ];

  const installRes = await execRuntime({
    runtime,
    args,
    currentDir: installFilePath.parent(),
    onOut(line) {
      /** TODO: プログレスに出力 */
    },
  });
  if (installRes.isErr) return installRes;

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

/** In Source Testing */
if (import.meta.vitest) {
  const { test, expect } = import.meta.vitest;
  const { Path } = await import('src-electron/v2/util/binary/path');

  // 一時使用フォルダを初期化
  const workPath = new Path(__dirname).child('work');
  workPath.mkdir();

  const cacheFolder = workPath.child('cache');
  const serverFolder = workPath.child('servers');

  const ver21: ForgeVersion = {
    id: '1.13.2' as VersionId,
    type: 'forge',
    forge_version: '25.0.223',
    download_url:
      'https://maven.minecraftforge.net/net/minecraftforge/forge/1.13.2-25.0.223/forge-1.13.2-25.0.223-installer.jar',
  };

  const JVM_ARGS = ['JVM', 'ARGUMENT'];

  test.each([
    {
      genfiles: [
        {
          path: 'forge-1.21-51.0.22.jar',
          content: 'foo',
        },
      ],
      args: [
        ...JVM_ARGS,
        '-Dfile.encoding=UTF-8',
        '-Dlog4j.configurationFile=log4j2_112-116.xml',
        '--jar',
        expect.any(String),
        '--nogui',
      ],
    },
    {
      genfiles: [
        {
          path: 'version.bat',
          content:
            '# COMMENT\r\n   java @user_jvm_args.txt @path/to/args.txt %*   \r\n',
        },
        {
          path: 'version.sh',
          content: 'java @user_jvm_args.txt @path/to/args.txt "$@"\n# COMMENT',
        },
        {
          path: 'libraries/to/args.txt',
          content: '-a foo\n--bar buz\n-a.a.a=b',
        },
      ],
      args: [
        ...JVM_ARGS,
        '-Dfile.encoding=UTF-8',
        '-Dlog4j.configurationFile=log4j2_112-116.xml',
        '@path/to/args.txt',
        '--nogui',
      ],
    },
  ])('setForgeJar', async ({ genfiles, args }) => {
    const outputPath = serverFolder.child('testForge/ver21');
    const readyOperator = new ReadyForgeVersion(ver21, cacheFolder);

    // 条件をそろえるために，ファイル類を削除する
    await outputPath.remove();
    // キャッシュの威力を試したいときは以下の行をコメントアウト
    await readyOperator.cachePath.remove();

    // `installer.jar`の実行によって必要なファイルが生成された体を再現する
    const execRuntime: ExecRuntime = vi.fn(async (options) => {
      for (const { path, content } of genfiles) {
        const tgtJarPath = options.currentDir.child(path);
        await tgtJarPath.writeText(content);
      }
      return ok();
    });

    // テスト対象の関数
    const res = await readyOperator.completeReady4VersionFiles(
      outputPath,
      execRuntime
    );

    // 戻り値の検証
    expect(res.isOk).toBe(true);
    expect(res.value().getCommand({ jvmArgs: JVM_ARGS })).toEqual(args);

    // ファイルの設置状況の検証
    genfiles.forEach(({ path }) => {
      const targetPath = outputPath.child(path);
      if (targetPath.extname() === '.jar') {
        expect(outputPath.child('version.jar').exists()).toBe(true);
      } else {
        expect(outputPath.child(path).exists()).toBe(true);
      }
    });

    // 実行後にファイル削除
    const remover = new RemoveForgeVersion(ver21, cacheFolder);
    await remover.completeRemoveVersion(outputPath);

    // 削除後の状態を確認
    genfiles.forEach(({ path }) => {
      const targetPath = outputPath.child(path);
      if (targetPath.extname() === '.jar') {
        expect(outputPath.child('version.jar').exists()).toBe(false);
      } else {
        expect(readyOperator.cachePath.child(path).exists()).toBe(true);
      }
    });
  });
}
