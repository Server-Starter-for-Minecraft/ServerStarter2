import { RemoteWorldName, WorldContainer, WorldName } from '../schema/brands';
import { DialogOptions } from '../schema/dialog';
import { ErrorMessage, Failable, WithError } from '../schema/error';
import {
  BackupData,
  CacheFileData,
  CustomMapData,
  DatapackData,
  ImageURIData,
  ModData,
  NewFileData,
  PluginData,
} from '../schema/filedata';
import { OsPlatform } from '../schema/os';
import { Player } from '../schema/player';
import { GroupProgress } from '../schema/progress';
import {
  Remote,
  RemoteFolder,
  RemoteSetting,
  RemoteWorld,
} from '../schema/remote';
import { ServerStartNotification } from '../schema/server';
import { StaticResouce } from '../schema/static';
import { SystemSettings } from '../schema/system';
import { AllVersion, VersionType } from '../schema/version';
import { World, WorldAbbr, WorldEdited, WorldID } from '../schema/world';
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
    /** サーバー開始時のメッセージ */
    StartServer: (
      world: WorldID,
      notification: ServerStartNotification
    ) => void;

    /** サーバー終了時のメッセージ */
    FinishServer: (world: WorldID) => void;

    /** サーバー実行(前|後)の進捗画面表示 */
    Progress: (world: WorldID, progress: GroupProgress) => void;

    /**
     * コンソールに文字列を追加
     * isError: stdoutの場合はfalse,stderrの場合はtrue
     */
    AddConsole: (world: WorldID, chunk: string, isError: boolean) => void;

    /** バックエンドプロセスで致命的でないエラーが起こった時に走る */
    Error: (error: ErrorMessage) => void;

    /** アップデートがある際の通知 */
    NotifySystemUpdate: (type: OsPlatform, systemVersion: string) => void;
  };
  invokeMainToWindow: {
    /** MinecraftEulaへの同意チェック */
    AgreeEula: (world: WorldID, url: string) => Promise<boolean>;

    /**
     * PC本体をシャットダウンするかどうかのチェック
     * すべてのサーバーが停止&自動シャットダウンがONのときに発火
     * タイムアウトを設けてresolveすることを想定
     *
     * true : ServerStarterを終了し、本体を即時シャットダウン
     * false : ServerStarterの起動を継続し、シャットダウンしない
     */
    CheckShutdown: () => Promise<boolean>;
  };
  sendWindowToMain: {
    /** 実行中のサーバーにコマンドを送る
     *  Command("run any command")
     *  Command("reboot",true)
     */
    Command: (world: WorldID, command: string) => void;

    /** URLをブラウザで開く */
    OpenBrowser: (url: string) => void;

    /** pathをエクスプローラーで開く */
    OpenFolder: (path: string, autocreate: boolean) => Promise<Failable<void>>;

    /** mainWindowが準備できた(App.vueのセットアップ処理が終わった)ときに発火 */
    ReadyWindow: () => void;
  };
  invokeWindowToMain: {
    /** 実行中のサーバーを再起動 */
    Reboot: (world: WorldID) => Promise<void>;

    /** Backend側から静的なデータを取得する */
    GetStaticResouce: () => Promise<StaticResouce>;

    /** SystemSettingsを(再)取得 */
    GetSystemSettings: () => Promise<SystemSettings>;

    /** SystemSettingsを変更 */
    SetSystemSettings: (settings: SystemSettings) => Promise<SystemSettings>;

    /** WorldAbbrの一覧を取得 */
    GetWorldAbbrs: (
      worldContainer: WorldContainer
    ) => Promise<WithError<WorldAbbr[]>>;

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
    /** Worldを起動 */
    RunWorld: (world: WorldID) => Promise<WithError<Failable<World>>>;
    /** Worldを複製 */
    DuplicateWorld: (
      world: WorldID,
      name?: WorldName
    ) => Promise<WithError<Failable<World>>>;
    /**
     * Worldをバックアップ
     * @parem path?:string - バックアップのファイルパス(省略可)
     */
    BackupWorld: (world: WorldID) => Promise<WithError<Failable<BackupData>>>;
    /**
     * Worldにバックアップを復元
     * @parem path?:string - バックアップのファイルパス(省略可)
     */
    RestoreWorld: (
      world: WorldID,
      backup: BackupData
    ) => Promise<WithError<Failable<World>>>;

    /** ワールドの最新のログを取得する */
    FetchLatestWorldLog: (world: WorldID) => Promise<Failable<string[]>>;

    /**
     * ワールドに関連するパスを取得する
     *
     * type
     * - world: ワールドデータを保存している場所 ( worldフォルダの中 )
     * - serverJar: サーバーJarのパス
     * - datapacks: データパックフォルダのパス
     * - plugins: プラグインフォルダのパス
     * - mods: MODフォルダのパス
     *
     */
    GetWorldPaths: (
      world: WorldID,
      type: 'world' | 'datapacks' | 'plugins' | 'mods' | 'server'
    ) => Promise<Failable<string>>;

    /**
     * プレイヤーを名前またはUUIDで取得/検索する(完全一致のみ)
     * 検索したことのあるデータの取得は高速
     * 注:プレイヤーのスキンを得る唯一の方法
     */
    GetPlayer: (
      nameOrUuid: string,
      mode: 'uuid' | 'name' | 'auto'
    ) => Promise<Failable<Player>>;

    /** キャッシュされたデータを取得する */
    GetCacheContents: ((
      type: 'datapack'
    ) => Promise<WithError<CacheFileData<DatapackData>[]>>) &
      ((type: 'plugin') => Promise<WithError<CacheFileData<PluginData>[]>>) &
      ((type: 'mod') => Promise<WithError<CacheFileData<ModData>[]>>);

    /** Version一覧を取得 useCache===trueのときローカルのキャッシュを使用する(高速) */
    GetVersions: <V extends VersionType>(
      type: V,
      useCache: boolean
    ) => Promise<Failable<AllVersion<V>>>;

    /** ローカルのセーブデータ一覧を取得 */
    GetLocalSaveData: () => Promise<WithError<Failable<CustomMapData[]>>>;

    /** ワールド名が使用可能かどうかを検証する */
    ValidateNewWorldName: (
      worldContainer: WorldContainer,
      worldName: string
    ) => Promise<Failable<WorldName>>;

    /**
     * リモートワールドの名称が使用可能かどうかチェック
     * バリデート済みの文字列 or エラー が変える
     */
    ValidateNewRemoteWorldName: (
      remoteFolder: RemoteFolder,
      name: string
    ) => Promise<Failable<RemoteWorldName>>;

    /** RemoteSettingが存在するかどうかを確認 */
    ValidateRemoteSetting: (
      remote: RemoteSetting
    ) => Promise<Failable<RemoteSetting>>;

    /** リモートのワールドデータ一覧を取得 */
    GetRemoteWorlds: (
      remote: RemoteFolder
    ) => Promise<WithError<Failable<RemoteWorld[]>>>;

    /** リモートのワールドデータを削除 */
    DeleteRemoteWorld: (remote: Remote) => Promise<Failable<undefined>>;

    /** ワールド名が使用可能かどうかを検証する */
    GetGlobalIP: () => Promise<Failable<string>>;

    /** ファイル/ディレクトリ を選択する */
    PickDialog: ((
      options: {
        type: 'world';
        isFile: boolean;
      } & DialogOptions
    ) => Promise<Failable<CustomMapData>>) &
      ((
        options: { type: 'datapack'; isFile: boolean } & DialogOptions
      ) => Promise<Failable<NewFileData<DatapackData>>>) &
      ((
        options: {
          type: 'plugin';
        } & DialogOptions
      ) => Promise<Failable<NewFileData<PluginData>>>) &
      ((
        options: { type: 'mod' } & DialogOptions
      ) => Promise<Failable<NewFileData<ModData>>>) &
      ((
        options: { type: 'image' } & DialogOptions
      ) => Promise<Failable<ImageURIData>>) &
      ((
        options: { type: 'container' } & DialogOptions
      ) => Promise<Failable<WorldContainer>>) &
      ((
        options: { type: 'backup'; container: WorldContainer } & DialogOptions
      ) => Promise<Failable<BackupData>>);
  };
}

export type BackAPI = IBackAPI<API>;
export type FrontAPI = IFrontAPI<API>;
