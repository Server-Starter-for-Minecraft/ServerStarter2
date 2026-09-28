import { Listener } from '@ngrok/ngrok';
import { randomInt } from 'crypto';
import { GroupProgressor } from 'app/src-electron/common/progress';
import { api } from 'app/src-electron/core/api';
import { closeServerStarterAndShutDown } from 'app/src-electron/lifecycle/exit';
import { WorldContainer, WorldName } from 'app/src-electron/schema/brands';
import {
  ErrorMessage,
  Failable,
  WithError,
} from 'app/src-electron/schema/error';
import { BackupData } from 'app/src-electron/schema/filedata';
import { isNgrokEnabled } from 'app/src-electron/schema/ngrok';
import { ServerStartNotification } from 'app/src-electron/schema/server';
import {
  ServerPortPropertyKey,
  ServerProperties,
} from 'app/src-electron/schema/serverproperty';
import { World, WorldEdited, WorldID } from 'app/src-electron/schema/world';
import { includes } from 'app/src-electron/util/array';
import {
  createTar,
  decompressTar,
} from 'app/src-electron/util/binary/archive/tar';
import { Path } from 'app/src-electron/util/binary/path';
import { errorMessage } from 'app/src-electron/util/error/construct';
import {
  fromRuntimeError,
  isError,
  isValid,
} from 'app/src-electron/util/error/error';
import { failabilify } from 'app/src-electron/util/error/failable';
import { withError } from 'app/src-electron/util/error/witherror';
import { portInUse } from 'app/src-electron/util/network/port';
import { asyncMap } from 'app/src-electron/util/obj/objmap';
import { sleep } from 'app/src-electron/util/promise/sleep';
import { genUUID } from 'app/src-electron/util/random/uuid';
import { allocateTempDir } from 'app/src-electron/util/tempPath';
import { getCurrentTimestamp } from 'app/src-electron/util/timestamp';
import { pullRemoteWorld, pushRemoteWorld } from '../remote/remote';
import { RunRebootableServer, runRebootableServer } from '../server/server';
import { closeNgrok, runNgrok } from '../server/setup/ngrok';
import { getSystemSettings } from '../stores/system';
import { getBackUpPath, parseBackUpPath } from './backup';
import { serverJsonFile, WorldSettings } from './files/json';
import { serverPropertiesFile } from './files/properties';
import {
  constructWorldSettings,
  formatWorldDirectory,
  loadLocalFiles,
  saveLocalFiles,
} from './local';
import { validateNewWorldName } from './name';
import { getOpDiff } from './players';
import { worldContainerToPath } from './worldContainer';

/** 複数の処理を並列で受け取って直列で処理 */
class PromiseSpooler {
  /** 待機中の処理のQueue */
  spoolingQueue: [
    () => Promise<any>,
    (value: any | PromiseLike<any>) => void,
    undefined | string,
  ][];
  running: boolean;

  constructor() {
    this.spoolingQueue = [];
    this.running = false;
  }

  async pushItem<T>(
    spoolingQueue: [
      () => Promise<any>,
      (value: any) => void,
      string | undefined,
    ][],
    process: () => Promise<T>,
    resolve: (value: T | PromiseLike<T>) => void,
    channel: string | undefined
  ) {
    if (channel !== undefined) {
      const lastItem = spoolingQueue[spoolingQueue.length - 1];
      if (lastItem !== undefined) {
        const [, lastResolve, lastChannel] = lastItem;
        if (lastChannel === channel) {
          const newResolve = (value: T) => {
            lastResolve(value);
            resolve(value);
          };
          // チャンネルが同じ場合は処理を上書き
          // resolveは統合
          lastItem[0] = process;
          lastItem[1] = newResolve;
          return;
        }
      }
    }
    // それ以外の場合処理を追加
    spoolingQueue.push([process, resolve, channel]);
  }

  /** channelを指定すると同じchannelの処理は連続せず上書きされる */
  async spool<T>(spollingItem: () => Promise<T>, channel?: string) {
    const pushItem = (
      process: () => Promise<T>,
      resolve: (value: T | PromiseLike<T>) => void,
      channel: string | undefined
    ) => this.pushItem(this.spoolingQueue, process, resolve, channel);

    const resultPromise = new Promise<T>((resolve) => {
      pushItem(spollingItem, resolve, channel);
    });
    this.start();
    return resultPromise;
  }

  private async start() {
    if (this.running) return;
    this.running = true;
    while (true) {
      const item = this.spoolingQueue.shift();
      if (item === undefined) break;
      const [process, resolve] = item;
      try {
        resolve(await process());
      } catch (e) {
        // 例外は呼び出し元に伝え，後続の処理は止めずに続行する
        resolve(Promise.reject(e));
      }
    }
    this.running = false;
  }
}

