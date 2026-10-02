import {
  filterWorldContainer,
  sortWorldList,
} from 'app/src/stores/worldListUtils';
import type { WorldList } from 'app/src/stores/WorldStore';
import { keys } from 'app/src-public/scripts/obj/obj';
import { WorldContainerSetting } from 'app/src-electron/schema/system';
import { WorldID } from 'app/src-electron/schema/world';

/**
 * ワールドを削除した後に表示するワールドを決める
 *
 * 非表示のワールドフォルダに属するワールドは画面に表示できないため、表示中のワールドのみを候補とし、
 * ワールド一覧の表示順で先頭のワールドを選ぶ
 *
 * @param worlds 読み込まれている全てのワールド
 * @param containers システム設定に登録されたワールドフォルダ（コンテナ）の一覧
 * @param removedID 削除するワールドのID
 * @returns 次に表示するワールドID（表示できるワールドが残らない場合はundefined）
 */
export function nextWorldAfterDeletion(
  worlds: WorldList,
  containers: WorldContainerSetting[],
  removedID: WorldID
): WorldID | undefined {
  const visibleWorlds = sortWorldList(filterWorldContainer(worlds, containers));
  return keys(visibleWorlds).find((id) => id !== removedID);
}
