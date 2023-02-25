import { World } from './world/world';


export function runDummy(event: Electron.IpcMainEvent, world:World) {
    // サーバーJARの起動（入出力のチェックができること）
    runServer(world)

    // リモート関連のプログレスバー

    // Eulaの同意（失敗した場合などのエラー処理も）

    // 二，三個の適当なプロセスもどき


    // フロントとバックの通信にはElectronのIPCを使う（https://www.electronjs.org/ja/docs/latest/tutorial/ipc）

}

function runServer(world:World) {
    // サーバーの起動
    // TODO: 「Piniaがインストールされていない」と言われるエラーの解決
    // const world = worldStore().world
    console.log(world.version.verType)

    // 画面遷移

    // 表示画面にコンソールの中身を順次転送

    // コマンド



}