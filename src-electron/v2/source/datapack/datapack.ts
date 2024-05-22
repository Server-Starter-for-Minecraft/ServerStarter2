import { DatapackDomain } from '../../schema/datapack';
import { Result } from '../../util/base';
import { Path } from '../../util/binary/path';

/**
 * データパックを格納するフォルダのような何か
 *
 * シングルトン
 */
export class DatapackContainer {
  /**
   * コンテナ内のデータパック一覧を表示
   */
  static list(): Promise<DatapackDomain[]>;

  /**
   * データパックを作成
   */
  static create(
    srcPath: Path,
    meta: DatapackDomain
  ): Promise<Result<DatapackDomain, Error>>;

  /**
   * メタデータを更新
   */
  static updateMeta(meta: DatapackDomain): Promise<Result<void, Error>>;

  /**
   * データパックを削除
   */
  static delete(): Promise<Result<void, Error>>;

  /**
   * データパックをpathに導入
   * @param path
   */
  static extractTo(mata: DatapackDomain, path: Path): Promise<Result<void>>;
}

// ('api/v1/container/:container_id/world/:world_id');
// ('api/v1/container/:container_id/backup/:backup_id');

// ('api/v1/mods/:mods_id/mod/:mode_id');
// ('api/v1/plugins/:plugins_id/plugin/:plugin_id');
// ('api/v1/datapacks/:datapacks_id/datapack/:datapack_id');

// ('api/v1/runtime /minecraft/runtime_gamma');
// ('api/v1/runtime/coretto/21');

// ('api/v1/version/vanilla/24w18a');
// ('api/v1/version/spigot/1.20.4');
// ('api/v1/version/forge/1.20.4/50.0.22');
// ('api/v1/version/papermc/1.20.6/79');
// ('api/v1/version/mohistmc/1.20.1/727');
// ('api/v1/version/fabric/1.20.1/0.15.11/0.11.2');

// api.v1.version.fabric['1.20.1']['0.15.11']['0.11.2'].get();
