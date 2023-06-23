import { UUID, WorldContainer, WorldName } from '../schema/brands';
import { Player } from '../schema/player';
import { SystemSettings, WorldContainers } from '../schema/system';
import { Version, VersionType } from '../schema/version';
import {
  SystemWorldSettings,
  World,
  WorldAbbr,
  WorldEdited,
  WorldID,
} from '../schema/world';
import { Failable } from './failable';
import { IAPI, IBackAPI, IFrontAPI } from './types';

/**
 * ## APIの利用方法
 *
 * ### フロントエンドの場合
 *
 * window.API.~ にて呼び出し/リスナー登録可能
 *
 * ### バックエンドの場合
 * import {api} from "src-electron/api"
 *
 * api.~ にて呼び出し可能
 *
 * ## API関数の追加方法
 *
 * 1 この`interface API`に関数の型定義を追加する
 *
 * 2 src-electron/electron-preload の `const api`でエラーが出るので修正
 *
 * 3 src-electron/ipc/front の `function getFrontAPIListener`でエラーが出ていたら修正
 *
 * 4 src-electron/ipc/dummy_back の `const backListener`でエラーが出ていたら修正
 *
 * 5 src-electron/ipc/back の `const backListener`でエラーが出ていたら関数を追加(バックエンド側の対応が必要)
 */
export interface API extends IAPI {
  sendMainToWindow: {
    StartServer: (world: WorldID) => void;
    FinishServer: (world: WorldID) => void;
    UpdateStatus: (
      world: WorldID,
      message: string,
      current?: number,
      total?: number
    ) => void;
    AddConsole: (world: WorldID, chunk: string) => void;

    /** mainプロセス側かでSystemSettingが変更された場合に走る */
    UpdateSystemSettings: (settings: SystemSettings) => void;
  };
  invokeMainToWindow: {
    AgreeEula: (world: WorldID, url: string) => Promise<boolean>;
  };
  sendWindowToMain: {
    Command: (world: WorldID, command: string) => void;
    OpenBrowser: (url: string) => void;
    OpenFolder: (path: string) => void;
  };
  invokeWindowToMain: {
    RunServer: (world: WorldEdited) => Promise<Failable<World>>;
    SaveWorldSettings: (world: World) => Promise<Failable<World>>;

    // 【TODO】: DefaultServerPropertyと各Worldに保存するときのPropertyの型を分離
    // 各Worldに保存するときのPropertyには値そのもの（string|boolean|number）のみを保存
    GetDefaultSettings: () => Promise<SystemWorldSettings>;

    // New World に対応するデフォルトワールドオブジェクトを取得する関数を整備
    GetDefaultWorld: () => Promise<Failable<World>>;

    GetSystemSettings: () => Promise<SystemSettings>;
    SetSystemSettings: (settings: SystemSettings) => Promise<void>;

    GetWorldContainers: () => Promise<WorldContainers>;
    SetWorldContainers: (worldContainers: WorldContainers) => Promise<void>;

    GetWorldAbbrs: (
      worldContainer: WorldContainer
    ) => Promise<Failable<WorldAbbr[]>>;
    GetWorld: (WorldId: WorldID) => Promise<Failable<World>>;

    /** 現在実行中のワールドを取得(サーバー内でのデータの更新を反映する) */
    GetRunningWorld: (WorldId: WorldID) => Promise<Failable<World>>;

    /** 現在実行中のワールドの設定等を変更(戻り値は変更後のワールド) */
    // UpdatetRunningWorld: (
    //   WorldId: WorldID,
    //   settings: FoldSettings
    // ) => Promise<Failable<World>>;

    DeleteWorld: (world: WorldID) => Promise<Failable<void>>;

    /** プレイヤーを名前またはUUIDで検索する(完全一致のみ) */
    SearchPlayer: (nameOrUuid: string) => Promise<Failable<Player>>;

    GetVersions: (
      type: VersionType,
      useCache: boolean
    ) => Promise<Failable<Version[]>>;

    /** ワールド名が使用可能かどうかを検証する */
    ValidateNewWorldName: (
      worldContainer: WorldContainer,
      worldName: string
    ) => Promise<Failable<WorldName>>;

    GenUUID: () => Promise<UUID>;
    PickDirectory: () => Promise<Electron.OpenDialogReturnValue>;
  };
}

export type BackAPI = IBackAPI<API>;
export type FrontAPI = IFrontAPI<API>;
