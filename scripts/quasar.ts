/**
 * Quasar CLI を Electron に同梱されている Node.js で実行する
 *
 * Windows版のBunで Quasar CLI (Vite 8) の dev サーバーを動かすと，
 * Viteのネイティブプラグイン(rolldown)とJS間の非同期コールバックが大きく遅延し，
 * ウィンドウが開いてから画面が表示されるまでの白画面の時間が長くなる
 * (実測: Bun 約14秒 / Node.js 約2.5秒)
 *
 * 使い方: bun scripts/quasar.ts dev -m electron
 */
import { runWithElectronNode } from './electronNode';

runWithElectronNode(
  'node_modules/@quasar/app-vite/bin/quasar.js',
  process.argv.slice(2)
);
