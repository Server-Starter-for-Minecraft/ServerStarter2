import path from 'path';
import { Path } from 'app/src-electron/util/binary/path';
import {
  ChildProcessPromise,
  interactiveProcess,
} from 'app/src-electron/util/binary/subprocess';

/**
 * 指定したJavaを優先して使わせるための，子プロセスの環境変数を生成する
 *
 * サーバーやインストーラ（Forgeの`installer.jar`，Mohistの初回起動時のライブラリ導入など）が
 * 内部で`java`コマンドを呼び出すと，PCにインストールされているJavaがPATHから見つかり，
 * ServerStarterが用意したJavaとバージョンが食い違って起動に失敗することがある。
 * そこで，用意したJavaの`bin`フォルダをPATHの先頭に追加し，`JAVA_HOME`も合わせて上書きする。
 *
 * @param javaPath ServerStarterが用意したJavaの実行ファイルのパス（`<JAVA_HOME>/bin/java`）
 * @param baseEnv 元にする環境変数（未指定の場合は現在のプロセスの環境変数）
 * @returns PATHと`JAVA_HOME`を書き換えた環境変数
 */
export function javaProcessEnv(
  javaPath: Path,
  baseEnv: NodeJS.ProcessEnv = process.env
): NodeJS.ProcessEnv {
  const binDir = javaPath.absolute().parent();
  const env = { ...baseEnv };

  // WindowsではPATHのキー名の大文字小文字が環境により異なる（`Path`など）ため，
  // 既存のキーをすべて取り除いたうえで1つのキーにまとめる（重複したキーがあると子プロセスでどちらが使われるか不定になる）
  // 複数のキーに値がある場合は，最初に見つかった空でない値を元のPATHとして採用する
  const pathKeys = Object.keys(env).filter((k) => k.toUpperCase() === 'PATH');
  const currentPath = pathKeys.map((k) => env[k]).find((v) => v);
  pathKeys.forEach((k) => delete env[k]);

  env[pathKeys[0] ?? 'PATH'] = [binDir.path, currentPath]
    .filter((v) => v)
    .join(path.delimiter);
  env.JAVA_HOME = binDir.parent().path;
  return env;
}

type InteractiveProcessArgs = Parameters<typeof interactiveProcess>;

/**
 * `interactiveProcess()`の引数のうち，環境変数の位置
 *
 * 引数の並びが変わって位置がずれた場合は，代入する値の型が合わずに型エラーとなる
 */
const ENV_ARG_INDEX = 7;

/**
 * ServerStarterが用意したJavaで，標準入出力をやり取りできる子プロセスを起動する
 *
 * 子プロセスがさらに`java`コマンドを呼び出した場合にも同じJavaが使われるよう，
 * `javaProcessEnv()`で環境変数を設定して起動する。
 * 引数は`interactiveProcess()`と同じ（第1引数が起動するJavaのパス）で，
 * 環境変数を指定した場合はそれを元にPATHと`JAVA_HOME`を書き換える
 */
export function interactiveJavaProcess(
  ...args: InteractiveProcessArgs
): ChildProcessPromise {
  // `interactiveProcess()`の引数が増えても追従できるよう，環境変数（最後の引数）だけを差し替えて委譲する
  const params: InteractiveProcessArgs = [...args];
  params[ENV_ARG_INDEX] = javaProcessEnv(args[0], args[ENV_ARG_INDEX]);
  return interactiveProcess(...params);
}
