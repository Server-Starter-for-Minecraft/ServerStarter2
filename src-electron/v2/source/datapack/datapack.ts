import { WithExists } from '../../schema/additional';
import { DatapackInfo } from '../../schema/datapack';
import { Result } from '../../util/base';
import { Path } from '../../util/binary/path';

/**
 * データパックを格納するフォルダのような何か
 */
export abstract class DatapackContainer {
  /**
   * コンテナ内のデータパック一覧を表示
   *
   * @param fromCache true の時は cache.json から内容を読み取る / false の時はdataディレクトリを走査して cache.jsonの内容を更新する
   */
  abstract list(fromCache: boolean): Promise<WithExists<DatapackInfo>[]>;
  /**
   * データパックを作成
   *
   * メタデータのみの作成も許可
   */
  abstract create(
    meta: DatapackInfo,
    srcPath: Path | undefined
  ): Promise<Result<void, Error>>;

  /**
   * メタデータを更新
   */
  abstract updateInfo(meta: DatapackInfo): Promise<Result<void, Error>>;

  /**
   * データパックとメタデータを削除
   */
  abstract delete(): Promise<Result<void, Error>>;

  /**
   * データパックをpathに導入
   * @param path
   */
  abstract extractTo(mata: DatapackInfo, path: Path): Promise<Result<void>>;
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

/** In Source Testing */
if (import.meta.vitest) {
  // テスト用DatapackContainer
  const container = new DatapackContainer(
    new Path('src-electron/v2sourcedatapack/test/cache')
  );

  ('src-electron\v2sourcedatapack\test\target');

  const { test, expect } = import.meta.vitest;
  test('list', () => {
    // quick の true / false 試す
    // quick = true の時mataのデータが修復されたことを確認する
  });

  test('create', () => {
    // create を path ありなしで試す
    // 正しく導入されたことを確認する
  });

  test('updateMeta', () => {});
}