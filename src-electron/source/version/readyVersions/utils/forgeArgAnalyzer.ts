import { Failable } from 'app/src-electron/schema/error';
import { ForgeVersion } from 'app/src-electron/schema/version';
import { Path } from 'app/src-electron/util/binary/path';
import { errorMessage } from 'app/src-electron/util/error/construct';
import { fromRuntimeError, isError } from 'app/src-electron/util/error/error';
import { osPlatform } from 'app/src-electron/util/os/os';
import { getJarPath } from '../base';
import { getVersionJsonObj, VersionJson } from './versionJson';

/**
 * `installer.jar`から生成されたファイル名を下記の規則でリネーム
 *
 * @param ext:拡張子(.sh/.bat)
 */
export function constructExecPath(
  cwdPath: Path,
  version: ForgeVersion,
  ext: '.sh' | '.bat'
) {
  return cwdPath.child(`version${ext}`);
}

export async function getNewForgeArgs(
  serverCwdPath: Path,
  version: ForgeVersion,
  oldVerJson: VersionJson
): Promise<Failable<VersionJson>> {
  // 1.17以降はrun.batが生成されるようになるのでその内容を解析して実行時引数を構成
  let runPath: Path;
  // `osPlatform`はv1から引用
  if (osPlatform == 'windows-x64') {
    // windows
    runPath = constructExecPath(serverCwdPath, version, '.bat');
    if (runPath.exists()) {
      // 1.17.1以降
      return await getProgramArgumentsFromBat(
        runPath,
        version.download_url,
        oldVerJson.javaVersion
      );
    }
  } else {
    // UNIX(macOS,linux)
    runPath = constructExecPath(serverCwdPath, version, '.sh');
    if (runPath.exists()) {
      // 1.17.1以降
      return await getProgramArgumentsFromSh(
        runPath,
        version.download_url,
        oldVerJson.javaVersion
      );
    }
  }

  // batやshといったファイルが存在しないときには`version.json`を更新する必要なし
  const jarpath = getJarPath(serverCwdPath);
  if (jarpath.exists()) return oldVerJson;

  return errorMessage.data.path.notFound({
    type: 'file',
    path: jarpath.path,
  });
}

async function getProgramArgumentsFromBat(
  batPath: Path,
  downloadURL: string,
  javaVersion?: VersionJson['javaVersion']
): Promise<Failable<VersionJson>> {
  const txt = await batPath.readText();
  if (isError(txt)) return txt;

  for (const line of txt.split('\n')) {
    const pattern = /^\s*java @user_jvm_args\.txt (.+) %\*\s*$/;
    const match = line.match(pattern);
    if (match) {
      const arg = match[1];
      return getVersionJsonObj(downloadURL, false, undefined, javaVersion, [
        ...arg.split(' '),
      ]);
    }
  }

  return fromRuntimeError(new Error(`MISSING_JAVA_COMMAND_(${batPath.path})`));
}

async function getProgramArgumentsFromSh(
  shPath: Path,
  downloadURL: string,
  javaVersion?: VersionJson['javaVersion']
): Promise<Failable<VersionJson>> {
  const txt = await shPath.readText();
  if (isError(txt)) return txt;

  for (const line of txt.split('\n')) {
    const pattern = /^\s*java @user_jvm_args\.txt (.+) "\$@"\s*$/;
    const match = line.match(pattern);
    if (match) {
      const arg = match[1];
      return getVersionJsonObj(downloadURL, false, undefined, javaVersion, [
        ...arg.split(' '),
      ]);
    }
  }

  return fromRuntimeError(new Error(`MISSING_JAVA_COMMAND_(${shPath.path})`));
}
