/**
 * Forge / NeoForge の準備処理のテストで共通して使う，`installer.jar`の出力を模したファイル群と補助関数
 *
 * テスト専用（本番コードからは参照しない）
 */
import path from 'path';
import {
  ForgeVersion,
  NeoForgeVersion,
  VersionId,
} from 'app/src-electron/schema/version';
import { Path } from 'app/src-electron/util/binary/path';
import { isError } from 'app/src-electron/util/error/error';

/** テスト用のForgeのバージョン */
export function forgeVersion(
  id: string,
  forgeVersion: string,
  downloadURL = ''
): ForgeVersion {
  return {
    type: 'forge',
    id: id as VersionId,
    forge_version: forgeVersion,
    download_url: downloadURL,
  };
}

/** テスト用のNeoForgeのバージョン */
export function neoForgeVersion(
  id: string,
  neoForgeVersion: string
): NeoForgeVersion {
  return {
    type: 'neoforge',
    id: id as VersionId,
    neoforge_version: neoForgeVersion,
  };
}

/**
 * ファイル群を書き出す
 *
 * @param cwd 書き出し先のフォルダ
 * @param files `cwd`からの相対パスとファイル内容の対応
 */
export async function writeFiles(cwd: Path, files: Record<string, string>) {
  await Promise.all(
    Object.entries(files).map(([f, content]) => cwd.child(f).writeText(content))
  );
}

/**
 * 起動スクリプトが引数ファイルを参照する構成のファイル群
 *
 * @param argsDir 引数ファイルを置くフォルダ（カレントディレクトリからの相対パス）
 * @param args 引数ファイルの内容
 */
export function scriptInstallerOutputs(argsDir: string, args: string) {
  return {
    'run.bat': [
      '@echo off',
      `java @user_jvm_args.txt @${argsDir}/win_args.txt %*`,
      'pause',
    ].join('\r\n'),
    'run.sh': [
      '#!/usr/bin/env sh',
      `java @user_jvm_args.txt @${argsDir}/unix_args.txt "$@"`,
    ].join('\n'),
    'user_jvm_args.txt': '# JVM args',
    [`${argsDir}/win_args.txt`]: args,
    [`${argsDir}/unix_args.txt`]: args,
  };
}

/**
 * Forge 1.20.3 以降の現行インストーラと同じ構成のファイル群
 *
 * 起動スクリプトは引数ファイルを参照し，引数ファイル内でjarを元のファイル名で指定する
 */
export function shimInstallerOutputs(mcVer: string, forgeVer: string) {
  const id = `${mcVer}-${forgeVer}`;
  return {
    [`forge-${id}-shim.jar`]: 'shim',
    ...scriptInstallerOutputs(
      `libraries/net/minecraftforge/forge/${id}`,
      `-Djava.net.preferIPv6Addresses=system -jar forge-${id}-shim.jar\n`
    ),
  };
}

/** Forge 1.17〜1.20.2 / NeoForge のように，引数ファイルでモジュールパス等を指定し，jarを直接起動しない構成の引数 */
export const MODULE_ARGS = [
  '-p libraries/a/a.jar;libraries/b/b.jar',
  '--add-modules ALL-MODULE-PATH',
  '-DlibraryDirectory=libraries',
  'cpw.mods.bootstraplauncher.BootstrapLauncher',
  '--launchTarget forgeserver',
  '',
].join('\n');

/**
 * Javaの起動引数のうち`@path`形式の引数ファイルを，Javaと同様に中身へ展開する
 *
 * @param cwd サーバーのカレントディレクトリ
 * @param args Javaの起動引数
 */
export async function expandArgFiles(cwd: Path, args: string[]) {
  const expanded: string[] = [];
  for (const arg of args) {
    if (!arg.startsWith('@')) {
      expanded.push(arg);
      continue;
    }
    const txt = await cwd.child(arg.slice(1)).readText();
    if (isError(txt)) throw new Error(`missing arg file: ${arg}`);
    expanded.push(...txt.split(/\s+/).filter((s) => s !== ''));
  }
  return expanded;
}

/**
 * 展開済みの起動引数から，`-jar`で指定されるjarのパスを求める
 *
 * @param cwd サーバーのカレントディレクトリ
 * @param expandedArgs `expandArgFiles()`で展開した起動引数
 */
export function findLaunchJar(cwd: Path, expandedArgs: string[]) {
  const jarIdx = expandedArgs.indexOf('-jar');
  if (jarIdx === -1) throw new Error('-jar is not specified');
  // Javaと同様に，相対パスはカレントディレクトリを基準に解決する
  const jar = expandedArgs[jarIdx + 1];
  return path.isAbsolute(jar) ? new Path(jar) : cwd.child(jar);
}
