import { WorldID } from 'app/src-electron/schema/world';

/**
 * ワールドを削除した後に表示するワールドを決める
 *
 * 非表示のコンテナに属するワールドは画面に表示できないため、表示中のワールドのみを候補とする
 *
 * @param visibleWorldIDs 画面上のワールド一覧に表示されているワールドID（表示順）
 * @param removedID 削除するワールドのID
 * @returns 次に表示するワールドID（表示できるワールドが残らない場合はundefined）
 */
export function nextWorldAfterDeletion(
  visibleWorldIDs: WorldID[],
  removedID: WorldID
): WorldID | undefined {
  return visibleWorldIDs.find((id) => id !== removedID);
}
