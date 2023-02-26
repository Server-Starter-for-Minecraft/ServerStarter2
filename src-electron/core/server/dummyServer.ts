import { setProgressStatus } from '../utils/senders';
import { sleep } from '../utils/testTools';
import { World } from './world/world';

// 処理フロー
// １．フロントがProgressPageに遷移
// ２．フロントからバックのrunServer()を呼び出し
// ３．runServer()の終了をフロントに通知
// ４．通知を受けてフロントがConsolePageに遷移
// ５．バックよりConsolePageの内容を更新
// （６．フロントよりコマンド入力を受けた場合，バックにコマンドを渡して処理）
export async function runDummy(event: Electron.IpcMainInvokeEvent, world:World) {
    // TODO: Windowがsend()を受けられる状態になったことを検知する手法があればsleep(0.5)は不要
    await sleep(0.5)

    setProgressStatus(`${world.version.name} / ${world.name}を起動中`)
    // サーバーJARの起動（入出力のチェックができること）
    runServer(world)

    // リモート関連のプログレスバー

    // Eulaの同意（失敗した場合などのエラー処理も）

    // 二，三個の適当なプロセスもどき
    await sleep(5)
    setProgressStatus('5秒経ったよ')
    await sleep(2)


    // フロントとバックの通信にはElectronのIPCを使う（https://www.electronjs.org/ja/docs/latest/tutorial/ipc）

    // 処理の成功可否を返す
    return true
}

function runServer(world:World) {
    // サーバーの起動
    // TODO: 「world.run()は関数でない」と言われるエラーの解決
    console.log(world.version.verType)


    // 表示画面にコンソールの中身を順次転送
    // addConsole('Start')
    // await sleep(2)
    // addConsole('Finished !!')
    // await sleep(2)
    // addConsole('CivilTT is entered the world')



    // コマンド



}