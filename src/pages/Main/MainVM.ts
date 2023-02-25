import { World } from 'app/src-electron/core/server/world/world';
import { sleep } from 'app/src-electron/core/utils/testTools';
import { setStatus } from '../Progress/ProgressStore';

/**
 * サーバーの起動
 */
export async function runServer(world:World) {
    setStatus(`${world.version.name} / ${world.name}を起動中`)
    window.API.runServer(world)
    sleep(5)
    setStatus('5秒経ったよ')
}