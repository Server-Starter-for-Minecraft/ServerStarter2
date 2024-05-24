import { World, WorldContainer, WorldName } from '../../schema/world';
import { Result } from '../../util/base';
import { Path } from '../../util/binary/path';

/**
 * ワールドを管理するクラス
 *
 * 場所はどこにあってもよい
 */
export class WorldSource {
  /**
   * コンテナ内のワールド名一覧を表示
   */
  static listWorldNames(container: WorldContainer): Promise<WorldName[]>;

  /**
   * コンテナ内でメタデータを上書き
   */
  static setWorldMeta(meta: World): Promise<Result<void, Error>>;

  /**
   * メタデータを取得
   */
  static getWorldMeta(
    container: WorldContainer,
    name: WorldName
  ): Promise<Result<World>>;

  /**
   * ワールドデータを削除
   */
  static deleteWorldData(name: WorldName): Promise<Result<World>>;

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
  static extractWorldDataTo(path: Path, world: World): Promise<Result<void>>;

  /**
   * ディレクトリに展開されたデータをWorldContainerに格納
   *
   * WorldContainerに該当データがある場合上書き
   *
   * WorldContainerに該当データがない場合新規作成
   *
   * TODO: 展開先のワールドのひな形の用意
   */
  static packWorldDataFrom(path: Path, world: World): Promise<Result<void>>;
}