/** 複製する際のワールド名を取得 */
async function getDuplicateWorldName(
  container: WorldContainer,
  name: WorldName
) {
  let baseName: string = name;
  const match = name.match(/^(.*)_\d+$/);
  if (match !== null) {
    baseName = match[1];
  }

  let worldName: string = baseName;
  let result = await validateNewWorldName(container, worldName);
  let i = 1;
  while (isError(result)) {
    worldName = `${baseName}_${i}`;
    i += 1;
    result = await validateNewWorldName(container, worldName);
  }
  return result;
}

/**
 * Ngrokを利用する場合の処理
 *
 * Ngrokを利用する場合はlistenerを返す
 * Ngrokを利用しない場合はundefinedを返す
 *
 * @param world 起動するワールド（Ngrokの利用設定を参照する）
 * @param port サーバーが使用するポート番号
 * @param ngrokToken NgrokのToken（未設定の場合はNgrokを利用しない）
 */
async function readyNgrok(
  world: World,
  port: number,
  ngrokToken: string | undefined
): Promise<Failable<Listener | undefined>> {
  // 各ワールドに設定されたUseNgrokの値に応じてNgrokの実行有無を制御
  if (isNgrokEnabled(world, ngrokToken)) {
    return runNgrok(ngrokToken, port, world.ngrok_setting.remote_addr);
  }

  return undefined;
}

/** server.propertiesに記載するポート番号の組 */
type ServerPorts = Pick<ServerProperties, ServerPortPropertyKey>;

/** server.propertiesからポート番号の組を取り出す */
function pickServerPorts(properties: ServerProperties): ServerPorts {
  return {
    'server-port': properties['server-port'],
    'query.port': properties['query.port'],
  };
}

/**
 * server.propertiesのポート番号を差し替える
 *
 * @param properties 元のserver.properties（変更しない）
 * @param ports 差し替えるポート番号（数値の場合はすべてのポートをその番号にする）
 * @returns ポート番号を差し替えたserver.properties
 */
function withServerPorts(
  properties: ServerProperties,
  ports: ServerPorts | number
): ServerProperties {
  const replace: ServerPorts =
    typeof ports === 'number'
      ? { 'server-port': ports, 'query.port': ports }
      : ports;
  return { ...properties, ...replace };
}

/** 捕捉した例外をエラーメッセージに変換する */
function toRuntimeError(e: unknown) {
  return fromRuntimeError(e instanceof Error ? e : new Error(String(e)));
}

/** サーバー起動処理の準備が完了した時点の情報 */
type ReadyRunContext = {
  /** 実行中のサーバー */
  runner: RunRebootableServer;
  /** Ngrokを利用する場合のみ値が入る */
  ngrokListener: Listener | undefined;
  /** 起動時のワールド設定 */
  settings: WorldSettings;
};

/** ワールドの(取得/保存)/サーバーの実行を担うクラス */
export class WorldHandler {
  private static worldHandlerMap: Record<WorldID, WorldHandler> = {};

  promiseSpooler: PromiseSpooler;
  name: WorldName;
  container: WorldContainer;
  id: WorldID;
  runner: RunRebootableServer | undefined;
  /** サーバーが実行中の場合のみポート番号が入る */
  port: number | undefined;
  /**
   * サーバーが実行中の場合のみ，ユーザーが設定しているポート番号が入る
   *
   * 実行中のserver.propertiesには実際に使用しているポート番号（Ngrok利用時はランダムなポート番号）を書き込むため，
   * サーバー終了後にこの値へ復元する
   */
  private userPorts: ServerPorts | undefined;

  private constructor(id: WorldID, name: WorldName, container: WorldContainer) {
    this.promiseSpooler = new PromiseSpooler();
    this.id = id;
    this.name = name;
    this.container = container;
    this.runner = undefined;
  }

  /** 起動中のワールドが一つでもあるかどうか */
  private static runningWorldExists() {
    return Object.values(WorldHandler.worldHandlerMap).some(
      (x) => x.runner !== undefined
    );
  }

  /** WorldAbbr/WorldNewができた段階でここに登録し、idを生成 */
  static register(name: WorldName, container: WorldContainer): WorldID {
    const registered = Object.entries(WorldHandler.worldHandlerMap).find(
      ([, value]) => value.container == container && value.name == name
    );
    // 既に登録済みの場合登録されたidを返す
    if (registered !== undefined) {
      return registered[0] as WorldID;
    }
    const id = WorldID.parse(genUUID());
    WorldHandler.worldHandlerMap[id] = new WorldHandler(id, name, container);
    return id;
  }

  // worldIDからWorldHandlerを取得する
  static get(
    id: WorldID,
    name?: WorldName,
    container?: WorldContainer
  ): Failable<WorldHandler> {
    if (!(id in WorldHandler.worldHandlerMap))
      return errorMessage.core.world.invalidWorldId({ id, container, name });
    return WorldHandler.worldHandlerMap[id];
  }

