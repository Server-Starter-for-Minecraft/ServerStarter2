import { GroupProgressor } from 'app/src-electron/common/progress';
import { Failable } from 'app/src-electron/schema/error';
import { Runtime } from 'app/src-electron/schema/runtime';
import { ForgeVersion, NeoForgeVersion } from 'app/src-electron/schema/version';
import { BytesData } from 'app/src-electron/util/binary/bytesData';
import { Path } from 'app/src-electron/util/binary/path';
import { isError } from 'app/src-electron/util/error/error';
import { ExecRuntime, getJarPath } from '../base';
import { constructExecPath } from './forgeArgAnalyzer';

/**
 * ForgeのJarを入手するために必要な`installer.jar`を入手
 */
export async function downloadInstaller(
  downloadURL: string,
  installFilePath: Path
): Promise<Failable<void>> {
  // generateVersionJsonHandler()において，installerのHashを書き込んでいないため，Hashのチェックは省略
  // Jar(Forgeの場合は`installer.jar`)をダウンロード
  const downloadJar = await BytesData.fromURL(downloadURL);
  if (isError(downloadJar)) return downloadJar;

  // `installer.jar`を書き出し
  return await installFilePath.write(downloadJar);
}

/**
 * 入手した`installer.jar`を実行して`***.(jar|bat|sh)`を書き出す
 *
 * 何が書き出されるかはバージョン次第
 */
export async function getServerJarFromInstaller(
  type: 'forge' | 'neoforge',
  installFilePath: Path,
  runtime: Runtime,
  execRuntime: ExecRuntime,
  progress?: GroupProgressor
): Promise<Failable<void>> {
  const installerTag =
    type === 'forge'
      ? '--installServer'
      : type === 'neoforge'
      ? '-installServer'
      : '';

  // `installer.jar`の実行引数（普通の`server.jar`の実行引数とは異なるため，決め打ちで下記に実装）
  const args = ['-jar', installFilePath.absolute().quotedPath, installerTag];

  const sp = progress?.subtitle({
    key: `server.readyVersion.${type}.installing`,
  });
  const cp = progress?.console();
  const res = await execRuntime({
    runtime,
    args,
    currentDir: installFilePath.parent(),
    onOut(line) {
      cp?.push(line);
    },
  });
  sp?.delete();
  cp?.delete();

  return res;
}

/**
 * `installer.jar`によって書き出したファイルを適切な名前にリネーム
 */
export async function renameFilesFromInstaller(
  cachePath: Path,
  version: ForgeVersion | NeoForgeVersion
) {
  const paths = await cachePath.iter();
  if (isError(paths)) return paths;

  for (const file of paths) {
    const filename = file.basename();

    // 生成されたjarのファイル名を変更 (jarを生成するバージョンだった場合)
    const matchRgx =
      version.type === 'forge'
        ? /(minecraft)?forge(-universal)?-[0-9\.-]+(-mc\d+)?(-universal|-shim)?.jar/
        : version.type === 'neoforge'
        ? /neoforge?-[0-9\.-]+?(-universal)?.jar/
        : '';
    const match = filename.match(matchRgx);
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
