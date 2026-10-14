import { spawn } from 'child_process';

/**
 * シェルを介さずに、アプリの終了後も動作し続ける子プロセスを起動する（インストーラーの起動に利用する）
 *
 * プロセスの起動に成功したか（spawnイベント）・失敗したか（errorイベント）を待ってから結果を返す。
 * 起動したスクリプト内のコマンドの成否はアプリの終了後に判明するため、ここでは確認できない
 * （その場合は次回起動時に、自動アップデートの実行記録からアップデートの失敗を検知する）。
 *
 * 引数はエスケープせずにそのまま1つずつ渡される
 *
 * @param command 起動する実行ファイル
 * @param args 実行ファイルの引数（1要素が1つの引数となる）
 * @param cwd 作業ディレクトリ
 * @returns プロセスを起動できた場合はtrue
 */
export function launchDetached(
  command: string,
  args: string[],
  cwd: string
): Promise<boolean> {
  return spawnDetached(command, args, cwd, false);
}

/**
 * シェルを介して、アプリの終了後も動作し続ける子プロセスを起動する
 *
 * Windowsの`start`など、シェルの組み込みコマンドを使う場合に利用する。
 * 引数を配列で渡すとエスケープされずに連結される（Node.jsのDEP0190）ため、
 * コマンドライン全体を1つの文字列として受け取る
 *
 * @param commandLine シェルで実行するコマンドライン（呼び出し側で適切にクォートしたもの）
 * @param cwd 作業ディレクトリ
 * @returns プロセスを起動できた場合はtrue
 */
export function launchDetachedInShell(
  commandLine: string,
  cwd: string
): Promise<boolean> {
  return spawnDetached(commandLine, [], cwd, true);
}

/** プロセスを切り離して起動し、起動の成否を返す */
function spawnDetached(
  command: string,
  args: string[],
  cwd: string,
  shell: boolean
): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    const sub = spawn(command, args, {
      cwd,
      env: process.env,
      shell,
      detached: true,
      windowsHide: true,
    });
    sub.once('spawn', () => {
      sub.unref();
      resolve(true);
    });
    sub.once('error', () => resolve(false));
  });
}