  /** 現在のワールドの保存場所を返す */
  getSavePath() {
    return worldContainerToPath(this.container).child(this.name);
  }

  /** セーブデータを移動する*/
  private async move(
    name: WorldName,
    container: WorldContainer
  ): Promise<Failable<void>> {
    // 現在のワールドの保存場所
    const currentPath = this.getSavePath();
    // 変更される保存先
    const targetPath = worldContainerToPath(container).child(name);

    // パスに変化がない場合はなにもしない
    if (currentPath.path === targetPath.path) return;

    // 保存ディレクトリを移動する
    const move2SaveDir = await currentPath.moveTo(targetPath);
    if (isError(move2SaveDir)) return move2SaveDir;

    // 保存先を変更
    this.name = name;
    this.container = container;
  }

  /** ローカルに保存されたワールド設定Jsonを読み込む */
  private async loadLocalServerJson() {
    const savePath = this.getSavePath();
    return await serverJsonFile.load(savePath);
  }

  /** ワールド設定Jsonをローカルに保存 */
  private async saveLocalServerJson(settings: WorldSettings) {
    const savePath = this.getSavePath();
    return await serverJsonFile.save(savePath, settings);
  }

  /** リモートがあるかをチェックして、ある場合はpull */
  private async pull(progress?: GroupProgressor) {
    // ローカルに保存されたワールド設定Jsonを読み込む(リモートの存在を確認するため)

    const sub = progress?.subtitle({ key: 'server.local.loadSettingFiles' });
    const worldSettings = await this.loadLocalServerJson();
    sub?.delete();

    if (isError(worldSettings)) return worldSettings;

    // リモートが存在する場合Pull
    if (worldSettings.remote) {
      const remote = worldSettings.remote;
      const savePath = this.getSavePath();

      const pull = await pullRemoteWorld(
        savePath,
        remote,
        progress?.subGroup()
      );

      // Pullに失敗した場合エラー
      if (isError(pull)) return pull;
    }
  }

  private async push(progress?: GroupProgressor) {
    // ローカルに保存されたワールド設定Jsonを読み込む(リモートの存在を確認するため)
    const prog = progress?.subtitle({ key: 'server.remote.check' });
    const worldSettings = await this.loadLocalServerJson();
    prog?.delete();

    if (isError(worldSettings)) return worldSettings;

    // リモートが存在する場合Push
    const remote = worldSettings.remote;
    if (remote) {
      const pushProgress = progress?.subGroup();

      const savePath = this.getSavePath();
      const prog = pushProgress?.subGroup();
      const push = await pushRemoteWorld(savePath, remote, prog);
      pushProgress?.delete();

      // Pushに失敗した場合エラー
      if (isError(push)) return push;
    }
  }

  private async loadLocal() {
    const savePath = this.getSavePath();
    // ローカルの設定ファイルを読み込む
    return await loadLocalFiles(savePath, this.id, this.name, this.container);
  }

  async save(
    world: WorldEdited,
    progress?: GroupProgressor
  ): Promise<WithError<Failable<World>>> {
    const func = () => this.saveExec(world, progress);
    return await this.promiseSpooler.spool(func, 'SAVE');
  }
  /** サーバーのデータを保存 */
  private async saveExec(
    world: WorldEdited,
    progress?: GroupProgressor
  ): Promise<WithError<Failable<World>>> {
    if (this.runner === undefined) {
      // 非起動中に設定を反映
      return this.saveExecNonRunning(world, progress);
    } else {
      // 起動中に設定を反映
      return this.saveExecRunning(world);
    }
  }

  /** 起動していないサーバーのデータを保存 */
  private async saveExecNonRunning(
    world: WorldEdited,
    progress?: GroupProgressor
  ): Promise<WithError<Failable<World>>> {
    const errors: ErrorMessage[] = [];

    // ワールド名に変更があった場合正常な名前かどうかを確認してワールドの保存場所を変更
    const worldNameHasChanged =
      this.container !== world.container || this.name !== world.name;
    if (worldNameHasChanged) {
      const newWorldName = await validateNewWorldName(
        world.container,
        world.name
      );
      if (isValid(newWorldName)) {
        // セーブデータを移動
        const moveRes = await this.move(world.name, world.container);
        if (isError(moveRes)) return withError(moveRes);
      } else {
        // 移動をキャンセル
        world.container = this.container;
        world.name = this.name;
        errors.push(newWorldName);
      }
    }

    const savePath = this.getSavePath();

    // リモートからpull
    const pullResult = await this.pull(progress);
    if (isError(pullResult)) return withError(pullResult);

    const loadLocalServerJson = () => this.loadLocalServerJson();

    // ローカルに保存されたワールド設定Jsonを読み込む(使用中かどうかを確認するため)
    const sub = progress?.subtitle({ key: 'server.load.loadLocalSetting' });
    const worldSettings = await loadLocalServerJson();
    sub?.delete();

    if (isError(worldSettings)) return withError(worldSettings);

    // 使用中の場合、現状のデータを再読み込みして終了
    if (worldSettings.using) {
      errors.push(
        errorMessage.core.world.worldAleradyRunning({
          container: this.container,
          name: this.name,
        })
      );
      const sub = progress?.subtitle({ key: 'server.local.reloading' });
      const world = await this.loadLocal();
      sub?.delete();

      world.errors.push(...errors);
      return world;
    }

    // 変更をローカルに保存
    // additionalの解決、custum_map,remote_sourceの導入も行う
    const saveLocalFilesprogress = progress?.subtitle({
      key: 'server.save.title',
    });
    const result = await saveLocalFiles(savePath, world);
    result.errors.push(...errors);
    saveLocalFilesprogress?.delete();

    // リモートの存在を確認して存在したらpush
    const push = await this.push(progress);
    if (isError(push)) return withError(push, errors);

    return result;
  }

