import { SystemSettings, WorldContainers } from '../schema/system';
import { Version, VersionType } from '../schema/version';
import {
  SystemWorldSettings,
  World,
  WorldAbbr,
  WorldEdited,
  WorldId,
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
    StartServer: () => void;
    FinishServer: () => void;
    UpdateStatus: (message: string, current?: number, total?: number) => void;
    AddConsole: (chunk: string) => void;
  };
  invokeMainToWindow: {
    AgreeEula: (url: string) => Promise<boolean>;
  };
  sendWindowToMain: {
    Command: (command: string) => void;
    OpenBrowser: (url: string) => void;
    OpenFolder: (path: string) => void;
  };
  invokeWindowToMain: {
    RunServer: (world: WorldEdited) => Promise<Failable<World>>;
    SaveWorldSettings: (world: World) => Promise<Failable<World>>;

    GetDefaultSettings: () => Promise<SystemWorldSettings>;

    GetSystemSettings: () => Promise<SystemSettings>;
    SetSystemSettings: (settings: SystemSettings) => Promise<void>;

    GetWorldContainers: () => Promise<WorldContainers>;
    SetWorldContainers: (worldContainers: WorldContainers) => Promise<void>;

    GetWorldAbbrs: (worldContainer: string) => Promise<Failable<WorldAbbr[]>>;
    GetWorld: (WorldId: WorldId) => Promise<Failable<World>>;

    /** 現在実行中のワールドを取得(サーバー内でのデータの更新を反映する) ※未実装 */
    GetRunningWorld: (WorldId: WorldId) => Promise<Failable<World>>;

    /** 現在実行中のワールドの設定等を変更(戻り値は変更後のワールド) ※未実装 */
    UpdatetRunningWorld: (WorldId: WorldId) => Promise<Failable<World>>;

    DeleteWorld: (world: WorldId) => Promise<Failable<void>>;

    GetVersions: (
      type: VersionType,
      useCache: boolean
    ) => Promise<Failable<Version[]>>;

    GenUUID: () => Promise<string>;
  };
}

export type BackAPI = IBackAPI<API>;
export type FrontAPI = IFrontAPI<API>;
