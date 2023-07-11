import { World, WorldEdited, WorldID } from 'app/src-electron/schema/world';
import { pullRemoteWorld, pushRemoteWorld } from '../remote/remote';
import { WorldContainer, WorldName } from 'app/src-electron/schema/brands';
import { worldContainerToPath } from './worldContainer';
import { failabilify } from 'app/src-electron/util/error/failable';
import { withError } from 'app/src-electron/util/error/witherror';
import { validateNewWorldName } from './name';
import { genUUID } from 'app/src-electron/tools/uuid';
import { WorldSettings, serverJsonFile } from './files/json';
import {
  LocalWorldResult,
  constructWorldSettings,
  constructWorldSettingsOther,
  formatWorldDirectory,
  getNewWorldSettingsOther,
  loadLocalFiles,
  saveLocalFiles,
} from './local';
import { RunServer, runServer } from '../server/server';
import { getSystemSettings } from '../stores/system';
import { getCurrentTimestamp } from 'app/src-electron/util/timestamp';
import { isError, isValid } from 'app/src-electron/util/error/error';
import { errorMessage } from 'app/src-electron/util/error/construct';
import {
  ErrorMessage,
  Failable,
  WithError,
} from 'app/src-electron/schema/error';
import { PlainProgressor, genWithPlain } from '../progress/progress';
import { sleep } from 'app/src-electron/util/sleep';
import { api } from '../api';
import { closeServerStarterAndShutDown } from 'app/src-electron/lifecycle/exit';
import { onQuit } from 'app/src-electron/lifecycle/lifecycle';

/** 複数の処理を並列で受け取って直列で処理 */
class PromiseSpooler {
  /** 待機中の処理のQueue */
  spoolingQueue: [
    () => Promise<any>,
    (value: any | PromiseLike<any>) => void,
    undefined | string
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
      string | undefined
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
      const result = await process();
      resolve(result);
    }
    this.running = false;
  }
}

/** ワールドの(取得/保存)/サーバーの実行を担うクラス */
export class WorldHandler {
  private static worldHandlerMap: Record<WorldID, WorldHandler> = {};