  /** 起動しているサーバーのデータを保存 */
  private async saveExecRunning(
    world: WorldEdited
  ): Promise<WithError<Failable<World>>> {
    const errors: ErrorMessage[] = [];

    // ワールド名に変更があった場合エラーに追加
    const worldNameHasChanged =
      this.container !== world.container || this.name !== world.name;
    if (worldNameHasChanged) {
      errors.push(
        errorMessage.core.world.cannotChangeRunningWorldName({
          container: this.container,
          name: this.name,
        })
      );
    }

    const savePath = this.getSavePath();

    // 現状のサーバー設定データ
    const current = await this.loadLocal();

    // 変更をローカルに保存
    // additionalの解決、custum_map,remote_sourceの導入も行う
    // (server.propertiesのポート番号は実行中のものを維持し，ユーザーが設定した値はサーバー終了後に反映する)
    const result = await saveLocalFiles(savePath, this.pinRunningPorts(world));
    result.errors.push(...errors);
    if (isValid(result.value) && isValid(world.properties)) {
      // 保存したポート番号はユーザーの設定値としてサーバー終了後に復元する
      this.userPorts = pickServerPorts(world.properties);
    }
    this.replaceWithUserPorts(result.value);

    // リロード
    await this.runCommand('reload');

    // プレイヤー周りの設定を反映
    // TODO: どこかに実装を移動
    if (
      isValid(current.value) &&
      isValid(current.value.players) &&
      isValid(world.players)
    ) {
      const [diff, sameMember] = getOpDiff(
        current.value.players,
        world.players
      );
      // op権限レベルが0になったプレイヤーに対してdeopを実行
      await asyncMap(diff[0], (x) => this.runCommand(`deop ${x}`));

      if (isValid(current.value.properties)) {
        const opPermissionLevel =
          current.value.properties['op-permission-level'];

        if (includes([1, 2, 3, 4] as const, opPermissionLevel)) {
          const diffs = diff[opPermissionLevel];
          // op権限レベルがop-permission-levelになったプレイヤーに対してopを実行
          await asyncMap(diffs, (x) => this.runCommand(`op ${x}`));
          ([1, 2, 3, 4] as const).forEach((i) => {
            if (i !== opPermissionLevel && diff[i].length > 0) {
              errorMessage.core.world.failedChangingOp({
                users: diff[i],
                op: i,
              });
            }
          });
        }
      }
      if (!sameMember) await this.runCommand('whitelist reload');
    }

    return result;
  }

  /**
   * 実行中のサーバーに保存するワールドのserver.propertiesのポート番号を，実行中のポート番号に置き換える
   *
   * @param world 保存するワールド
   * @returns ポート番号を置き換えたワールド（引数のワールドは変更しない）
   */
  private pinRunningPorts(world: WorldEdited): WorldEdited {
    if (this.port === undefined || isError(world.properties)) return world;
    return {
      ...world,
      properties: withServerPorts(world.properties, this.port),
    };
  }

  /**
   * ワールドのserver.propertiesのポート番号を，ユーザーが設定しているポート番号に置き換える
   *
   * 実行中に保存したワールドをフロントエンドに返す際，実行中のポート番号がユーザーの設定値として扱われないようにする
   *
   * @param world 置き換え対象のワールド（直接変更する）
   */
  private replaceWithUserPorts(world: Failable<World>) {
    if (this.userPorts === undefined) return;
    if (isError(world) || isError(world.properties)) return;
    Object.assign(world.properties, this.userPorts);
  }

  /**
   * 前回起動時にワールドがusingのまま終了した場合に呼ぶ。
   * usingフラグを折ってPush
   */
  private async fix(): Promise<WithError<Failable<World>>> {
    const local = await this.loadLocal();
    const world = local.value;
    if (isError(world)) return local;

    // フラグを折ってjsonに保存
    world.using = false;
    const saveJson = await serverJsonFile.save(
      this.getSavePath(),
      constructWorldSettings(world)
    );
    if (isError(saveJson)) return withError(saveJson);

    // リモートにpush
    const push = await this.push();
    if (isError(push)) return withError(push);

    return local;
  }

