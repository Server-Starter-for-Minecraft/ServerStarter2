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

/** ワールドの(取得/保存)/サーバーの実行を担うクラス */
export class WorldHandler {
  private static worldPathMap: Record<WorldID, WorldHandler> = {};

  name: WorldName;
  container: WorldContainer;
  id: WorldID;
  run: RunServer | undefined;
  private constructor(id: WorldID, name: WorldName, container: WorldContainer) {
    this.id = id;
    this.name = name;
    this.container = container;
    this.run = undefined;
  }

  /** WorldAbbr/WorldNewができた段階でここに登録し、idを生成 */
  static register(name: WorldName, container: WorldContainer): WorldID {
    const registered = Object.entries(WorldHandler.worldPathMap).find(
      ([, value]) => value.container == container && value.name == name
    );
    // 既に登録済みの場合登録されたidを返す
    if (registered !== undefined) {
      return registered[0] as WorldID;
    }
    const id = genUUID() as WorldID;
    WorldHandler.worldPathMap[id] = new WorldHandler(id, name, container);
    return id;
  }

  // worldIDからWorldHandlerを取得する
  static get(id: WorldID): Failable<WorldHandler> {
    if (!(id in WorldHandler.worldPathMap))
      return errorMessage.core.world.invalidWorldId({ id });
    return WorldHandler.worldPathMap[id];
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

  /** サーバーのデータを保存 */
  async save(
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
      this.run === undefined
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

  /** サーバーのデータをロード */
  async load(): Promise<WithError<Failable<World>>> {
    return getWorld(await this.loadAsLocalWorld());
  }

  /** サーバーのデータを新規作成して保存 */
  async create(world: WorldEdited): Promise<WithError<Failable<World>>> {
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
    return await this.save(world);
  }

  /** ワールドを削除(リモ－トは削除しない) */
  async delete(): Promise<WithError<Failable<undefined>>> {
    const result = await failabilify(() => this.getSavePath().remove(true))();
    if (isError(result)) return withError(result);
    delete WorldHandler.worldPathMap[this.id];
    return withError(undefined);
  }

  /** データを同期して サーバーを起動 */
  async runServer(
    progress: PlainProgressor
  ): Promise<WithError<Failable<World>>> {
    const errors: ErrorMessage[] = [];
    // 起動中の場合エラー
    if (this.run !== undefined)
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
    const saveResult = await this.save(beforeWorld, progress);

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

    this.run = runPromise;

    // タイトルを削除
    progress.title = null;

    // サーバーの終了を待機
    const serverResult = await runPromise;

    this.run = undefined;

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
    const load = () => this.load();
    return await progress.withPlain(load, {
      title: {
        key: 'server.local.reloading',
      },
    });
  }

  /** コマンドを実行 */
  async runCommand(command: string) {
    await this.run?.runCommand(command);
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
