/**
 * `electron` パッケージを読み込めない環境を再現する Bun の preload
 *
 * （Bun の型定義を入れていないため，型検査・型情報を使う lint の対象外となる JavaScript で書く）
 *
 * `bun --preload ./test/util/blockElectron.js <スクリプト>` で実行すると，
 * スクリプトが（間接的にでも）`electron` を読み込んだ時点で失敗する。
 * Electron を入れずに実行する CI（Build のワークフローなど）と同じ条件で，スクリプトが動くことの確認に使う
 */
import { plugin } from 'bun';

await plugin({
  name: 'block-electron',
  setup(build) {
    // Bun の実行時のプラグインはパッケージ名での解決（onResolve）を差し替えられないため，
    // `electron` パッケージの本体のファイルを読み込む時点で失敗させる
    build.onLoad(
      { filter: /[\\/]node_modules[\\/]electron[\\/]index\.js$/ },
      () => {
        throw new Error('electron is blocked in this process');
      }
    );
  },
});