  async load(): Promise<WithError<Failable<World>>> {
    const func = async () => {
      const result = await this.loadExec();
      // 実行中のポート番号がユーザーの設定値としてフロントエンドに渡らないようにする
      this.replaceWithUserPorts(result.value);
      return result;
    };
    const r = await this.promiseSpooler.spool(func);
    return r;
  }

  /** サーバーのデータをロード(戻り値がLocalWorldResult) */
  private async loadExec(
    progress?: GroupProgressor
  ): Promise<WithError<Failable<World>>> {
    // プログレスのタイトルを設定
    progress?.title({ key: 'server.load.title' });

    // ローカルに保存されたワールド設定Jsonを読み込む(実行中フラグの確認)
    progress?.subtitle({ key: 'server.load.loadLocalSetting' });
    const worldSettings = await this.loadLocalServerJson();
    if (isError(worldSettings)) return withError(worldSettings);

    const env_id = (await getSystemSettings()).user.id;

    // プレイ中のフラグが立っている &&
    // この環境が最終利用 &&
    // 現在起動中でない場合
    // (前回の起動時に正常にサーバーが終了しなかった場合)
    if (
      worldSettings.using === true &&
      worldSettings.last_id === env_id &&
      this.runner === undefined
    ) {
      // フラグを折ってPush
      progress?.subtitle({ key: 'server.remote.fixing' });
      return await this.fix();
    }
    // リモートからpull
    const group = progress?.subGroup();
    const pullResult = await this.pull(group);
    group?.delete();
    if (isError(pullResult)) return withError(pullResult);

    // ローカルデータをロード
    const result = await this.loadLocal();

    return result;
  }

  async create(world: WorldEdited): Promise<WithError<Failable<World>>> {
    const func = () => this.createExec(world);
    return await this.promiseSpooler.spool(func);
  }

  /** サーバーのデータを新規作成して保存 */
  private async createExec(
    world: WorldEdited
  ): Promise<WithError<Failable<World>>> {
    this.container = world.container;
    this.name = world.name;
    const savePath = this.getSavePath();

    const errors: ErrorMessage[] = [];

    // ワールド名が使用不能だった場合(たぶん起こらない)
    const worldNameValidated = validateNewWorldName(
      world.container,
      world.name
    );
    if (isError(worldNameValidated)) {
      return withError(worldNameValidated, errors);
    }

    // 保存先ディレクトリを作成
    await savePath.mkdir(true);

    // ワールド設定Jsonをローカルに保存(これがないとエラーが出るため)
    const worldSettings = constructWorldSettings(world);
    // リモートの設定だけは消しておく(存在しないブランチからPullしないように)
    // 新規作成時にPull元を指定する場合はworld.remote_sourceを指定することで可能
    delete worldSettings.remote;
    const savedJson = await this.saveLocalServerJson(worldSettings);
    if (isError(savedJson)) return withError(savedJson, errors);

    // ワールドの最終プレイを現在時刻に
    world.last_date = getCurrentTimestamp();

    // データを保存
    return await this.saveExec(world);
  }

  async delete(): Promise<WithError<Failable<undefined>>> {
    const func = () => this.deleteExec();
    return await this.promiseSpooler.spool(func);
  }

  /** ワールドを削除(リモ－トは削除しない) */
  private async deleteExec(): Promise<WithError<Failable<undefined>>> {
    const result = await failabilify(() => this.getSavePath().remove())();
    if (isError(result)) return withError(result);

    delete WorldHandler.worldHandlerMap[this.id];
    return withError(undefined);
  }

  /** ワールドを複製 */
  async duplicate(name?: WorldName): Promise<WithError<Failable<World>>> {
    const func = () => this.duplicateExec(name);
    return await this.promiseSpooler.spool(func);
  }

  /** ワールドを複製 */
  private async duplicateExec(
    name?: WorldName
  ): Promise<WithError<Failable<World>>> {
    // 実行中は複製できない
    if (this.runner !== undefined) {
      return withError(
        errorMessage.core.world.cannotDuplicateRunningWorld({
          container: this.container,
          name: this.name,
        })
      );
    }

    // 複製先のワールドの名前を設定
    const newName =
      name ?? (await getDuplicateWorldName(this.container, this.name));

    // WorldIDを取得
    const newId = WorldHandler.register(newName, this.container);

    // ワールド設定ファイルの内容を読み込む
    const worldSettings = await this.loadLocalServerJson();
    if (isError(worldSettings)) return withError(worldSettings);

    // リモートの情報を削除
    worldSettings.remote = undefined;
    // 使用中フラグを削除
    worldSettings.using = false;

    const newHandler = WorldHandler.get(newId, newName, this.container);
    if (isError(newHandler)) throw new Error();

    await this.getSavePath().copyTo(newHandler.getSavePath());

    // 設定ファイルを上書き
    const savedJson = await newHandler.saveLocalServerJson(worldSettings);
    if (isError(savedJson)) return withError(savedJson);

    return await newHandler.load();
  }

