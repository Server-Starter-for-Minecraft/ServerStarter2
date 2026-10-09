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
  const args = ['-jar', installFilePath.absolute().path, installerTag];

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

/** `installer.jar`が生成する起動スクリプトのファイル名と，リネーム後の拡張子の対応 */
const RUN_SCRIPTS = new Map<string, '.bat' | '.sh'>([
  ['run.bat', '.bat'],
  ['run.sh', '.sh'],
]);

/**
 * `installer.jar`によって書き出したファイルを適切な名前にリネーム
 */
export async function renameFilesFromInstaller(
  cachePath: Path,
  version: ForgeVersion | NeoForgeVersion
) {
  const paths = await cachePath.iter();
  if (isError(paths)) return paths;

  // 起動スクリプト（run.bat / run.sh）が生成されるバージョンでは，スクリプトが参照する引数ファイル内で
  // jarが元のファイル名で指定される（例：`-jar forge-26.2-65.1.3-shim.jar`）ため，元のjarを残す必要がある
  const hasRunScript = paths.some((p) => RUN_SCRIPTS.has(p.basename()));

  for (const file of paths) {
    const filename = file.basename();

    // 生成されたjarを`version.jar`として配置 (jarを生成するバージョンだった場合)
    // `version.jar`はキャッシュの準備が完了したことの目印も兼ねる
    const matchRgx =
      version.type === 'forge'
        ? /(minecraft)?forge(-universal)?-[0-9\.-]+(-mc\d+)?(-universal|-shim)?.jar/
        : version.type === 'neoforge'
          ? /neoforge?-[0-9\.-]+?(-universal)?.jar/
          : '';
    const match = filename.match(matchRgx);
    if (match) {
      const jarPath = getJarPath(cachePath);
      const placeJarRes = hasRunScript
        ? await file.copyTo(jarPath)
        : await file.rename(jarPath);
      if (isError(placeJarRes)) return placeJarRes;
      continue;
    }

    // 生成された起動スクリプト（bat / sh）のファイル名を変更 (起動スクリプトを生成するバージョンだった場合)
    const scriptExt = RUN_SCRIPTS.get(filename);
    if (scriptExt !== undefined) {
      const renameScriptRes = await file.rename(
        constructExecPath(cachePath, version, scriptExt)
      );
      if (isError(renameScriptRes)) return renameScriptRes;
    }
  }
}
