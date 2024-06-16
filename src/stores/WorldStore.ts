import { toRaw } from 'vue';
import { defineStore } from 'pinia';
import { deepcopy } from 'app/src-public/scripts/deepcopy';
import { isError, isValid } from 'app/src-public/scripts/error';
import { fromEntries, toEntries } from 'app/src-public/scripts/obj/obj';
import { recordValueFilter } from 'app/src-public/scripts/obj/objFillter';
import { sortValue } from 'app/src-public/scripts/obj/objSort';
import {
  World,
  WorldAbbr,
  WorldEdited,
  WorldID,
} from 'app/src-electron/schema/world';
import { assets } from 'src/assets/assets';
import { tError } from 'src/i18n/utils/tFunc';
import { checkError, ErrorFuncReturns } from 'src/components/Error/Error';
import { useConsoleStore } from './ConsoleStore';
import { useMainStore } from './MainStore';
import { useSystemStore } from './SystemStore';

export type WorldItem =
  | { type: 'edited'; world: WorldEdited; error?: ErrorFuncReturns }
  | { type: 'abbr'; world: WorldAbbr; error?: ErrorFuncReturns };

/**
 * Worldの変更を検知するためのStore
 */
export const useWorldStore = defineStore('worldStore', {
  state: () => {
    return {
      worldListBack: {} as Record<WorldID, WorldEdited>,
      worldList: {} as Record<WorldID, WorldItem>,
    };
  },
  getters: {
    sortedWorldList(state) {
      const sysStore = useSystemStore();
      const visibleContainers = new Set(
        sysStore.systemSettings.container
          .filter((c) => c.visible)
          .map((c) => c.container)
      );
      return sortValue(
        // 表示設定にしていたコンテナのみを描画対象にする
        recordValueFilter(state.worldList, (w) =>
          visibleContainers.has(w.world.container)
        ),
        (a, b) => {
          if (a.type === 'edited' && b.type === 'edited') {
            return (b.world.last_date ?? 0) - (a.world.last_date ?? 0);
          } else {
            return 0;
          }
        }
      );
    },
  },
});

/**
 * ワールドを新規作成する
 */
export async function createNewWorld(duplicateWorldID?: WorldID) {
  async function createrNew() {
    // NewWorldを生成
    const world = (await window.API.invokeNewWorld()).value;
    if (isError(world)) {
      return world;
    }

    // set default icon
    world.avater_path = assets.png.unset;

    // set owner player
    const ownerPlayer = useSystemStore().systemSettings.user.owner;
    if (ownerPlayer) {
      const res = await window.API.invokeGetPlayer(ownerPlayer, 'uuid');
      checkError(
        res,
        (p) => {
          if (isValid(world.players)) {
            world.players.push({
              name: p.name,
              uuid: p.uuid,
              op: { level: 4, bypassesPlayerLimit: false },
            });
          }
        },
        (e) =>
          tError(e, {
            titleKey: 'error.errorDialog.failOPForOwner',
            descKey: `error.${e.key}.title`,
          })
      );
    }

    // NewWorldを実データに書き出す
    return (await window.API.invokeCreateWorld(world)).value;
  }

  async function createrDuplicate(_duplicateWorldID: WorldID) {
    return (await window.API.invokeDuplicateWorld(_duplicateWorldID)).value;
  }

  const mainStore = useMainStore();
  const worldStore = useWorldStore();
  const consoleStore = useConsoleStore();
  // NewWorldをFrontのリストに追加する
  const res = await (duplicateWorldID
    ? createrDuplicate(duplicateWorldID)
    : createrNew());
  let returnWorldID: WorldID | undefined;
  checkError(
    res,
    (world) => {
      returnWorldID = world.id;
      worldStore.worldList[world.id] = { type: 'edited', world: toRaw(world) };
      mainStore.showWorld(world);
      consoleStore.initTab(world.id);
    },
    (e) => tError(e)
  );

  return returnWorldID;
}

/**
 * 選択されているワールドを削除する
 */
export function removeWorld(worldID: WorldID) {
  const worldStore = useWorldStore();
  delete worldStore.worldList[worldID];
}

/**
 * ワールドオブジェクトそのものを更新する
 */
export function updateWorld(world: World | WorldEdited) {
  const worldStore = useWorldStore();
  worldStore.worldList[world.id] = {
    type: 'edited',
    world: toRaw(world),
  };
}

/**
 * 最新のワールドデータをworldBackに同期する
 *
 * 同期することで，「ワールド起動前のデータ」を更新する
 */
export function updateBackWorld(worldID?: WorldID) {
  const worldStore = useWorldStore();
  if (worldID) {
    const worldObj = worldStore.worldList[worldID];
    if (worldObj.type === 'edited') {
      worldStore.worldListBack[worldID] = deepcopy(worldObj.world);
    }
  } else {
    worldStore.worldListBack = deepcopy(
      fromEntries(
        toEntries(worldStore.worldList)
          .filter(([wid, w]) => w.type === 'edited')
          .map(([wid, w]) => [wid, w.world as WorldEdited])
      )
    );
  }
}
