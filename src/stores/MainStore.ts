import { toRaw } from 'vue';
import { defineStore } from 'pinia';
import { deepcopy } from 'app/src-public/scripts/deepcopy';
import { values } from 'app/src-public/scripts/obj/obj';
import { recordValueFilter } from 'app/src-public/scripts/obj/objFillter';
import { sortValue } from 'app/src-public/scripts/obj/objSort';
import { WorldName } from 'app/src-electron/schema/brands';
import { Version } from 'app/src-electron/schema/version';
import {
  World,
  WorldAbbr,
  WorldEdited,
  WorldID,
} from 'app/src-electron/schema/world';
import { zen2han } from 'src/scripts/textUtils';
import { $T, tError } from 'src/i18n/utils/tFunc';
import { checkError } from 'src/components/Error/Error';
import { useSystemStore } from './SystemStore';
import { __getWorldList, __getWorldListBack, WorldList } from './WorldStore';

export const useMainStore = defineStore('mainStore', {
  state: () => {
    return {
      selectedWorldID: '' as WorldID,
      inputWorldName: '' as WorldName,
      worldSearchText: '',
      errorWorlds: new Set<WorldID>(),
      selectedVersionType: 'vanilla' as Version['type'],
      worldIPs: {} as Record<WorldID, string>,
    };
  },
  getters: {
    /**
     * WorldEditedを返し，WorldAbbrの時にはundefinedを返す
     *
     * WorldAbbrも含めて共通の要素を取得したい場合は
     * `allWorlds.readonlyWorlds[selectedWorldID]`で呼び出す
     */
    world(state) {
      const returnWorld = __getWorldList()[state.selectedWorldID];

      if (returnWorld?.type === 'abbr') {
        return undefined;
      }

      if (returnWorld !== void 0) {
        // バージョンの更新（ワールドを選択し直すタイミングでバージョンの変更を反映）
        state.selectedVersionType = returnWorld.world.version.type;
      }

      return returnWorld?.world;
    },
    readonlyWorld(state) {
      return deepcopy(__getWorldList()[state.selectedWorldID]);
    },
    allWorlds(state) {
      return {
        update: (func: (world: WorldEdited) => void) => {
          values(__getWorldList()).forEach((w) => {
            if (w.type === 'edited') {
              func(w.world);

              // App.vueのSubscriberは表示中のワールドに対する更新を行うため，
              // 非表示ワールドの更新は別途ここで作動させる
              window.API.invokeSetWorld(toRaw(w.world)).then((v) => {
                checkError(v.value, undefined, (e) => tError(e));
              });
            }
          });
        },
        readonlyWorlds: deepcopy(__getWorldList()),
        filteredWorlds: (searchText?: string) => {
          const wList = filterSearchingText(
            filterWorldContainer(__getWorldList()),
            searchText ?? state.worldSearchText
          );
          return sortWorldList(wList);
        },
      };
    },
    /**
     * 通常のworldと異なり，内部データを変更してもSetWorldが呼び出されない
     * 遅延評価でWorldデータを手動で更新する際に利用できる
     */
    noSubscribeWorld(state) {
      const worldStore = useWorldStore();
      return deepcopy(worldStore.worldList[state.selectedWorldID]);
    },
    /**
     * バージョンダウンの警告ダイアログのような，
     * 以前のデータとの比較が必要な処理への利用を想定する
     */
    worldBack(state): WorldEdited | undefined {
      return __getWorldListBack()[state.selectedWorldID];
    },
    /**
     * Ngrokを考慮したIPアドレスを返す
     */
    worldIP(state) {
      const sysStore = useSystemStore();
      return state.worldIPs[state.selectedWorldID] ?? sysStore.publicIP;
    },
  },
  actions: {
    /**
     * ワールドIDで設定したワールドを表示する
     */
    showWorld(world: World | WorldEdited | WorldAbbr) {
      this.selectedWorldID = world.id;
      this.inputWorldName = world.name;
    },
    /**
     * 表示するワールドの選択を解除して，何も表示しない
     */
    unsetWorld() {
      this.selectedWorldID = '' as WorldID;
    },
    /**
     * NgrokからIPの割り当てがあった際にIPアドレスを更新する
     */
    setWorldIP(worldID: WorldID, ip?: string) {
      if (ip && ip !== '') {
        this.worldIPs[worldID] = ip;
      }
    },
    /**
     * Ngrokより割り当てられたIPアドレスを削除する（サーバー終了時を想定）
     */
    removeWorldIP(worldID: WorldID) {
      delete this.worldIPs[worldID];
    },
  },
});

/**
 * 渡されたワールドリストを更新日時順にソート
 */
function sortWorldList(wList: WorldList) {
  return sortValue(wList, (a, b) => {
    if (a.type === 'edited' && b.type === 'edited') {
      return (b.world.last_date ?? 0) - (a.world.last_date ?? 0);
    } else {
      return 0;
    }
  });
}

/**
 * コンテナの設定に基づいて表示するワールドをフィルタ
 */
function filterWorldContainer(wList: WorldList) {
  const sysStore = useSystemStore();
  const visibleContainers = new Set(
    sysStore.systemSettings.container
      .filter((c) => c.visible)
      .map((c) => c.container)
  );
  return recordValueFilter(wList, (w) =>
    visibleContainers.has(w.world.container)
  );
}

/**
 * 検索ワードを下記の項目についてチェックし，マッチするワールドを返す
 *
 * - ワールド名称に一致
 * - サーバー種類の名称
 * - サーバーバージョン
 *
 * なお，スペース区切りはAND検索とする
 */
function filterSearchingText(wList: WorldList, searchText: string) {
  if (searchText == '') {
    return wList;
  }

  // 検索ワードを正規化して検索を最適化する
  const editText = zen2han(searchText ?? '')
    .trim()
    .toLowerCase();

  let returnWorlds = wList;
  // スペース区切りのAND検索
  editText.split(' ').forEach((t) => {
    returnWorlds = recordValueFilter(returnWorlds, (w) => {
      // ワールド名称に一致
      const hitName = w.world.name.toLowerCase().match(t) !== null;
      // サーバー種類に一致
      const hitVerType =
        w.type === 'edited'
          ? w.world.version.type.match(t) !== null ||
            $T(`home.serverType.${w.world.version.type}`).match(t) !== null
          : false;
      // バージョン名に一致
      const hitVer =
        w.type === 'edited' ? w.world.version.id.match(t) !== null : false;
      return hitName || hitVerType || hitVer;
    });
  });

  return returnWorlds;
}
