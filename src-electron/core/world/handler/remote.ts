import { isError } from "app/src-electron/util/error/error";
import { GroupProgressor } from "../../progress/progress";
import { pullRemoteWorld, pushRemoteWorld } from "../../remote/remote";
import { WorldLocalLocation } from "./localLocation";
import { WorldSettings } from "../files/json";

/** リモートがあるかをチェックして、ある場合はpull */
export async function pull(location: WorldLocalLocation, settings: WorldSettings, progress?: GroupProgressor) {
    // リモートが存在する場合Pull
    if (settings.remote) {
        const remote = settings.remote;
        const savePath = location.path;

        const pull = await pullRemoteWorld(
            savePath,
            remote,
            progress?.subGroup()
        );

        // Pullに失敗した場合エラー
        if (isError(pull)) return pull;
    }
}

export async function push(location: WorldLocalLocation, settings: WorldSettings, progress?: GroupProgressor) {
    // リモートが存在する場合Push
    const remote = settings.remote;
    if (remote) {
        const savePath = location.path;
        const push = await pushRemoteWorld(savePath, remote, progress?.subGroup());

        // Pushに失敗した場合エラー
        if (isError(push)) return push;
    }
}
