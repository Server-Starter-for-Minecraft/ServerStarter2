import { defineStore } from 'pinia';
import { deepcopy } from 'app/src-public/scripts/deepcopy';
import { values } from 'app/src-public/scripts/obj/obj';
import { WorldID } from 'app/src-electron/schema/world';
import { assets } from 'src/assets/assets';
import { $T, tError } from 'src/i18n/utils/tFunc';
import { checkError } from 'src/components/Error/Error';
import { useMainStore } from './MainStore';
import { useProgressStore } from './ProgressStore';
import { updateBackWorld, updateWorld, useWorldStore } from './WorldStore';

type consoleData = { chunk: string; isError: boolean };
type WorldStatus = 'Stop' | 'Ready' | 'Running' | 'CheckLog';
interface WorldConsole {
  [id: WorldID]: {
    status: WorldStatus;
    clickedStop: boolean;
    clickedReboot: boolean;
    console: consoleData[];
  };
}

export const useConsoleStore = defineStore('consoleStore', {
  state: () => {
    return {
      _world: {} as WorldConsole,
    };
  },
  actions: {
    /**
     * コンソールを表示するために必要な情報を宣言
     *
     * mainStoreのSelectedIdxを変更してから呼び出す
     *
     * @param force すでにデータが存在していてもコンソールとステータスを初期化する
     */
    initTab(worldID: WorldID, force = false) {
      if ((this._world[worldID] === void 0 && worldID !== '') || force) {
        this._world[worldID] = {
          status: 'Stop',
          clickedStop: false,
          clickedReboot: false,
          console: new Array<consoleData>(),
        };
      }
    },
    /**
     * 進捗を登録する
     */
    initProgress(worldID: WorldID, message: string) {
      const progressStore = useProgressStore();
      progressStore.initProgress(worldID, message);
      this._world[worldID].status = 'Ready';
    },
    /**
     * コンソールに行を追加する
     */
    setConsole(worldID: WorldID, consoleLine: string, isError: boolean) {
      this._world[worldID].status = 'Running';
      if (consoleLine !== void 0) {
        this._world[worldID].console.push({
          chunk: consoleLine,
          isError: isError,
        });
      }
    },
    /**
     * 一括でコンソールの中身を登録する
     */
    setAllConsole(
      worldID: WorldID,
      consoleLines: string[],
      status: WorldStatus
    ) {
      this._world[worldID].status = status;
      this._world[worldID].console = [];
      consoleLines.forEach((l) =>
        this._world[worldID].console.push({ chunk: l, isError: false })
      );
    },
    /**
     * コンソールに行を追加する
     */
    resetReboot(worldID: WorldID) {
      this._world[worldID].console = [];
      this._world[worldID].clickedReboot = false;
    },
    /**
     * ワールドの実行状態を取得する
     */
    status(worldID: WorldID) {
      return this._world[worldID]?.status;
    },
    /**
     * ワールドが停止処理に入っているか否かを取得する
     */
    isClickedBtn(worldID: WorldID) {
      return (
        this._world[worldID].clickedStop || this._world[worldID].clickedReboot
      );
    },
    /**
     * ワールドが停止処理に入っているか否かを取得する
     */
    isClickedStop(worldID: WorldID) {
      return this._world[worldID].clickedStop;
    },
    /**
     * ワールドが再起動処理に入っているか否かを取得する
     */
    isClickedReboot(worldID: WorldID) {
      return this._world[worldID].clickedReboot;
    },
    /**
     * ワールドが停止処理に入る際にフラグを立てる
     */
    clickedStopBtn(worldID: WorldID) {
      this._world[worldID].clickedStop = true;
    },
    /**
     * ワールドが再起動処理に入る際にフラグを立てる
     */
    clickedRebootBtn(worldID: WorldID) {
      this._world[worldID].clickedReboot = true;
    },
    /**
     * 全てのワールドが停止中か否かを返す
     */
    isAllWorldStop() {
      return values(this._world).every((obj) => obj.status === 'Stop');
    },
    /**
     * ワールドのコンソール状態を取得する
     */
    console(worldID: WorldID) {
      return this._world[worldID].console;
    },
  },
});

export async function runServer() {
  const mainStore = useMainStore();
  const worldStore = useWorldStore();
  const consoleStore = useConsoleStore();

  // 起動時のワールドの状態を保持することで、GUIが別のワールドを表示していても、
  // 当該ワールドに対して処理が行えるようにする
  const runWorld = deepcopy(worldStore.worldList[mainStore.selectedWorldID]);

  // Abbrは実行できない
  if (runWorld.type === 'abbr') {
    return;
  }

  // 画像が入っていない場合は既定のアイコンを適用する
  if (runWorld.world.avater_path === void 0) {
    runWorld.world.avater_path = assets.png.unset;
  }

  // プログレスのステータスをセット
  consoleStore.initProgress(
    runWorld.world.id,
    $T('console.booting', {
      id: `${runWorld.world.version.id}`,
      type: `${$T(`home.serverType.${runWorld.world.version.type}`)}`,
      name: `${runWorld.world.name}`,
    })
  );

  // サーバーを起動
  updateBackWorld(runWorld.world.id);
  const res = await window.API.invokeRunWorld(runWorld.world.id);

  // サーバー終了時のエラー確認
  checkError(
    res.value,
    (w) => updateWorld(w),
    (e) => tError(e)
  );

  // サーバータブをリセット
  consoleStore.initTab(runWorld.world.id, true);
  mainStore.removeWorldIP(runWorld.world.id);
}
