import { toRaw } from 'vue';
import { defineStore } from 'pinia';
import { keys, values } from 'app/src-public/scripts/obj/obj';
import { recordValueFilter } from 'app/src-public/scripts/obj/objFillter';
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
import { useWorldStore } from './WorldStore';

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
    world(state) {
      const worldStore = useWorldStore();
      const returnWorld = worldStore.worldList[state.selectedWorldID];

      if (returnWorld?.type === 'abbr') {
        return undefined;
      }

      if (returnWorld !== void 0) {
        // バージョンの更新（ワールドを選択し直すタイミングでバージョンの変更を反映）
        state.selectedVersionType = returnWorld.world.version.type;
      }

      return returnWorld?.world;
    },
    allWorlds(state) {
      const worldStore = useWorldStore();
      return {
        update: (func: (world: WorldEdited) => void) => {
          values(worldStore.worldList).forEach((w) => {
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
        worlds: worldStore.worldList,
        filteredWorlds: filterSearchingWorld(state.worldSearchText),
      };
    },
    /**
     * バージョンダウンの警告ダイアログのような，
     * 以前のデータとの比較が必要な処理への利用を想定する
     */
    worldBack(state): WorldEdited | undefined {
      const worldStore = useWorldStore();
      return worldStore.worldListBack[state.selectedWorldID];
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
 * ワールド一覧に描画するワールドリスト，
 * TODO: WorldEdited出ない場合を考慮して，IDの一覧を返す仕様に変更？
 */
function filterSearchingWorld(searchText: string | null) {
  const worldStore = useWorldStore();
  // 検索BOXのClearボタンを押すとworldSearchTextにNullが入るため，３項演算子によるNullチェックも付加
  // 原因はSearchWorldViewのupdateSelectedWorld()にてshowingWorldListを呼び出しているため
  // TODO: 上記のリファクタリングにより，３項演算子を廃止
  const editText = zen2han(searchText ?? '')
    .trim()
    .toLowerCase();

  let returnWorlds = worldStore.sortedWorldList;
  if (editText !== '') {
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
            : true;
        // バージョン名に一致
        const hitVer =
          w.type === 'edited' ? w.world.version.id.match(t) !== null : true;
        return hitName || hitVerType || hitVer;
      });
    });

    // 選択中のワールドがリスト圏外になった場合は選択を解除
    const mainStore = useMainStore();
    if (!keys(returnWorlds).includes(mainStore.selectedWorldID)) {
      mainStore.selectedWorldID = '' as WorldID;
    }
  }

  return returnWorlds;
}
