import { World, WorldContainer, WorldLocation } from '../../schema/world';
import { Result } from '../../util/base';
import { Path } from '../../util/binary/path';
import { WorldContainerHandler } from './container';
import { LocalWorldSource, RelativeWorldSource } from './local';

/**
 * ワールドを管理するクラス
 *
 * 場所はどこにあってもよい
 */
export class WorldSource {
  private getContainer(container: WorldContainer): WorldContainerHandler {
    switch (container.containerType) {
      case 'local':
        return new LocalWorldSource(new Path(container.path));
      case 'relative':
        return new RelativeWorldSource(container.path);
    }
  }

  /**
   * コンテナ内のワールド名一覧を表示
   */
  listWorldLocations(container: WorldContainer): Promise<WorldLocation[]> {
    return this.getContainer(container).listWorldLocations();
  }

  /**
   * メタデータを保存
   *
   * server_settings.jsonを上書きすればOK
   */
  setWorldMeta(location: WorldLocation, world: World): Promise<Result<void>> {
    return this.getContainer(location.container).setWorldMeta(
      location.worldName,
      world
    );
  }

  /**
   * メタデータを取得
   *
   * server_settings.jsonの内容を読み取って返す
   * server_settings.jsonが読みとれない場合は復元して返す
   *
   * 何度も呼ばれる可能性があるので、キャッシュしておくとよい
   */
  getWorldMeta(location: WorldLocation): Promise<Result<World>> {
    return this.getContainer(location.container).getWorldMeta(
      location.worldName
    );
  }

  /**
   * ワールドデータを削除
   */
  deleteWorldData(location: WorldLocation): Promise<Result<void>> {
    return this.getContainer(location.container).deleteWorldData(
      location.worldName
    );
  }

  /**
   * ワールドを特定の形のディレクトリ構造に展開し、展開先のPathを返す
   *
   * 展開に失敗した場合は元の状態に戻す
   *
   * properties / eula / op / whitelist
   *
   * mod / plugin / datapack の展開は行わない
   */
  extractWorldData(location: WorldLocation): Promise<Result<Path>> {
    return this.getContainer(location.container).extractWorldData(
      location.worldName
    );
  }

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
  packWorldData(location: WorldLocation): Promise<Result<void>> {
    return this.getContainer(location.container).packWorldData(
      location.worldName
    );
  }
}
