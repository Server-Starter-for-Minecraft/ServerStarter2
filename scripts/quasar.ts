/**
 * Quasar CLI を Electron に同梱されている Node.js で実行する
 *
 * Windows版のBunで Quasar CLI (Vite 8) の dev サーバーを動かすと，
 * Viteのネイティブプラグイン(rolldown)とJS間の非同期コールバックが大きく遅延し，
 * ウィンドウが開いてから画面が表示されるまでの白画面の時間が長くなる
 * (実測: Bun 約14秒 / Node.js 約2.5秒)
 *
 * Node.js を別途インストールしなくてもよいように，Electron を Node.js として利用する
 *
 * 使い方: bun scripts/quasar.ts dev -m electron
 */
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

// electron は src-electron 側の依存としてインストールされている
const requireFromElectronDir = createRequire(
  new URL('../src-electron/package.json', import.meta.url)
);
const electronPath: string = requireFromElectronDir('electron');

const quasarBin = fileURLToPath(
  new URL('../node_modules/@quasar/app-vite/bin/quasar.js', import.meta.url)
);
const unsetRunAsNode = fileURLToPath(
  new URL('./unset-electron-run-as-node.cjs', import.meta.url)
);

const child = spawn(
  electronPath,
  ['--require', unsetRunAsNode, quasarBin, ...process.argv.slice(2)],
  {
    stdio: 'inherit',
    env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' },
  }
);

child.on('exit', (code, signal) => {
  process.exit(code ?? (signal ? 1 : 0));
});
