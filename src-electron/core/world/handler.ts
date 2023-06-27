import { World, WorldEdited, WorldID } from 'app/src-electron/schema/world';
import { pullRemoteWorld, pushRemoteWorld } from '../remote/remote';
import { WorldContainer, WorldName } from 'app/src-electron/schema/brands';
import { worldContainerToPath } from './worldContainer';
import {
  Failable,
  failabilify,
  isFailure,
} from 'app/src-electron/api/failable';
import { WithError, withError } from 'app/src-electron/api/witherror';
import { installAdditionals } from '../installer/installer';
import { validateNewWorldName } from './name';
import { genUUID } from 'app/src-electron/tools/uuid';
import { WorldSettings, serverJsonFile } from './files/json';
import {
  constructWorldSettings,
  loadLocalFiles,
  saveLocalFiles,
} from './local';

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
    if (!(id in WorldHandler.worldPathMap)) {
      return new Error(`missing world data is:${id}`);
    }
    return WorldHandler.worldPathMap[id];
  }

  /** 現在のワールドの保存場所を返す */
  private getSavePath() {
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

  private async pull() {
    // ローカルに保存されたワールド設定Jsonを読み込む(リモートの存在を確認するため)
    let worldSettings = await this.loadLocalServerJson();
    if (isFailure(worldSettings)) return worldSettings;

    // リモートが存在する場合Pull
    if (worldSettings.remote) {
      const savePath = this.getSavePath();
      const pull = await pullRemoteWorld(savePath, worldSettings.remote);

      // Pullに失敗した場合エラー
      if (isFailure(pull)) return pull;
    }
  }

  private async push() {
    // ローカルに保存されたワールド設定Jsonを読み込む(リモートの存在を確認するため)
    let worldSettings = await this.loadLocalServerJson();
    if (isFailure(worldSettings)) return worldSettings;

    // リモートが存在する場合Push
    if (worldSettings.remote) {
      const savePath = this.getSavePath();
      const push = await pushRemoteWorld(savePath, worldSettings.remote);

      // Pushに失敗した場合エラー
      if (isFailure(push)) return push;
    }
  }

  private async loadLocal() {
    const savePath = this.getSavePath();
    // ローカルの設定ファイルを読み込む
    return await loadLocalFiles(savePath, this.id, this.name, this.container);
  }

  /** サーバーのデータを保存 */
  async save(world: WorldEdited): Promise<WithError<Failable<World>>> {
    const errors: Error[] = [];

    // セーブデータを移動
    await this.move(world.name, world.container);
    const savePath = this.getSavePath();

    // リモートからpull
    const pullResult = await this.pull();
    if (isFailure(pullResult)) return withError(pullResult);

    // ローカルに保存されたワールド設定Jsonを読み込む(使用中かどうかを確認するため)
    let worldSettings = await this.loadLocalServerJson();
    if (isFailure(worldSettings)) return withError(worldSettings);

    // 使用中の場合、現状のデータを再読み込みして終了
    if (worldSettings.using) {
      errors.push(new WorldHandlerError(`world '${savePath.path}' is using`));
      const world = await this.loadLocal();
      world.errors.push(...errors);
      return world;
    }

    // 変更をローカルに保存
    // additionalの解決、custum_map,remote_sourceの導入も行う
    const result = saveLocalFiles(savePath, world);
    (await result).errors.push(...errors);

    // リモートにpush
    const push = await this.push();
    if (isFailure(push)) return withError(push, errors);

    return result;
  }

  /** サーバーのデータをロード */
  async load(): Promise<WithError<Failable<World>>> {
    // リモートからpull
    const pullResult = await this.pull();
    if (isFailure(pullResult)) return withError(pullResult);

    // ローカルデータをロード
    return await this.loadLocal();
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

    // ワールド設定Jsonをローカルに保存(これがないとエラーが出るため)
    let worldSettings = constructWorldSettings(world);
    // リモートの設定だけは消しておく(存在しないブランチからPullしないように)
    // 新規作成時にPull元を指定する場合はworld.remote_sourceを指定することで可能
    delete worldSettings.remote;
    await this.saveLocalServerJson(worldSettings);

    // データを保存
    return await this.save(world);
  }

  async delete(): Promise<WithError<Failable<undefined>>> {
    const result = await failabilify(() => this.getSavePath().remove(true))();
    if (isFailure(result)) return withError(result);
    delete WorldHandler.worldPathMap[this.id];
    return withError(undefined);
  }
}
