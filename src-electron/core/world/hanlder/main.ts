import { WorldContainer, WorldName } from 'app/src-electron/schema/brands';
import { World, WorldID } from 'app/src-electron/schema/world';
import { getWorldSettingsHandler } from '../../file/handler/worldSetting';
import { Path } from 'app/src-electron/util/path';
import { serverPropertiesFile } from '../files/properties';
import { serverIconFile } from '../files/icon';
import { loadPlayers } from './players';
import { serverAllAdditionalFiles } from '../files/addtional/all';
import { Failable, FailableChain } from 'app/src-electron/util/error/failable';
import { isError } from 'app/src-electron/util/error/error';

export const WORLD_SETTINGS_PATH = 'server_settings.json';

/** ローカルのワールドのデータの読み書きを操作するクラス */
export class WorldHandler {
  private _name;
  private _container;
  private _id;
  private _path;
  private worldSettings;

  get id() {
    return this._id;
  }
  get name() {
    return this._name;
  }
  get container() {
    return this._container;
  }
  private get jsonPath() {
    return this._path.child(WORLD_SETTINGS_PATH);
  }

  constructor(name: WorldName, container: WorldContainer, id: WorldID) {
    this._id = id;

    this._container = container;
    this._name = name;
    this._path = new Path(container).child(name);

    this.worldSettings = getWorldSettingsHandler(this.jsonPath);
  }

  /** ワールドの位置を再設定 */
  setWorldLocation(name: WorldName, container: WorldContainer) {
    this._name = name;
    this._container = container;
    this._path = new Path(container).child(name);

    this.worldSettings = getWorldSettingsHandler(this.jsonPath);
  }

  /**
   * ワールドデータを読み込む
   * flush = false (defalut): メモリに乗ったキャッシュがあれば使用する
   * flush = true: 必ずファイルを再読み込みする
   */
  async load(flush = false): Promise<Failable<World>> {
    const [avater_path, additional, properties, players] = await Promise.all([
      this.loadIcon(),
      this.loadAdditionals(),
      this.loadProperties(),
      this.loadPlayers(),
    ]);

    const worldSettings = await this.loadJson(flush);

    // worldSettingsJsonが読み込めなかった場合はエラー
    if (isError(worldSettings)) return worldSettings;

    // worldオブジェクトを生成
    const world: World = {
      id: this.id,
      name: this.name,
      container: this.container,
      avater_path: new FailableChain(avater_path).orDefault(undefined),
      version: worldSettings.version,
      using: worldSettings.using,
      remote: worldSettings.remote,
      last_date: worldSettings.last_date,
      last_user: worldSettings.last_user,
      last_id: worldSettings.last_id,
      memory: worldSettings.memory,
      additional: additional.value,
      properties,
      players,
      ngrok_setting: worldSettings.ngrok_setting,
    };

    return world;
  }

  /**
   * server_settings.json の内容を読み取る
   * flush = false (defalut): メモリに乗ったキャッシュがあれば使用する
   * flush = true: 必ずファイルを再読み込みする
   */
  loadJson(flush = false) {
    return this.worldSettings.load(flush);
  }

  /**
   * server.properties の内容を読み取る
   */
  loadProperties() {
    return serverPropertiesFile.load(this._path);
  }

  /**
   * icon.png の内容を読み取る
   */
  loadIcon() {
    return serverIconFile.load(this._path);
  }

  /**
   * datapack / plugin / mod を読みとる
   */
  loadAdditionals() {
    return serverAllAdditionalFiles.load(this._path, this.id);
  }

  /**
   * whilelist と ops を読みとり、PlayerSetting[] を構成
   */
  loadPlayers() {
    return loadPlayers(this._path);
  }
}
