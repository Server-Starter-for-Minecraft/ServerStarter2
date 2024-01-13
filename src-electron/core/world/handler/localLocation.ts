import { WorldContainer, WorldName } from "app/src-electron/schema/brands"
import { worldContainerToPath } from "../worldContainer"
import { Path } from "app/src-electron/util/path"
import { WorldEdited } from "app/src-electron/schema/world"


export class WorldLocalLocation {
    readonly container: WorldContainer
    readonly name: WorldName
    readonly path: Path

    constructor(name: WorldName, container: WorldContainer) {
        this.name = name
        this.container = container
        this.path = worldContainerToPath(this.container).child(this.name);
    }

    static fromWorldEdited(worldEdited: WorldEdited) {
        return new WorldLocalLocation(worldEdited.name, worldEdited.container)
    }

    /** WorldLocalLocationが同一かどうかチェック */
    eq(other: WorldLocalLocation) {
        return this.path.path === other.path.path
    }
}

export async function moveLocalData(from: WorldLocalLocation, to: WorldLocalLocation) {
    // パスに変化がない場合はなにもしない
    if (from.eq(to)) return;

    // 保存ディレクトリを移動する
    await from.path.moveTo(to.path);
}
