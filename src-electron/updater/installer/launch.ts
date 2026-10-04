import { spawn } from 'child_process';

/**
 * アプリの終了後も動作し続ける子プロセスとして、インストーラーを起動する
 *
 * プロセスの起動に成功したか（spawnイベント）・失敗したか（errorイベント）を待ってから結果を返す。
 * 起動したスクリプト内のコマンドの成否はアプリの終了後に判明するため、ここでは確認できない
 * （その場合は次回起動時に、自動アップデートの実行記録からアップデートの失敗を検知する）。
 *
 * @param command 起動するコマンド
 * @param args コマンドの引数
 * @param cwd 作業ディレクトリ
 * @param shell シェルを介して起動するか（Windowsの`start`など、シェルの組み込みコマンドを使う場合に指定）
 * @returns プロセスを起動できた場合はtrue
 */
export function launchDetached(
  command: string,
  args: string[],
  cwd: string,
  shell = true
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
