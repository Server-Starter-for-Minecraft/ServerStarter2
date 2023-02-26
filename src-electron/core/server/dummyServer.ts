import { addConsole, setProgressStatus } from '../utils/senders';
import { sleep } from '../utils/testTools';
import { World } from './world/world';

// 処理フロー
// １．フロントがProgressPageに遷移
// ２．フロントからバックのrunServer()を呼び出し
// ３．runServer()の終了をフロントに通知
// ４．通知を受けてフロントがConsolePageに遷移
// ５．バックよりConsolePageの内容を更新
// （６．フロントよりコマンド入力を受けた場合，バックにコマンドを渡して処理）
export async function readyDummy(event: Electron.IpcMainInvokeEvent, world:World) {
    // TODO: Windowがsend()を受けられる状態になったことを検知する手法があればsleep(0.5)は不要
    await sleep(0.5)

    setProgressStatus(`${world.version.name} / ${world.name}を起動中`)
    await sleep(5)

    // リモート関連のプログレスバー
    const array = [...Array(101)].map((_, i) => i)
    for (let i = 0; i < array.length; i++) {
        setProgressStatus('データをダウンロード中', i)
        await sleep(0.1)
    }

    // Eulaの同意（失敗した場合などのエラー処理も）

    // 二，三個の適当なプロセスもどき
    await sleep(2)
    setProgressStatus('適当なプロセス')
    await sleep(2)
    setProgressStatus('サーバーを起動するよ')
    await sleep(1)
}

export async function runDummy(event: Electron.IpcMainInvokeEvent, world:World) {
    // TODO: Windowがsend()を受けられる状態になったことを検知する手法があればsleep(0.5)は不要
    await sleep(0.5)

    // サーバーの起動
    // TODO: 「world.run()は関数でない」と言われるエラーの解決
    console.log(world.version.verType)
    // world.run()


    // 表示画面にコンソールの中身を順次転送
    addConsole('Start')
    await sleep(2)
    addConsole('Finished !!')
    await sleep(2)
    addConsole('CivilTT is entered the world')



    // コマンド



}