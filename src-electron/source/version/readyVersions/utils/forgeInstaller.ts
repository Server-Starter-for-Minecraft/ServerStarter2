import { GroupProgressor } from 'app/src-electron/common/progress';
import { Failable } from 'app/src-electron/schema/error';
import { Runtime } from 'app/src-electron/schema/runtime';
import { ForgeVersion, NeoForgeVersion } from 'app/src-electron/schema/version';
import { BytesData } from 'app/src-electron/util/binary/bytesData';
import { Path } from 'app/src-electron/util/binary/path';
import { isError } from 'app/src-electron/util/error/error';
import { ExecRuntime, getJarPath } from '../base';
import {
  constructExecPath,
  readScriptArgs,
  ScriptExt,
} from './forgeArgAnalyzer';

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
const RUN_SCRIPTS = new Map<string, ScriptExt>([
  ['run.bat', '.bat'],
  ['run.sh', '.sh'],
]);

/** `installer.jar`が生成するjar（`version.jar`にリネームする対象）のファイル名のパターン */
const GENERATED_JAR_PATTERNS: Record<
  (ForgeVersion | NeoForgeVersion)['type'],
  RegExp
> = {
  forge:
    /(minecraft)?forge(-universal)?-[0-9\.-]+(-mc\d+)?(-universal|-shim)?.jar/,
  neoforge: /neoforge?-[0-9\.-]+?(-universal)?.jar/,
};

/**
 * `installer.jar`によって書き出したファイルを，ServerStarterが扱う名前に整える
 *
 * - 起動スクリプト（run.bat / run.sh）を`version.bat` / `version.sh`にリネームする
 * - 生成されたjarを`version.jar`にリネームし，引数ファイル内のjarの参照も合わせて書き換える
 *
 * `version.jar`はキャッシュの準備が完了したことの目印も兼ねるため，途中で失敗したときに
 * 不完全なキャッシュが残らないよう，jarのリネームは最後に行う
 *
 * @param cachePath `installer.jar`を実行したフォルダ
 * @param version 対象のバージョン（生成されたjarの判別に使う）
 * @returns 失敗した場合はエラー
 */
export async function renameFilesFromInstaller(
  cachePath: Path,
  version: ForgeVersion | NeoForgeVersion
): Promise<Failable<void>> {
  const paths = await cachePath.iter();
  if (isError(paths)) return paths;

  // 生成されたjar（jarを生成するバージョンだった場合）
  const generatedJar = paths.find((p) =>
    GENERATED_JAR_PATTERNS[version.type].test(p.basename())
  );

  // 生成された起動スクリプト（bat / sh）のファイル名を変更 (起動スクリプトを生成するバージョンだった場合)
  for (const file of paths) {
    const scriptExt = RUN_SCRIPTS.get(file.basename());
    if (scriptExt === undefined) continue;

    const renameScriptRes = await file.rename(
      constructExecPath(cachePath, version, scriptExt)
    );
    if (isError(renameScriptRes)) return renameScriptRes;
  }

  if (generatedJar === undefined) return;

  const replaceRes = await replaceJarNameInArgFiles(
    cachePath,
    version,
    generatedJar.basename()
  );
  if (isError(replaceRes)) return replaceRes;

  return await generatedJar.rename(getJarPath(cachePath));
}

/**
 * 起動スクリプトから`@path`形式で参照されている引数ファイルのパスを列挙する
 *
 * 実行中のOSで使わない側のスクリプトも対象とするが，その書式が想定外でも失敗させずに読み飛ばす
 * （実行中のOSのスクリプトの書式は`getNewForgeArgs()`で検証される）
 *
 * @param cachePath 起動スクリプトが置かれたフォルダ（起動スクリプトはリネーム済みであること）
 * @param version 対象のバージョン（起動スクリプトのパスの決定に使う）
 * @returns 引数ファイルのパスの一覧（起動スクリプトがないバージョンでは空配列）
 */
async function getArgFilePaths(
  cachePath: Path,
  version: ForgeVersion | NeoForgeVersion
): Promise<Path[]> {
  const argFiles: Path[] = [];
  for (const ext of RUN_SCRIPTS.values()) {
    const scriptPath = constructExecPath(cachePath, version, ext);
    if (!scriptPath.exists()) continue;

    const args = await readScriptArgs(scriptPath, ext);
    if (isError(args)) continue;

    argFiles.push(
      ...args
        .filter((arg) => arg.startsWith('@'))
        .map((arg) => cachePath.child(arg.slice(1)))
    );
  }
  return argFiles;
}

/**
 * 起動スクリプトが参照する引数ファイル内のjar名を`version.jar`に置き換える
 *
 * Forge 1.20.3 以降のインストーラは，`win_args.txt` / `unix_args.txt`内でjarを元のファイル名で参照する
 * （例：`-jar forge-26.2-65.1.3-shim.jar`）。ServerStarterはjarを`version.jar`に統一しているため，
 * 参照先も合わせて書き換える。起動スクリプトがないバージョンでは何もしない。
 *
 * @param cachePath `installer.jar`を実行したフォルダ（起動スクリプトはリネーム済みであること）
 * @param version 対象のバージョン（起動スクリプトのパスの決定に使う）
 * @param originalJarName `version.jar`にリネームする前のjarのファイル名
 * @returns 引数ファイルの読み書きに失敗した場合はエラー
 */
async function replaceJarNameInArgFiles(
  cachePath: Path,
  version: ForgeVersion | NeoForgeVersion,
  originalJarName: string
): Promise<Failable<void>> {
  const jarName = getJarPath(cachePath).basename();

  for (const argFile of await getArgFilePaths(cachePath, version)) {
    const txt = await argFile.readText();
    if (isError(txt)) return txt;

    // 空白区切りの各トークンのうち，元のjar名と完全に一致するものだけを置き換える（区切り文字はそのまま残す）
    const replaced = txt
      .split(/(\s+)/)
      .map((token) => (token === originalJarName ? jarName : token))
      .join('');
    if (replaced === txt) continue;

    const writeRes = await argFile.writeText(replaced);
    if (isError(writeRes)) return writeRes;
  }
}

/**
 * 引数ファイルが，存在しない`installer.jar`の生成jarを参照しているかを判定する
 *
 * 引数ファイルの書き換えに対応する前のバージョンで準備したForge 1.20.3 以降のキャッシュは，
 * `version.jar`はあるが引数ファイルが元のjar名を参照したままで起動できない。そのようなキャッシュの検出に使う。
 *
 * 再インストールで直せない参照（生成jar以外のjar）まで検出すると起動のたびに再インストールが走るため，
 * `renameFilesFromInstaller()`が書き換え対象とする生成jarのファイル名への参照に限って判定する
 *
 * @param cachePath キャッシュフォルダ
 * @param version 対象のバージョン（生成jarのファイル名の判別に使う）
 * @returns 存在しない生成jarを参照する引数ファイルがあれば`true`
 */
export async function hasMissingJarReference(
  cachePath: Path,
  version: ForgeVersion | NeoForgeVersion
): Promise<boolean> {
  // モジュールパスのように複数のパスを連結したトークンの一部に誤って一致しないよう，トークン全体での一致に限る
  const jarPattern = new RegExp(
    `^(?:${GENERATED_JAR_PATTERNS[version.type].source})$`
  );

  for (const argFile of await getArgFilePaths(cachePath, version)) {
    const txt = await argFile.readText();
    if (isError(txt)) continue;

    const missing = txt
      .split(/\s+/)
      .filter((token) => jarPattern.test(token))
      .some((jarName) => !cachePath.child(jarName).exists());
    if (missing) return true;
  }
  return false;
}
