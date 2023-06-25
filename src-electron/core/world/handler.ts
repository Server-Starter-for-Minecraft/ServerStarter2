import {
  World,
  WorldAdditional,
  WorldEdited,
  WorldID,
  WorldSettings,
} from 'app/src-electron/schema/world';
import { pullRemoteWorld } from '../remote/remote';
import { WorldContainer, WorldName } from 'app/src-electron/schema/brands';
import { worldContainerToPath } from './worldContainer';
import { Failable, isFailure } from 'app/src-electron/api/failable';
import { loadWorldJson, saveWorldJson } from '../settings/worldJson';
import { getIconURI, setIconURI } from './icon';
import { worldSettingsToWorld } from '../settings/converter';
import { Remote } from 'app/src-electron/schema/remote';
import { WithError, withError } from 'app/src-electron/api/witherror';
import { installAdditionals } from '../installer/installer';

export class WorldHandlerError extends Error {}

export class WorldHandler {
  static worldPathMap: Record<WorldID, WorldHandler> = {};

  name: WorldName;
  container: WorldContainer;
  id: WorldID;
  private constructor(id: WorldID, name: WorldName, container: WorldContainer) {
    this.id = id;
    this.name = name;
    this.container = container;
  }

  static get(id: WorldID, name: WorldName, container: WorldContainer) {
    if (!(id in WorldHandler.worldPathMap)) {
      WorldHandler.worldPathMap[id] = new WorldHandler(id, name, container);
    }
    return WorldHandler.worldPathMap[id];
  }

  /** 現在のワールドの保存場所を返す */
  gatSavePath() {
    return worldContainerToPath(this.container).child(this.name);
  }

  /** セーブデータを移動する*/
  async move(name: WorldName, container: WorldContainer) {
    // 現在のワールドの保存場所
    const currentPath = this.gatSavePath();
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
    const savePath = this.gatSavePath();

    // セーブデータをリモートからPull
    const pull = await pullRemoteWorld(savePath, remote);
    // Pullに失敗した場合エラー
    if (isFailure(pull)) return pull;

    // リモートからPullしてきたワールド設定を読み込んで上書き
    const worldSettings = await loadWorldJson(savePath);
    if (isFailure(worldSettings)) return worldSettings;

    return worldSettings;
  }

  /** サーバーのデータを保存 */
  async save(world: WorldEdited): Promise<WithError<Failable<World>>> {
    // 現在のデータを読み込む
    const currentWorld = await this.load();
    if (isFailure(currentWorld)) return withError(currentWorld);

    const errors: Error[] = [];

    // セーブデータ移動
    await this.move(world.name, world.container);
    const savePath = this.gatSavePath();
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
    currentWorld.additional = addtionalResult.value;
    errors.push(...addtionalResult.errors);

    if (world.avater_path) {
      const avaratResult = await setIconURI(savePath, world.avater_path);
      if (isFailure(avaratResult)) errors.push(avaratResult);
      // 成功した場合のみ上書き
      else currentWorld.avater_path = world.avater_path;
    }

    // 特に処理の必要のない設定を上書き
    currentWorld.version = world.version;
    currentWorld.using = world.using;
    currentWorld.last_date = world.last_date;
    currentWorld.last_user = world.last_user;
    currentWorld.memory = world.memory;
    currentWorld.properties = world.properties;
    currentWorld.remote = world.remote;
    currentWorld.players = world.players;
    currentWorld.javaArguments = world.javaArguments;

    const settings: WorldSettings = {
      version: world.version,
      using: world.using,
      last_date: world.last_date,
      last_user: world.last_user,
      memory: world.memory,
      properties: world.properties,
      remote: world.remote,
      players: world.players,
      javaArguments: world.javaArguments,
    };

    // jsonを保存
    await saveWorldJson(savePath, settings);

    return withError(currentWorld, errors);
  }

  /** サーバーのデータをロード */
  async load() {
    const savePath = this.gatSavePath();

    // ローカルに保存されたワールド設定を読み込む
    let worldSettings = await loadWorldJson(savePath);
    if (isFailure(worldSettings)) return worldSettings;

    // セーブデータをリモートからPull
    if (worldSettings.remote) {
      const remoteWorldSettings = await this.pull(worldSettings.remote);

      // Pullに失敗した場合エラー
      if (isFailure(remoteWorldSettings)) return remoteWorldSettings;

      // リモートからPullしてきたワールド設定を読み込んで上書き
      worldSettings = remoteWorldSettings;
    }

    // アバターの読み込み
    const avater_path = await getIconURI(savePath);

    // worldオブジェクトを生成
    const world = worldSettingsToWorld({
      id: this.id,
      name: this.name,
      container: this.container,
      avater_path,
      settings: worldSettings,
    });

    return world;
  }
}
