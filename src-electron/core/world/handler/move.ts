import { ErrorMessage } from "app/src-electron/schema/error";
import { WorldLocalLocation, moveLocalData } from "./localLocation";
import { isValid } from "app/src-electron/util/error/error";
import { validateNewWorldName } from "../name";

/** ワールドデータを移動しようとする */
export async function tryMove(from: WorldLocalLocation, to: WorldLocalLocation, errors: ErrorMessage[]): Promise<WorldLocalLocation> {
    // LocalLocationに変更があった場合正常な名前かどうかを確認してワールドの保存場所を変更
    if (from.eq(to)) return from

    const newWorldName = await validateNewWorldName(
        to.container,
        to.name
    );

    if (isValid(newWorldName)) {
        // セーブデータを移動
        await moveLocalData(from, to)
        return to
    } else {
        // 移動をキャンセル
        errors.push(newWorldName);
        return from
    }
}
