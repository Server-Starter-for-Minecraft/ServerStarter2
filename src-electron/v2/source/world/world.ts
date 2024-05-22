import { DatapackDomain } from '../../schema/datapack';
import { RuntimeSettings } from '../../schema/runtime';
import { VersionDomain } from '../../schema/version';
import { Result } from '../../util/base';
import { Path } from '../../util/binary/path';

export type WorldMeta = {
  // ワールドの情報
  // バージョン
  // mod
  // 保存日時
  // ロック状態 etc...

  /** 起動中フラグ */
  using: boolean;

  /** 最終サーバー主 */
  laseUser?: string;

  /** eula同意フラグ */
  eula: boolean;

  /** バージョン情報 */
  version: VersionDomain;

  /** データパック */
  datapack: DatapackDomain[];

  /** メモリ等ランタイムの設定 */
  runtime: RuntimeSettings;
};

/**
 * ワールドを格納するフォルダ
 *
 * 場所はどこにあってもよい
 */
export abstract class WorldContainer {
  /**
   * コンテナ内のフォルダのメタデータ一覧を表示
   */
  abstract listMeta(): Promise<WorldMeta[]>;

  /**
   * コンテナ内でメタデータを上書き
   */
  abstract setMeta(meta: WorldMeta): Promise<Result<void, Error>>;
}

/**
 * どこかにあるワールドデータの情報
 */
export abstract class World {
  /**
   * メタデータを表示
   */
  abstract getMeta(): Promise<Result<WorldMeta>>;

  /**
   * メタデータを表示
   */
  abstract setMeta(meta: WorldMeta): Promise<Result<void>>;

  /**
   * ワールドを特定の形のディレクトリ構造に展開
   *
   * 展開に失敗した場合は元の状態に戻す
   *
   * properties / eula / op / whitelist
   *
   * mod / plugin / datapack の展開は行わない
   *
   * TODO: 展開先のワールドのひな形の用意
   */
  abstract extractTo(path: Path): Promise<Result<void>>;

  /**
   * ディレクトリに展開されたデータを
   * TODO: 展開先のワールドのひな形の用意
   */
  abstract packFrom(path: Path): Promise<Result<void>>;
}
