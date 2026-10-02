import { recordValueFilter } from 'app/src-public/scripts/obj/objFillter';
import { sortValue } from 'app/src-public/scripts/obj/objSort';
import { WorldContainerSetting } from 'app/src-electron/schema/system';
import type { WorldList } from './WorldStore';

/**
 * 渡されたワールドリストを更新日時順（新しい順）にソートする
 *
 * @param wList ワールドリスト
 * @returns 表示順に並べ替えたワールドリスト
 */
export function sortWorldList(wList: WorldList) {
  return sortValue(wList, (a, b) => {
    if (a.type === 'edited' && b.type === 'edited') {
      return (b.world.last_date ?? 0) - (a.world.last_date ?? 0);
    } else {
      return 0;
    }
  });
}

/**
 * コンテナの設定に基づいて、画面に表示するワールドのみに絞り込む
 *
 * @param wList ワールドリスト
 * @param containers システム設定に登録されたワールドフォルダ（コンテナ）の一覧
 * @returns 表示中のコンテナに属するワールドのみのワールドリスト
 */
export function filterWorldContainer(
  wList: WorldList,
  containers: WorldContainerSetting[]
) {
  const visibleContainers = new Set(
    containers.filter((c) => c.visible).map((c) => c.container)
  );
  return recordValueFilter(wList, (w) =>
    visibleContainers.has(w.world.container)
  );
}
