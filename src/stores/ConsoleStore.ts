import { defineStore } from 'pinia';
import { ConsoleData, WorldStatus } from 'src/schema/console';
import { deepcopy } from 'app/src-public/scripts/deepcopy';
import { values } from 'app/src-public/scripts/obj/obj';
import { ConsoleOutput } from 'app/src-electron/schema/console';
import { WorldID } from 'app/src-electron/schema/world';
import { assets } from 'src/assets/assets';
import { $T, tError } from 'src/i18n/utils/tFunc';
import { checkError } from 'src/components/Error/Error';
import {
  ConsoleOutputParser,
  replayConsoleOutputs,
} from 'src/components/World/Console/consoleLine';
import { useMainStore } from './MainStore';
import { useProgressStore } from './ProgressStore';
import { updateBackWorld, updateWorld } from './WorldStore';

interface WorldConsole {
  [id: WorldID]: {
    status: WorldStatus;
    clickedStop: boolean;
    clickedReboot: boolean;
    console: ConsoleData[];
    /** サーバーに参加中のプレイヤー名一覧 */
    onlinePlayers: string[];
  };
}

/**
 * ワールドごとのサーバー出力の解釈状態（出力をまたいで引き継ぐ文字色など）
 *
 * 表示には直接関わらないため、Storeのリアクティブな状態とは別に保持する
 */
const outputParsers = new Map<WorldID, ConsoleOutputParser>();

/** コンソールの内容を初期化する際に、出力の解釈状態も初期化する */
function resetOutputParser(worldID: WorldID) {
  outputParsers.set(worldID, new ConsoleOutputParser());
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
          console: new Array<ConsoleData>(),
          onlinePlayers: [],
        };
        resetOutputParser(worldID);
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
     * コンソールにサーバーからの出力を追加する
     *
     * 文字色などのANSIエスケープシーケンスは装飾として解釈し、
     * プログレスバーのように\rで書き換えられる出力は直前の行を上書きする
     */
    setConsole(worldID: WorldID, consoleLine: string, isError: boolean) {
      this._world[worldID].status = 'Running';
      if (consoleLine !== void 0) {
        if (!outputParsers.has(worldID)) resetOutputParser(worldID);
        outputParsers
          .get(worldID)
          ?.append(this._world[worldID].console, consoleLine, isError);
      }
    },
    /**
     * ログに記録したサーバーの出力から、一括でコンソールの中身を登録する
     */
    setAllConsole(
      worldID: WorldID,
      outputs: ConsoleOutput[],
      status: WorldStatus
    ) {
      this._world[worldID].status = status;
      this._world[worldID].console = replayConsoleOutputs(outputs);
      resetOutputParser(worldID);
    },
    /**
     * コンソールに行を追加する
     */
    resetReboot(worldID: WorldID) {
      this._world[worldID].console = [];
      resetOutputParser(worldID);
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
    /**
     * サーバーに参加中のプレイヤー一覧を更新する
     *
     * @param worldID 更新するワールド
     * @param players 参加中のプレイヤー名一覧
     * @returns 前回の更新から新たに参加したプレイヤー名一覧
     */
    setOnlinePlayers(worldID: WorldID, players: string[]) {
      const world = this._world[worldID];
      if (world === void 0) return [];

      const before = new Set(world.onlinePlayers.map((n) => n.toLowerCase()));
      world.onlinePlayers = players;
      return players.filter((n) => !before.has(n.toLowerCase()));
    },
    /**
     * プレイヤーがサーバーに参加中か否かを返す
     *
     * Minecraftのユーザー名は大文字小文字を区別しないため，区別せずに比較する
     */
    isOnlinePlayer(worldID: WorldID, playerName: string) {
      const name = playerName.toLowerCase();
      return (
        this._world[worldID]?.onlinePlayers.some(
          (n) => n.toLowerCase() === name
        ) ?? false
      );
    },
  },
});

export async function runServer() {
  const mainStore = useMainStore();
  const consoleStore = useConsoleStore();

  // 起動時のワールドの状態を保持することで、GUIが別のワールドを表示していても、
  // 当該ワールドに対して処理が行えるようにする
  const runWorld = deepcopy(
    mainStore.allWorlds.readonlyWorlds[mainStore.selectedWorldID]
  );

  // Abbrは実行できない
  if (runWorld.type === 'abbr') {
    return;
  }

  // 画像が入っていない場合は既定のアイコンを適用する
  if (runWorld.world.avater_path === void 0) {
    runWorld.world.avater_path = assets.png.unset;
  }

  // プログレスのステータスをセット
  if (runWorld.world.version.type !== 'unknown') {
    consoleStore.initProgress(
      runWorld.world.id,
      $T('console.booting', {
        id: `${runWorld.world.version.id}`,
        type: `${$T(`home.serverType.${runWorld.world.version.type}`)}`,
        name: `${runWorld.world.name}`,
      })
    );
  }

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
