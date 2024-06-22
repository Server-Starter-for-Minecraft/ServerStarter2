import { World, WorldContainer, WorldName } from '../../schema/world';
import { Result } from '../../util/base';
import { Path } from '../../util/binary/path';

/**
 * ワールドを管理するクラス
 *
 * 場所はどこにあってもよい
 */
export abstract class WorldSource {
  /**
   * コンテナ内のワールド名一覧を表示
   */
  abstract listWorldNames(container: WorldContainer): Promise<WorldName[]>;

  /**
   * メタデータを保存
   *
   * server_settings.jsonを上書きすればOK
   */
  abstract setWorldMeta(meta: World): Promise<Result<void>>;

  /**
   * メタデータを取得
   *
   * server_settings.jsonの内容を読み取って返す
   * server_settings.jsonが読みとれない場合は復元して返す
   *
   * 何度も呼ばれる可能性があるので、キャッシュしておくとよい
   */
  abstract getWorldMeta(
    container: WorldContainer,
    name: WorldName
  ): Promise<Result<World>>;

  /**
   * ワールドデータを削除
   */
  abstract deleteWorldData(name: WorldName): Promise<Result<void>>;

  /**
   * ワールドを特定の形のディレクトリ構造に展開し、展開先のPathを返す
   *
   * 展開に失敗した場合は元の状態に戻す
   *
   * properties / eula / op / whitelist
   *
   * mod / plugin / datapack の展開は行わない
   */
  abstract extractWorldDataTo(world: World): Promise<Result<Path>>;

  /**
   * ディレクトリに展開されたデータをWorldContainerに格納
   *
   * その際に下記ファイルの内容を読み取ってserver_settings.jsonに反映する
   *
   * banned-ips.json
   * banned-players.json
   * eula.txt
   * ops.json
   * server_settings.json
   * server.properties
   * whitelist.json
   */
  abstract packWorldDataFrom(world: World): Promise<Result<void>>;
}
