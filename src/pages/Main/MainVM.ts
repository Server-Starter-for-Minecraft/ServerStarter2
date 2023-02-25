import { World } from 'app/src-electron/core/server/world/world';
import { setStatus } from '../Progress/ProgressStore';

/**
 * サーバーの起動
 */
export function runServer(world:World) {
    setStatus(`${world.version.name} / ${world.name}を起動中`)
    window.API.runServer(world)
}