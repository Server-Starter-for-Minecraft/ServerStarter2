/**
 * vue-tsc による型チェックを Electron に同梱されている Node.js で実行する
 *
 * vue-tsc は TypeScript の読み込み処理に介入して `.vue` を型チェックの対象に加えるが，
 * Bun で実行するとこの介入が効かず，`.vue` が一切チェックされないままエラー 0 件となってしまう
 * (Node.js が入っていない環境では `bun run` が CLI を Bun で実行するため，必ず Node.js で実行する)
 *
 * 使い方: bun scripts/typecheck.ts
 */
import { runWithElectronNode } from './electronNode';

runWithElectronNode('node_modules/vue-tsc/bin/vue-tsc.js', [
  '--noEmit',
  ...process.argv.slice(2),
]);
