import { WorldContainer, WorldName } from '../schema/brands';
import { Player } from '../schema/player';
import { StaticResouce } from '../schema/static';
import { SystemSettings, WorldContainers } from '../schema/system';
import { Version, VersionType } from '../schema/version';
import { World, WorldAbbr, WorldEdited, WorldID } from '../schema/world';
import { Failable } from './failable';
import { IAPI, IBackAPI, IFrontAPI } from './types';
import { WithError } from './witherror';

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
    /** サーバー開始時のメッセージ */
    StartServer: (world: WorldID) => void;

    /** サーバー終了時のメッセージ */
    FinishServer: (world: WorldID) => void;

    /** サーバー実行(前|後)の画面表示 */
    UpdateStatus: (
      world: WorldID,
      message: string,
      current?: number,
      total?: number
    ) => void;

    /** コンソールに文字列を追加 */
    AddConsole: (world: WorldID, chunk: string) => void;

    /** mainプロセス側かでSystemSettingが変更された場合に走る */
    UpdateSystemSettings: (settings: SystemSettings) => void;

    SMWTest: (value: string) => void;
  };
  invokeMainToWindow: {
    /** MinecraftEulaへの同意チェック */
    AgreeEula: (world: WorldID, url: string) => Promise<boolean>;

    IMWTest: (value: string) => Promise<string>;
  };
  sendWindowToMain: {
    /** 実行中のサーバーにコマンドを送る */
    Command: (world: WorldID, command: string) => void;

    /** URLをブラウザで開く */
    OpenBrowser: (url: string) => void;

    /** pathをエクスプローラーで開く */
    OpenFolder: (path: string) => void;

    SWMTest: (value: string) => void;
  };
  invokeWindowToMain: {
    /** Backend側から静的なデータを取得する */
    GetStaticResouce: () => Promise<StaticResouce>;

    /** SystemSettingsを(再)取得 */
    GetSystemSettings: () => Promise<SystemSettings>;
    /** SystemSettingsを変更 */
    SetSystemSettings: (settings: SystemSettings) => Promise<SystemSettings>;

    /** WorldAbbrの一覧を取得 */
    GetWorldAbbrs: (
      worldContainer: WorldContainer
    ) => Promise<WithError<Failable<WorldAbbr[]>>>;

    /** Worldの情報を(再)取得 リモートがある場合リモートから(再)取得 */
    GetWorld: (WorldId: WorldID) => Promise<WithError<Failable<World>>>;
    /** Worldの情報を上書き リモートがある場合リモートの情報も上書き
     * 戻り値の値が実際にセットされた値になる */
    SetWorld: (world: WorldEdited) => Promise<WithError<Failable<World>>>;
    /** 新しいWorldのデータを生成 ディレクトリ等は生成されない */
    NewWorld: () => Promise<WithError<Failable<World>>>;
    /** Worldを生成 実際にディレクトリを生成し、リモートがある場合リモートも生成する */
    CreateWorld: (world: WorldEdited) => Promise<WithError<Failable<World>>>;
    /** Worldを削除 リモートがある場合でもリモートは削除しない */
    DeleteWorld: (world: WorldID) => Promise<WithError<Failable<undefined>>>;

    /** サーバーを起動 */
    RunServer: (world: WorldID) => Promise<WithError<Failable<World>>>;

    /** プレイヤーを名前またはUUIDで検索する(完全一致のみ) */
    SearchPlayer: (nameOrUuid: string) => Promise<WithError<Failable<Player>>>;

    /** Version一覧を取得 useCache===trueのときローカルのキャッシュを使用する(高速) */
    GetVersions: (
      type: VersionType,
      useCache: boolean
    ) => Promise<WithError<Failable<Version[]>>>;

    /** ワールド名が使用可能かどうかを検証する */
    ValidateNewWorldName: (
      worldContainer: WorldContainer,
      worldName: string
    ) => Promise<WithError<Failable<WorldName>>>;

    /** ディレクトリを選択する */
    PickDirectory: () => Promise<WithError<Electron.OpenDialogReturnValue>>;

    IWMTest: (value: string) => Promise<string>;
  };
}

export type BackAPI = IBackAPI<API>;
export type FrontAPI = IFrontAPI<API>;