  promiseSpooler: PromiseSpooler;
  name: WorldName;
  container: WorldContainer;
  id: WorldID;
  runner: RunServer | undefined;

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
    const id = genUUID() as WorldID;
    WorldHandler.worldHandlerMap[id] = new WorldHandler(id, name, container);
    return id;
  }

  // worldIDからWorldHandlerを取得する
  static get(id: WorldID): Failable<WorldHandler> {
    if (!(id in WorldHandler.worldHandlerMap))
      return errorMessage.core.world.invalidWorldId({ id });
    return WorldHandler.worldHandlerMap[id];
  }

  /** 現在のワールドの保存場所を返す */
  getSavePath() {
    return worldContainerToPath(this.container).child(this.name);
  }

  /** セーブデータを移動する*/
  private async move(name: WorldName, container: WorldContainer) {
    // 現在のワールドの保存場所
    const currentPath = this.getSavePath();
    // 変更される保存先
    const targetPath = worldContainerToPath(container).child(name);

    // パスに変化がない場合はなにもしない
    if (currentPath.path === targetPath.path) return targetPath;

    // 保存ディレクトリを移動する
    await currentPath.moveTo(targetPath);

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

  private async pull(progress?: PlainProgressor) {
    // ローカルに保存されたワールド設定Jsonを読み込む(リモートの存在を確認するため)
    const withPlain = genWithPlain(progress);

    const loadLocalServerJson = () => this.loadLocalServerJson();

    const worldSettings = await withPlain(loadLocalServerJson, {
      title: {
        key: 'server.remote.check',
      },
    });
    if (isError(worldSettings)) return worldSettings;

    // リモートが存在する場合Pull
    if (worldSettings.remote) {
      const remote = worldSettings.remote;
      const savePath = this.getSavePath();
      const pull = await withPlain(() => pullRemoteWorld(savePath, remote), {
        title: {
          key: 'server.remote.pull',
          args: {
            remote: remote,
          },
        },
      });

      // Pullに失敗した場合エラー
      if (isError(pull)) return pull;
    }
  }

  private async push(progress?: PlainProgressor) {
    const withPlain = genWithPlain(progress);

    // ローカルに保存されたワールド設定Jsonを読み込む(リモートの存在を確認するため)
    const loadLocalServerJson = () => this.loadLocalServerJson();

    const worldSettings = await withPlain(loadLocalServerJson, {
      title: {
        key: 'server.remote.check',
      },
    });

    if (isError(worldSettings)) return worldSettings;

    // リモートが存在する場合Push
    const remote = worldSettings.remote;
    if (remote) {
      const savePath = this.getSavePath();
      const push = await withPlain(() => pushRemoteWorld(savePath, remote), {
        title: {
          key: 'server.remote.push',
          args: {
            remote: remote,
          },
        },
      });

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
    progress?: PlainProgressor
  ): Promise<WithError<Failable<World>>> {
    const func = () => this.saveExec(world, progress);
    return await this.promiseSpooler.spool(func, 'SAVE');
  }

  /** サーバーのデータを保存 */
  private async saveExec(
    world: WorldEdited,
    progress?: PlainProgressor
  ): Promise<WithError<Failable<World>>> {
    const withPlain = genWithPlain(progress);
    const errors: ErrorMessage[] = [];

    // セーブデータを移動
    await withPlain(() => this.move(world.name, world.container), {
      title: {
        key: 'server.local.movingSaveData',
        args: {
          world: world.name,
          container: world.container,
        },
      },
    });
    const savePath = this.getSavePath();

    // リモートからpull
    const pullResult = this.pull(progress);
    if (isError(pullResult)) return withError(pullResult);

    const loadLocalServerJson = () => this.loadLocalServerJson();

    // ローカルに保存されたワールド設定Jsonを読み込む(使用中かどうかを確認するため)
    const worldSettings = await withPlain(loadLocalServerJson, {
      title: {
        key: 'server.local.checkUsing',
      },
    });

    if (isError(worldSettings)) return withError(worldSettings);

    const worldSettingsOther = constructWorldSettingsOther(worldSettings);

    // 使用中の場合、現状のデータを再読み込みして終了
    if (worldSettings.using) {
      errors.push(
        errorMessage.core.world.worldAleradyRunning({
          container: this.container,
          name: this.name,
        })
      );
      const world = await withPlain(this.loadLocal, {
        title: {
          key: 'server.local.reloading',
        },
      });
      world.errors.push(...errors);
      return getWorld(world);
    }

    // 変更をローカルに保存
    // additionalの解決、custum_map,remote_sourceの導入も行う
    const result = await withPlain(
      () => saveLocalFiles(savePath, world, worldSettingsOther),
      {
        title: {
          key: 'server.local.saving',
        },
      }
    );
    result.errors.push(...errors);

    // リモートにpush
    const push = await this.push(progress);
    if (isError(push)) return withError(push, errors);

    return getWorld(result);
  }

  private async fix() {
    const local = await this.loadLocal();
    const world = local.value;
    if (isError(world)) return local;

    // フラグを折ってjsonに保存
    world.world.using = false;
    await serverJsonFile.save(
      this.getSavePath(),
      constructWorldSettings(world.world, world.other)
    );

    // リモートにpush
    const push = await this.push();
    if (isError(push)) return withError(push);

    return local;
  }

  /** サーバーのデータをロード(戻り値がLocalWorldResult) */
  private async loadAsLocalWorld(): Promise<
    WithError<Failable<LocalWorldResult>>
  > {
    // ローカルに保存されたワールド設定Jsonを読み込む(実行中フラグの確認)
    const worldSettings = await this.loadLocalServerJson();
    if (isError(worldSettings)) return withError(worldSettings);

    const owner = (await getSystemSettings()).user.owner;

    // 自分が使用中かつプロセスが起動していない場合
    // (前回の起動時に正常にサーバーが終了しなかった場合)
    if (
      worldSettings.using === true &&
      worldSettings.last_user === owner &&
      this.runner === undefined
    ) {
      // フラグを折ってPush
      return await this.fix();
    }
    // リモートからpull
    const pullResult = await this.pull();
    if (isError(pullResult)) return withError(pullResult);

    // ローカルデータをロード
    return await this.loadLocal();
  }

  async load(): Promise<WithError<Failable<World>>> {
    const func = () => this.loadExec();
    return await this.promiseSpooler.spool(func);
  }

  /** サーバーのデータをロード */
  private async loadExec(): Promise<WithError<Failable<World>>> {
    return getWorld(await this.loadAsLocalWorld());
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

    const other = getNewWorldSettingsOther();

    // ワールド設定Jsonをローカルに保存(これがないとエラーが出るため)
    const worldSettings = constructWorldSettings(world, other);
    // リモートの設定だけは消しておく(存在しないブランチからPullしないように)
    // 新規作成時にPull元を指定する場合はworld.remote_sourceを指定することで可能
    delete worldSettings.remote;
    await this.saveLocalServerJson(worldSettings);

    // データを保存
    return await this.saveExec(world);
  }

  async delete(): Promise<WithError<Failable<undefined>>> {
    const func = () => this.deleteExec();
    return await this.promiseSpooler.spool(func);
  }

  /** ワールドを削除(リモ－トは削除しない) */
  private async deleteExec(): Promise<WithError<Failable<undefined>>> {
    const result = await failabilify(() => this.getSavePath().remove(true))();
    if (isError(result)) return withError(result);
    delete WorldHandler.worldHandlerMap[this.id];
    return withError(undefined);
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

    onQuit(() => console.log('QUIIITQETTETQTTETQEQ'), true);

    // アプリケーションを終了
    closeServerStarterAndShutDown();
  }

  async run(progress: PlainProgressor): Promise<WithError<Failable<World>>> {
    const func = () => this.runExec(progress);
    const result = await this.promiseSpooler.spool(func);

    // サーバーの実行に成功した場合のみシャットダウン(シャットダウンしないこともある)
    if (isValid(result)) this.shutdown();

    return result;
  }

  /** データを同期して サーバーを起動 */
  private async runExec(
    progress: PlainProgressor
  ): Promise<WithError<Failable<World>>> {
    const errors: ErrorMessage[] = [];
    // 起動中の場合エラー
    if (this.runner !== undefined)
      return withError(
        errorMessage.core.world.worldAleradyRunning({
          container: this.container,
          name: this.name,
        })
      );

    // ワールド情報を取得
    const loadAsLocalWorld = () => this.loadAsLocalWorld();
    const loadResult = await progress.withPlain(loadAsLocalWorld, {
      title: { key: 'server.local.loading' },
    });

    // 取得に失敗したらエラー
    if (isError(loadResult.value)) return getWorld(loadResult);

    errors.push(...loadResult.errors);

    const beforeWorld = loadResult.value.world;
    const beforeWorldOther = loadResult.value.other;

    // serverstarterの実行者UUID
    const selfOwner = (
      await progress.withPlain(getSystemSettings, {
        title: {
          key: 'server.getOwner',
        },
      })
    ).user.owner;

    // 自分以外の誰かが起動している場合エラー
    if (beforeWorld.using && beforeWorld.last_user !== selfOwner)
      return withError(
        errorMessage.core.world.worldAleradyRunning({
          container: this.container,
          name: this.name,
          owner: beforeWorld.last_user,
        }),
        errors
      );

    const settings = constructWorldSettings(beforeWorld, beforeWorldOther);
    const savePath = this.getSavePath();

    // 使用中フラグを立てて保存
    beforeWorld.using = true;
    beforeWorld.last_user = selfOwner;
    beforeWorld.last_date = getCurrentTimestamp();
    const saveResult = await this.saveExec(beforeWorld, progress);

    // 保存に失敗したらエラー (ここでコンフリクト起きそう)
    if (isError(saveResult.value)) {
      // 使用中フラグを折って保存を試みる (無理なら諦める)
      await progress.withPlain(() => serverJsonFile.save(savePath, settings), {
        title: {
          key: 'server.local.savingSettingFiles',
        },
      });
      return saveResult;
    }
    errors.push(...saveResult.errors);

    // pluginとvanillaでファイル構造を切り替える
    const directoryFormatResult = await formatWorldDirectory(
      savePath,
      beforeWorldOther.directoryType,
      settings.version,
      progress
    );
    errors.push(...directoryFormatResult.errors);

    // サーバーの実行を開始
    const runPromise = runServer(savePath, this.id, settings, progress);

    this.runner = runPromise;

    // タイトルを削除
    progress.title = null;

    // サーバーの終了を待機
    const serverResult = await runPromise;

    this.runner = undefined;

    progress.title = {
      key: 'server.postProcessing',
      args: {
        container: this.container,
        world: this.name,
      },
    };

    // 使用中フラグを折って保存を試みる (無理なら諦める)
    settings.using = false;
    beforeWorld.last_date = getCurrentTimestamp();
    await progress.withPlain(() => serverJsonFile.save(savePath, settings), {
      title: {
        key: 'server.local.savingSettingFiles',
      },
    });

    // サーバーの実行が失敗したらエラー
    if (isError(serverResult)) return withError(serverResult);

    // ワールド情報を再取得
    const load = () => this.loadExec();
    return await progress.withPlain(load, {
      title: {
        key: 'server.local.reloading',
      },
    });
  }

  /** コマンドを実行 */
  async runCommand(command: string) {
    await this.runner?.runCommand(command);
  }
}

function getWorld(
  local: WithError<Failable<LocalWorldResult>>
): WithError<Failable<World>> {
  if (isValid(local.value)) {
    return withError(local.value.world, local.errors);
  } else {
    return withError(local.value, local.errors);
  }
}