  /** ワールドをバックアップ */
  async backup(): Promise<WithError<Failable<BackupData>>> {
    const func = () => this.backupExec();
    return await this.promiseSpooler.spool(func);
  }

  /** ワールドをバックアップ */
  private async backupExec(): Promise<WithError<Failable<BackupData>>> {
    const backupPath = getBackUpPath(this.container, this.name);

    // リモートのデータを一時的に削除
    const localJson = await this.loadLocalServerJson();
    if (isError(localJson)) return withError(localJson);
    const remote = localJson.remote;
    delete localJson.remote;
    const saveTmp4Local = await this.saveLocalServerJson(localJson);
    if (isError(saveTmp4Local)) return withError(saveTmp4Local);
    localJson.remote = remote;

    // tarファイルを生成
    const tar = await createTar(this.getSavePath(), true);
    if (isError(tar)) return withError(tar);

    // リモートのデータを復旧
    const saveRecover = await this.saveLocalServerJson(localJson);
    if (isError(saveRecover)) return withError(saveRecover);

    // tarファイルを保存
    const failableWrite = await backupPath.write(tar);
    if (isError(failableWrite)) return withError(failableWrite);

    // バックアップデータを返却
    return withError(await parseBackUpPath(backupPath));
  }

  /** ワールドにバックアップを復元 */
  async restore(backup: BackupData): Promise<WithError<Failable<World>>> {
    const func = () => this.restoreExec(backup);
    return await this.promiseSpooler.spool(func);
  }

  /** ワールドにバックアップを復元 */
  private async restoreExec(
    backup: BackupData
  ): Promise<WithError<Failable<World>>> {
    const beforeLocalJson = await this.loadLocalServerJson();
    if (isError(beforeLocalJson)) return withError(beforeLocalJson);
    const remote = beforeLocalJson.remote;

    const tarPath = new Path(backup.path);
    if (!tarPath.exists()) {
      return withError(
        errorMessage.data.path.notFound({
          type: 'file',
          path: backup.path,
        })
      );
    }
    const savePath = this.getSavePath();

    // 展開先の一時フォルダ
    const tempDir = await allocateTempDir();

    // tarファイルを展開
    const decompressResult = await decompressTar(tarPath, tempDir);

    // 展開に失敗した場合
    if (isError(decompressResult)) {
      // 一時フォルダを削除
      await tempDir.remove();
      return withError(decompressResult);
    }
    const afterLocalJson = await serverJsonFile.load(tempDir);
    // Jsonの読み込みに失敗した場合
    if (isError(afterLocalJson)) {
      // 一時フォルダを削除
      await tempDir.remove();
      return withError(afterLocalJson);
    }

    // 一時フォルダの中身をこのパスに移動
    await savePath.remove();
    const moveSavePath = await tempDir.moveTo(savePath);
    if (isError(moveSavePath)) return withError(moveSavePath);
    await tempDir.remove();

    // remoteをrestore前のデータで上書き
    afterLocalJson.remote = remote;
    const saveLocal = await this.saveLocalServerJson(afterLocalJson);
    if (isError(saveLocal)) return withError(saveLocal);

    return this.loadExec();
  }

  /** すべてのサーバーが終了した場合のみシャットダウン */
  private async shutdown() {
    // TODO: この実装ひどい
    await sleep(1);

    // 他のサーバーが実行中の時何もせずに終了
    if (WorldHandler.runningWorldExists()) return;

    // autoShutDown:false の時何もせずに終了
    const sys = await getSystemSettings();
    if (!sys.user.autoShutDown) return;

    // フロントエンドにシャットダウンするかどうかを問い合わせる
    const doShutDown = await api.invoke.CheckShutdown();

    // シャットダウンがキャンセルされた時何もせずに終了
    if (!doShutDown) return;

    // アプリケーションを終了
    closeServerStarterAndShutDown();
  }

  async run(progress: GroupProgressor): Promise<WithError<Failable<World>>> {
    const result = await this.runExec(progress);

    // サーバーの実行に成功した場合のみシャットダウン(シャットダウンしないこともある)
    if (isValid(result)) this.shutdown();

    return result;
  }

  private async checkPortAvailability(port: number): Promise<boolean> {
    // ポートが使用中か確認
    let portIsUsed = await portInUse(port);

    // サーバーランナーの中で同じポートを使用しているものがないか確認
    portIsUsed ||= Object.values(WorldHandler.worldHandlerMap).some(
      (x) => x.port === port
    );

    return !portIsUsed;
  }

