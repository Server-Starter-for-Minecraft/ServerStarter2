import {
  World,
  WorldAdditional,
  WorldEdited,
  WorldID,
} from 'app/src-electron/schema/world';
import { pullRemoteWorld } from '../remote/remote';
import { WorldContainer, WorldName } from 'app/src-electron/schema/brands';
import { worldContainerToPath } from './worldContainer';
import {
  Failable,
  failabilify,
  isFailure,
} from 'app/src-electron/api/failable';
import { worldSettingsToWorld } from '../settings/converter';
import { Remote } from 'app/src-electron/schema/remote';
import { WithError, withError } from 'app/src-electron/api/witherror';
import { installAdditionals } from '../installer/installer';
import { validateNewWorldName } from './name';
import { genUUID } from 'app/src-electron/tools/uuid';
import { WorldSettings, serverJsonFile } from './settings/json';
import { loadLocalFiles, saveLocalFiles } from './local';

export class WorldHandlerError extends Error {}

export class WorldHandler {
  private static worldPathMap: Record<WorldID, WorldHandler> = {};

  name: WorldName;
  container: WorldContainer;
  id: WorldID;
  private constructor(id: WorldID, name: WorldName, container: WorldContainer) {
    this.id = id;
    this.name = name;
    this.container = container;
  }

  /** WorldAbbrができた段階でここに登録し、idを生成 */
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

  static get(id: WorldID): Failable<WorldHandler> {
    if (!(id in WorldHandler.worldPathMap)) {
      return new Error(`missing world data is:${id}`);
    }
    return WorldHandler.worldPathMap[id];
  }

  /** 現在のワールドの保存場所を返す */
  getSavePath() {
    return worldContainerToPath(this.container).child(this.name);
  }

  /** セーブデータを移動する*/
  async move(name: WorldName, container: WorldContainer) {
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

  private async pull(remote: Remote) {
    const savePath = this.getSavePath();

    // セーブデータをリモートからPull
    const pull = await pullRemoteWorld(savePath, remote);

    // Pullに失敗した場合エラー
    return pull;
  }

  /** サーバーのデータを保存 */
  async save(world: WorldEdited): Promise<WithError<Failable<World>>> {
    // 現在のデータを読み込む
    const currentWorld = await this.load();
    if (isFailure(currentWorld)) return withError(currentWorld);

    const errors: Error[] = [];

    // セーブデータ移動
    await this.move(world.name, world.container);
    const savePath = this.getSavePath();
    currentWorld.name = world.name;
    currentWorld.container = world.container;

    // 使用中の場合パスだけ変更して返す
    if (currentWorld.using) {
      errors.push(new WorldHandlerError(`world '${savePath.path}' is using`));
      return withError(currentWorld, errors);
    }

    // TODO: カスタムマップの導入処理
    if (world.custom_map) {
    }

    // Datapack/Mod/Pluginの導入処理
    const addtionalResult = await installAdditionals(
      world.additional,
      savePath
    );
    world.additional = addtionalResult.value;
    errors.push(...addtionalResult.errors);

    await saveLocalFiles(savePath, world);

    return withError(world, errors);
  }

  /** サーバーのデータをロード */
  async load(): Promise<Failable<World>> {
    const savePath = this.getSavePath();

    // ローカルに保存されたワールド設定を読み込む
    let worldSettings = await serverJsonFile.load(savePath);
    if (isFailure(worldSettings)) return worldSettings;

    // セーブデータをリモートからPull
    if (worldSettings.remote) {
      // セーブデータをリモートからPull
      const pull = await pullRemoteWorld(savePath, worldSettings.remote);

      // Pullに失敗した場合エラー
      if (isFailure(pull)) return pull;
    }

    // ローカルの設定ファイルを読み込む
    const world = await loadLocalFiles(
      savePath,
      this.id,
      this.name,
      this.container
    );

    return world;
  }

  /** サーバーのデータを新規作成して保存 */
  async create(world: WorldEdited): Promise<WithError<Failable<World>>> {
    this.container = world.container;
    this.name = world.name;
    const savePath = this.getSavePath();

    const errors: Error[] = [];

    // ワールド名が使用不能だった場合(たぶん起こらない)
    const worldNameValidated = validateNewWorldName(
      world.container,
      world.name
    );
    if (isFailure(worldNameValidated)) {
      return withError(worldNameValidated, errors);
    }

    // 保存先ディレクトリを作成
    await savePath.mkdir(true);

    // remote_sourceが存在した場合にセーブデータをリモートからPull
    if (world.remote_source) {
      const pull = await pullRemoteWorld(savePath, world.remote_source);
      // Pullに失敗した場合エラー
      if (isFailure(pull)) return withError(pull);
      delete world.remote_source;
    }

    // TODO: カスタムマップの導入処理
    if (world.custom_map) {
    }
    delete world.custom_map;

    // Datapack/Mod/Pluginの導入処理
    const addtionalResult = await installAdditionals(
      world.additional,
      savePath
    );
    world.additional = addtionalResult.value;
    errors.push(...addtionalResult.errors);

    // 設定ファイルの保存
    await saveLocalFiles(savePath, world);

    return withError(world, errors);
  }

  async delete(): Promise<WithError<Failable<undefined>>> {
    const result = await failabilify(() => this.getSavePath().remove(true))();
    if (isFailure(result)) return withError(result);
    delete WorldHandler.worldPathMap[this.id];
    return withError(undefined);
  }
}