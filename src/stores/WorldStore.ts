import { toRaw } from 'vue';
import { defineStore } from 'pinia';
import { deepcopy } from 'app/src-public/scripts/deepcopy';
import { isError, isValid } from 'app/src-public/scripts/error';
import { fromEntries, toEntries } from 'app/src-public/scripts/obj/obj';
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

export type WorldList = Record<WorldID, WorldItem>;
export type WorldBackList = Record<WorldID, WorldEdited>;

/**
 * Worldの変更を検知するためのStore
 */
const useWorldStore = defineStore('worldStore', {
  state: () => {
    return {
      worldListBack: {} as WorldBackList,
      worldList: {} as WorldList,
    };
  },
});

/**
 * mainStoreに渡す用のワールド取得関数
 *
 * 原則呼出しはNG
 */
export function __getWorldList() {
  const worldStore = useWorldStore();
  return worldStore.worldList;
}
/**
 * mainStoreに渡す用のワールド取得関数
 *
 * 原則呼出しはNG
 */
export function __getWorldListBack() {
  const worldStore = useWorldStore();
  return worldStore.worldListBack;
}

/**
 * worldStoreを監視して，更新があった際にバックエンドにWorldの更新を伝達する
 */
export function setWorldSubscriber() {
  const worldStore = useWorldStore();
  const mainStore = useMainStore();

  worldStore.$subscribe((mutation, state) => {
    const world = mainStore.world;
    if (world) {
      // SetWorldの戻り値でWorldStoreに更新をかけると、
      // その保存処理が再帰的に発生するため、現在はundefinedとして、処理を行っていない
      window.API.invokeSetWorld(toRaw(world)).then((v) => {
        checkError(v.value, undefined, (e) => tError(e));
      });
    }
  });
}

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
 * ワールドを新規で読み込んだ際にフロントエンド側にワールドを追加する
 *
 * 以下の処理を実行する
 * - WorldAbbrを登録
 * - コンソールで表示する各ワールドの実行状態の初期化
 */
export function registAbbrWorld(abbr: WorldAbbr) {
  // フロントエンドのWorld一覧に登録
  const worldStore = useWorldStore();
  worldStore.worldList[abbr.id] = { type: 'abbr', world: abbr };

  // フロントエンドで持っているワールドの状態管理に登録
  const consoleStore = useConsoleStore();
  consoleStore.initTab(abbr.id);
}

/**
 * ワールドの読込時に発生したエラーを登録しておく
 */
export function registWorldError(worldID: WorldID, error?: ErrorFuncReturns) {
  const worldStore = useWorldStore();
  worldStore.worldList[worldID].error = error;
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
