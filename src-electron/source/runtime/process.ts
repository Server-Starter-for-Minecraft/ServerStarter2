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
  const pathKeys = Object.keys(env).filter((k) => k.toUpperCase() === 'PATH');
  const currentPath = pathKeys.map((k) => env[k]).find((v) => v);
  pathKeys.forEach((k) => delete env[k]);

  env[pathKeys[0] ?? 'PATH'] = [binDir.path, currentPath]
    .filter((v) => v)
    .join(path.delimiter);
  env.JAVA_HOME = binDir.parent().path;
  return env;
}

/**
 * ServerStarterが用意したJavaで，標準入出力をやり取りできる子プロセスを起動する
 *
 * 子プロセスがさらに`java`コマンドを呼び出した場合にも同じJavaが使われるよう，
 * `javaProcessEnv()`で環境変数を設定して起動する。引数は`interactiveProcess()`と同じ
 *
 * @param javaPath 起動するJavaの実行ファイルのパス
 * @param args Javaに渡す引数（1要素が1つの引数となる）
 * @param onout 標準出力を受け取るコールバック（未指定の場合は出力を破棄する）
 * @param onerr 標準エラー出力を受け取るコールバック（未指定の場合は出力を破棄する）
 * @param cwd 作業ディレクトリ
 * @param beforeKill プロセスをkillする前に実行する処理
 * @param beforeKillTimeout `beforeKill`の完了を待つ最大時間（ミリ秒）
 */
export function interactiveJavaProcess(
  javaPath: Path,
  args: string[],
  onout: ((chunk: string) => void) | undefined,
  onerr: ((chunk: string) => void) | undefined,
  cwd: Path | undefined = undefined,
  beforeKill: (child: ChildProcessPromise) => void | Promise<void> = () => {},
  beforeKillTimeout = 1000
): ChildProcessPromise {
  return interactiveProcess(
    javaPath,
    args,
    onout,
    onerr,
    cwd,
    beforeKill,
    beforeKillTimeout,
    javaProcessEnv(javaPath)
  );
}
