import { osPlatform } from 'app/src-electron/util/os';
import { ForgeVersion } from 'app/src-electron/v2/schema/version';
import { err, ok, Result } from 'app/src-electron/v2/util/base';
import { Path } from 'app/src-electron/v2/util/binary/path';
import { getJarPath } from './base';
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
): Promise<Result<VersionJson>> {
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
  if (jarpath.exists()) return ok(oldVerJson);

  return err(
    new Error(`NOT_FOUND_EXECUTEPATH_(${runPath.path}|${jarpath.path})`)
  );
}

async function getProgramArgumentsFromBat(
  batPath: Path,
  downloadURL: string,
  javaVersion?: VersionJson['javaVersion']
): Promise<Result<VersionJson>> {
  const txt = await batPath.readText();
  if (txt.isErr) return txt;

  for (const line of txt.value().split('\n')) {
    const pattern = /^\s*java @user_jvm_args\.txt (.+) %\*\s*$/;
    const match = line.match(pattern);
    if (match) {
      const arg = match[1];
      // TODO: user_jvm_argsは削除して`forge.ts`のテストが通るように再登録
      return ok(
        getVersionJsonObj(downloadURL, undefined, javaVersion, [
          '"@user_jvm_args.txt"',
          ...arg.split(' '),
        ])
      );
    }
  }

  return err(new Error(`MISSING_JAVA_COMMAND_(${batPath.path})`));
}

async function getProgramArgumentsFromSh(
  shPath: Path,
  downloadURL: string,
  javaVersion?: VersionJson['javaVersion']
): Promise<Result<VersionJson>> {
  const txt = await shPath.readText();
  if (txt.isErr) return txt;

  for (const line of txt.value().split('\n')) {
    const pattern = /^\s*java @user_jvm_args\.txt (.+) "\$@"\s*$/;
    const match = line.match(pattern);
    if (match) {
      const arg = match[1];
      // TODO: user_jvm_argsは削除して`forge.ts`のテストが通るように再登録
      return ok(
        getVersionJsonObj(downloadURL, undefined, javaVersion, [
          '"@user_jvm_args.txt"',
          ...arg.split(' '),
        ])
      );
    }
  }

  return err(new Error(`MISSING_JAVA_COMMAND_(${shPath.path})`));
}
