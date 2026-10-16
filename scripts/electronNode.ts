/**
 * Node.js 向けの CLI を Electron に同梱されている Node.js で実行する
 *
 * Node.js を別途インストールしなくてもよいように，Electron を Node.js として利用する
 * (Bun で実行すると正しく動作しない CLI があるため，各スクリプトから利用する)
 */
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

// electron は src-electron 側の依存としてインストールされている
const requireFromElectronDir = createRequire(
  new URL('../src-electron/package.json', import.meta.url)
);
const electronPath: string = requireFromElectronDir('electron');

const unsetRunAsNode = fileURLToPath(
  new URL('./unset-electron-run-as-node.cjs', import.meta.url)
);

/**
 * CLI を Electron の Node.js で実行し，終了コードをそのまま引き継いでプロセスを終了する
 *
 * @param cliPath 実行する CLI のエントリポイント（リポジトリルートからの相対パス）
 * @param args CLI に渡す引数
 */
export function runWithElectronNode(cliPath: string, args: string[]) {
  const cli = fileURLToPath(new URL(`../${cliPath}`, import.meta.url));

  const child = spawn(
    electronPath,
    ['--require', unsetRunAsNode, cli, ...args],
    {
      stdio: 'inherit',
      env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' },
    }
  );

  // Electron が見つからない・起動できない場合は原因を表示して失敗扱いにする
  child.on('error', (err) => {
    console.error(`Failed to launch Electron (${electronPath}):`, err);
    process.exit(1);
  });

  child.on('exit', (code, signal) => {
    process.exit(code ?? (signal ? 1 : 0));
  });
}
