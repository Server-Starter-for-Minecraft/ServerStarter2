import { toRaw } from 'vue';
import { defineStore } from 'pinia';
import { WorldName } from 'app/src-electron/schema/brands';
import { Version } from 'app/src-electron/schema/version';
import { World, WorldEdited, WorldID } from 'app/src-electron/schema/world';
import { deepcopy } from 'src/scripts/deepcopy';
import { isError, isValid } from 'src/scripts/error';
import { keys, values } from 'src/scripts/obj';
import { recordValueFilter } from 'src/scripts/objFillter';
import { sortValue } from 'src/scripts/objSort';
import { zen2han } from 'src/scripts/textUtils';
import { assets } from 'src/assets/assets';
import { $T, tError } from 'src/i18n/utils/tFunc';
import { checkError } from 'src/components/Error/Error';
import { useConsoleStore } from './ConsoleStore';
import { useSystemStore } from './SystemStore';

export const useMainStore = defineStore('mainStore', {
  state: () => {
    return {
      selectedWorldID: '' as WorldID,
      inputWorldName: '' as WorldName,
      worldSearchText: '',
      errorWorlds: new Set<WorldID>(),
      selectedVersionType: 'vanilla' as Version['type'],
    };
  },
  getters: {
    world(state) {
      const worldStore = useWorldStore();
      const returnWorld = worldStore.worldList[state.selectedWorldID];

      if (returnWorld !== void 0) {
        // バージョンの更新（ワールドを選択し直すタイミングでバージョンの変更を反映）
        state.selectedVersionType = returnWorld.version.type;
      }

      return returnWorld;
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
      const worldStore = useWorldStore();
      return worldStore.worldListBack[state.selectedWorldID];
    },
    worldIP(state) {
      const worldStore = useWorldStore();
      return worldStore.worldIPs[state.selectedWorldID];
    },
    /**
     * ワールド一覧に描画するワールドリスト，
     */
    showingWorldList(state) {
      const worldStore = useWorldStore();
      // 検索BOXのClearボタンを押すとworldSearchTextにNullが入るため，３項演算子によるNullチェックも付加
      // 原因はSearchWorldViewのupdateSelectedWorld()にてshowingWorldListを呼び出しているため
      // TODO: 上記のリファクタリングにより，３項演算子を廃止
      const editText = zen2han(state.worldSearchText ?? '')
        .trim()
        .toLowerCase();

      if (editText !== '') {
        // スペース区切りのAND検索
        let returnWorlds = worldStore.sortedWorldList;
        editText.split(' ').forEach((t) => {
          returnWorlds = recordValueFilter(returnWorlds, (w) => {
            // ワールド名称に一致
            const hitName = w.name.toLowerCase().match(t) !== null;
            // サーバー種類に一致
            const hitVerType =
              w.version.type.match(t) !== null ||
              $T(`home.serverType.${w.version.type}`).match(t) !== null;
            // バージョン名に一致
            const hitVer = w.version.id.match(t) !== null;
            return hitName || hitVerType || hitVer;
          });
        });

        // 選択中のワールドがリスト圏外になった場合は選択を解除
        if (!keys(returnWorlds).includes(state.selectedWorldID)) {
          state.selectedWorldID = '' as WorldID;
        }

        return returnWorlds;
      }

      return worldStore.sortedWorldList;
    },
  },
  actions: {
    /**
     * ワールドを新規作成する
     */
    async createNewWorld(duplicateWorldID?: WorldID) {
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
          worldStore.worldList[world.id] = toRaw(world);
          this.setWorld(world);
          consoleStore.initTab(world.id);
        },
        (e) => tError(e)
      );

      return returnWorldID;
    },
    /**
     * 選択されているワールドを削除する
     */
    removeWorld(worldID: WorldID) {
      const worldStore = useWorldStore();
      delete worldStore.worldList[worldID];
    },
    /**
     * ワールドIDで設定したワールドを表示する
     */
    setWorld(world: World | WorldEdited) {
      this.selectedWorldID = world.id;
      this.inputWorldName = world.name;
    },
    /**
     * ワールドオブジェクトそのものを更新する
     */
    updateWorld(world: World | WorldEdited) {
      const worldStore = useWorldStore();
      worldStore.worldList[world.id] = world;
    },
    /**
     * すべてのワールドに対してprocessで指定した処理を行う
     */
    processAllWorld(process: (world: WorldEdited) => void) {
      const worldStore = useWorldStore();
      values(worldStore.worldList).forEach((w) => {
        process(w);

        // App.vueのSubscriberは表示中のワールドに対する更新を行うため，
        // 非表示ワールドの更新は別途ここで作動させる
        window.API.invokeSetWorld(toRaw(w)).then((v) => {
          checkError(v.value, undefined, (e) => tError(e));
        });
      });
    },
    /**
     * Ngrokより割り当てられたIPアドレスを削除する（サーバー終了時を想定）
     */
    removeWorldIP(worldID: WorldID) {
      const worldStore = useWorldStore();
      worldStore.removeWorldIP(worldID);
    },
    /**
     * 最新のワールドデータをworldBackに同期する
     *
     * 同期することで，「ワールド起動前のデータ」を更新する
     */
    syncBackWorld(worldID?: WorldID) {
      const worldStore = useWorldStore();
      if (worldID) {
        worldStore.worldListBack[worldID] = deepcopy(
          worldStore.worldList[worldID]
        );
      } else {
        worldStore.worldListBack = deepcopy(worldStore.worldList);
      }
    },
    /**
     * ワールドが起動されたときに必要な処理を実行する
     *
     * - worldBackのデータを更新
     */
    startedWorld(worldID: WorldID) {
      this.syncBackWorld(worldID);
    },
  },
});

/**
 * Worldの変更を検知するためのStore
 */
export const useWorldStore = defineStore('worldStore', {
  state: () => {
    return {
      worldListBack: {} as Record<WorldID, WorldEdited>,
      worldList: {} as Record<WorldID, WorldEdited>,
      worldIPs: {} as Record<WorldID, string>,
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
          visibleContainers.has(w.container)
        ),
        (a, b) => (a.last_date ?? 0) - (b.last_date ?? 0)
      );
    },
  },
  actions: {
    setWorldIP(worldID: WorldID, ip?: string) {
      if (ip && ip !== '') {
        this.worldIPs[worldID] = ip;
      }
    },
    removeWorldIP(worldID: WorldID) {
      delete this.worldIPs[worldID];
    },
  },
});
