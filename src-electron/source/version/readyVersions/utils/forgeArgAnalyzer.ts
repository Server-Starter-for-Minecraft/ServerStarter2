import { Failable } from 'app/src-electron/schema/error';
import { ForgeVersion, NeoForgeVersion } from 'app/src-electron/schema/version';
import { Path } from 'app/src-electron/util/binary/path';
import { errorMessage } from 'app/src-electron/util/error/construct';
import { fromRuntimeError, isError } from 'app/src-electron/util/error/error';
import { osPlatform } from 'app/src-electron/util/os/os';
import { getJarPath } from '../base';
import { getVersionJsonObj, VersionJson } from './versionJson';

/** `installer.jar`が生成する起動スクリプトの拡張子 */
export type ScriptExt = '.bat' | '.sh';

/**
 * `installer.jar`が生成した起動スクリプトの，リネーム後のパスを返す
 *
 * @param cwdPath 起動スクリプトを置くフォルダ
 * @param version 対象のバージョン
 * @param ext 起動スクリプトの拡張子
 */
export function constructExecPath(
  cwdPath: Path,
  version: ForgeVersion | NeoForgeVersion,
  ext: ScriptExt
) {
  return cwdPath.child(`version${ext}`);
}

export async function getNewForgeArgs(
  serverCwdPath: Path,
  version: ForgeVersion | NeoForgeVersion,
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
      return await getProgramArgumentsFromScript(
        runPath,
        '.bat',
        oldVerJson.download.url,
        oldVerJson.javaVersion
      );
    }
  } else {
    // UNIX(macOS,linux)
    runPath = constructExecPath(serverCwdPath, version, '.sh');
    if (runPath.exists()) {
      // 1.17.1以降
      return await getProgramArgumentsFromScript(
        runPath,
        '.sh',
        oldVerJson.download.url,
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

/**
 * 起動スクリプト内でJavaを起動する行のパターン（拡張子ごと）
 *
 * キャプチャ部分が`user_jvm_args.txt`以外の実行時引数（例：`@libraries/.../win_args.txt`）
 */
const SCRIPT_JAVA_LINE_PATTERNS: Record<ScriptExt, RegExp> = {
  '.bat': /^\s*java @user_jvm_args\.txt (.+) %\*\s*$/,
  '.sh': /^\s*java @user_jvm_args\.txt (.+) "\$@"\s*$/,
};

/**
 * `installer.jar`が生成した起動スクリプト（bat / sh）から，Javaに渡される実行時引数を取り出す
 *
 * @param scriptPath 起動スクリプトのパス
 * @param ext 起動スクリプトの拡張子
 * @returns `user_jvm_args.txt`を除いた実行時引数の配列
 */
export async function readScriptArgs(
  scriptPath: Path,
  ext: ScriptExt
): Promise<Failable<string[]>> {
  const txt = await scriptPath.readText();
  if (isError(txt)) return txt;

  for (const line of txt.split('\n')) {
    const match = line.match(SCRIPT_JAVA_LINE_PATTERNS[ext]);
    if (match) return match[1].split(' ');
  }

  return fromRuntimeError(
    new Error(`MISSING_JAVA_COMMAND_(${scriptPath.path})`)
  );
}

/**
 * 起動スクリプトの内容から，引数を更新した`version.json`のオブジェクトを生成する
 *
 * @param scriptPath 起動スクリプトのパス
 * @param ext 起動スクリプトの拡張子
 * @param downloadURL `installer.jar`のダウンロードURL（`version.json`にそのまま引き継ぐ）
 * @param javaVersion 必要なJavaのバージョン（`version.json`にそのまま引き継ぐ）
 * @returns 起動スクリプトにJavaを起動する行がない場合はエラー
 */
async function getProgramArgumentsFromScript(
  scriptPath: Path,
  ext: ScriptExt,
  downloadURL: string,
  javaVersion?: VersionJson['javaVersion']
): Promise<Failable<VersionJson>> {
  const args = await readScriptArgs(scriptPath, ext);
  if (isError(args)) return args;

  return getVersionJsonObj(downloadURL, false, undefined, javaVersion, args);
}