  /**
   * 使用可能なポート(1024–49151)を探す
   * 100回乱数でトライして、見つからなかった場合はエラー
   */
  private async getFreePort(): Promise<Failable<number>> {
    let port = 1024;
    for (let i = 0; i < 100; i++) {
      port = randomInt(1024, 49152);
      if (await this.checkPortAvailability(port)) return port;
    }
    return errorMessage.core.world.serverPortIsUsed({
      port,
    });
  }

  /**
   * 使用ポートを決定
   */
  private async definePortNumber(
    beforeWorld: World,
    ngrokToken: string | undefined
  ): Promise<Failable<number>> {
    if (isNgrokEnabled(beforeWorld, ngrokToken)) {
      // Ngrokを使用する場合 開いてるポートを適当に使う
      const portnum = await this.getFreePort();
      if (isError(portnum)) return portnum;
      return portnum;
    } else {
      // Ngrokを使用しない場合 ポートが空いてるかチェック
      let port = 25565;
      if (isValid(beforeWorld.properties)) {
        const serverPort = beforeWorld.properties['server-port'];
        if (typeof serverPort === 'number') port = serverPort;
      }

      const portIsUsed = !(await this.checkPortAvailability(port));

      if (portIsUsed) {
        errorMessage.core.world.serverPortIsUsed({
          port,
        });
      }
      return port;
    }
  }

  /**
   * データを同期して サーバーを起動し，終了まで待機する
   *
   * 起動準備と終了後の処理は保存処理等と同じ待機列で直列に実行する
   * (並列に実行すると，起動準備中に行われた保存処理によってserver.propertiesのポート番号が上書きされることがある)
   */
  private async runExec(
    progress: GroupProgressor
  ): Promise<WithError<Failable<World>>> {
    const ready = await this.promiseSpooler.spool(() =>
      this.readyRunExec(progress)
    );
    const context = ready.value;
    if (isError(context)) return withError(context, ready.errors);

    // サーバーの終了を待機
    // (実行処理が例外で終了した場合も，終了後の処理を行って状態を元に戻す)
    let serverResult: Failable<undefined>;
    try {
      serverResult = await context.runner;
    } catch (e) {
      serverResult = toRuntimeError(e);
    }

    const after = await this.promiseSpooler.spool(() =>
      this.afterRunExec(progress, context, serverResult)
    );
    after.errors.unshift(...ready.errors);
    return after;
  }

  /**
   * データを同期してサーバーの起動を開始する
   *
   * @returns 起動したサーバーと，終了後の処理に必要な情報
   */
  private async readyRunExec(
    progress: GroupProgressor
  ): Promise<WithError<Failable<ReadyRunContext>>> {
    const beforeTitle = progress.title({
      key: 'server.run.before.title',
    });
    const errors: ErrorMessage[] = [];

    // 起動中の場合エラー
    if (this.runner !== undefined)
      return withError(
        errorMessage.core.world.worldAleradyRunning({
          container: this.container,
          name: this.name,
        })
      );

    // ワールド情報をリモートから取得
    const loadResult = await this.loadExec(progress);

    // 取得に失敗したらエラー
    if (isError(loadResult.value))
      return withError(loadResult.value, loadResult.errors);

    errors.push(...loadResult.errors);

    /** ワールド起動直前のワールド設定 */
    const beforeWorld = loadResult.value;

    // serverstarterの実行者UUID
    const sysSettings = await getSystemSettings();

    // 起動している場合エラー
    if (beforeWorld.using)
      return withError(
        errorMessage.core.world.worldAleradyRunning({
          container: this.container,
          name: this.name,
          owner: beforeWorld.last_user,
        }),
        errors
      );

    const settings = constructWorldSettings(beforeWorld);
    const savePath = this.getSavePath();

    // ポート番号を取得
    const port = await this.definePortNumber(
      beforeWorld,
      sysSettings.user.ngrokToken
    );
    if (isError(port)) return withError(port, errors);

    // 実行時のサーバープロパティ(ポートだけ違う)
    const userProperties = isError(beforeWorld.properties)
      ? sysSettings.world.properties
      : beforeWorld.properties;
    const saveProperties = await serverPropertiesFile.save(
      savePath,
      withServerPorts(userProperties, port)
    );
    if (isError(saveProperties)) return withError(saveProperties, errors);

    // ngrokが必要な場合は起動
    const ngrokListener = await readyNgrok(
      beforeWorld,
      port,
      sysSettings.user.ngrokToken
    );
    if (isError(ngrokListener)) {
      // 起動しないため，server.propertiesをユーザーの設定値に戻す
      const restored = await serverPropertiesFile.save(
        savePath,
        userProperties
      );
      if (isError(restored)) errors.push(restored);
      return withError(ngrokListener, errors);
    }

    // ポートを登録
    this.port = port;
    this.userPorts = pickServerPorts(userProperties);

    try {
      // 使用中フラグを立てて保存
      settings.using = true;
      settings.last_user = sysSettings.user.owner;
      settings.last_date = getCurrentTimestamp();
      settings.last_id = sysSettings.user.id;
      const sub = progress.subtitle({ key: 'server.local.savingSettingFiles' });
      await serverJsonFile.save(savePath, settings);
      // if (isError(saveServerJson)) withError(saveServerJson, errors); // 無理なら諦める
      sub.delete();

      // pushを実行 TODO: 失敗時の処理
      await this.push(progress);

      // pluginとvanillaでファイル構造を切り替える
      const directoryFormatResult = await formatWorldDirectory(
        savePath,
        settings.version,
        progress
      );
      errors.push(...directoryFormatResult.errors);

      const notification: ServerStartNotification = { port };

      const ngrokURL = ngrokListener?.url();
      if (ngrokURL) notification.ngrokURL = ngrokURL.slice(6);

      // サーバーの実行を開始
      const runner = runRebootableServer(
        savePath,
        this.id,
        settings,
        progress,
        notification
      );

      this.runner = runner;

      beforeTitle.delete();

      return withError({ runner, ngrokListener, settings }, errors);
    } catch (e) {
      // 起動準備の途中で例外が発生した場合は，サーバー終了後と同様に
      // ポート番号・Ngrok・使用中フラグを元に戻してからエラーを返す
      beforeTitle.delete();
      const error = toRuntimeError(e);
      try {
        const after = await this.afterRunExec(
          progress,
          { ngrokListener, settings },
          error
        );
        errors.push(...after.errors);
      } catch (cleanupError) {
        // 後処理（リモートへのpushなど）でも例外が発生した場合は，元のエラーを優先して返す
        errors.push(toRuntimeError(cleanupError));
      }
      return withError(error, errors);
    }
  }

