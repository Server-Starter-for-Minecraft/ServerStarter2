import { World } from 'app/src-electron/core/server/world/world';
import { sleep } from 'app/src-electron/core/utils/testTools';
import { useRouter } from 'vue-router';
import { addConsole } from '../Console/ConsoleStore';
import { setStatus } from '../Progress/ProgressStore';

/**
 * サーバーの起動
 * 現状のコードは動作確認を主としているため，設計上のコード配置は変更の必要あり
 */
export async function runServer(world:World) {
    setStatus(`${world.version.name} / ${world.name}を起動中`)
    window.API.runServer(world)
    await sleep(5)
    setStatus('5秒経ったよ')
    await sleep(5)
    
    useRouter().push('/console')
    addConsole('Start')
    await sleep(2)
    addConsole('Finished !!')
    await sleep(2)
    addConsole('CivilTT is entered the world')
}