  /**
   * サーバー終了後に設定を元に戻してデータを同期する
   *
   * 起動準備の途中で失敗した場合の後処理にも利用する
   *
   * @param progress 進捗の表示先
   * @param context 起動時の情報
   * @param serverResult サーバーの実行結果
   * @returns 終了後のワールド情報
   */
  private async afterRunExec(
    progress: GroupProgressor,
    context: Pick<ReadyRunContext, 'ngrokListener' | 'settings'>,
    serverResult: Failable<undefined>
  ): Promise<WithError<Failable<World>>> {
    const { ngrokListener, settings } = context;
    const savePath = this.getSavePath();
    const userPorts = this.userPorts;
    const errors: ErrorMessage[] = [];

    // ポートを削除
    this.port = undefined;
    this.userPorts = undefined;
    this.runner = undefined;

    progress.title({
      key: 'server.run.after.title',
    });

    // server.propertiesのポート番号をユーザーの設定値に戻す
    // (サーバーが異常終了した場合も含め，リモートへのpushより前に戻しておく)
    if (userPorts !== undefined) {
      const restored = await this.restoreUserPorts(savePath, userPorts);
      if (isError(restored)) errors.push(restored);
    }

    // Ngrokを閉じる (失敗しても終了後の処理は続行する)
    if (ngrokListener) {
      const closed = await failabilify(closeNgrok)(ngrokListener);
      if (isError(closed)) errors.push(closed);
    }

    // 使用中フラグを折り，ワールドの最終プレイを現在時刻にして保存を試みる (無理なら諦める)
    settings.last_date = getCurrentTimestamp();
    settings.using = false;
    const saveSub = progress.subtitle({ key: 'server.save.localSetting' });
    await serverJsonFile.save(savePath, settings);
    saveSub.delete();

    // pushを実行
    await this.push(progress);

    // サーバーの実行が失敗していたらエラー
    if (isError(serverResult)) return withError(serverResult, errors);

    // ワールド情報を再取得
    const afterWorld = await this.loadExec(progress);
    afterWorld.errors.unshift(...errors);
    return afterWorld;
  }

  /**
   * server.propertiesのポート番号をユーザーの設定値に戻す
   *
   * @param savePath ワールドの保存先
   * @param userPorts ユーザーが設定しているポート番号
   */
  private async restoreUserPorts(
    savePath: Path,
    userPorts: ServerPorts
  ): Promise<Failable<void>> {
    const properties = await serverPropertiesFile.load(savePath);
    if (isError(properties)) return properties;
    return await serverPropertiesFile.save(
      savePath,
      withServerPorts(properties, userPorts)
    );
  }

  /** コマンドを実行 */
  async runCommand(command: string) {
    // コマンドが"/"で始まった場合"/"を削除
    if (command.startsWith('/')) command = command.slice(1);
    await this.runner?.runCommand(command);
  }

  /** サーバーを再起動 */
  async reboot() {
    await this.runner?.reboot();
  }
}
