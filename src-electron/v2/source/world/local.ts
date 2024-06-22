import { World, WorldContainer, WorldName } from '../../schema/world';
import { err, Result } from '../../util/base';
import { Path } from '../../util/binary/path';
import { WorldSource } from './world';

/**
 * ローカルのワールドを管理するクラス
 */
export class LocalWorldSource extends WorldSource {
  /**
   * コンテナ内のワールド名一覧を表示
   */
  async listWorldNames(): Promise<WorldName[]> {
    return [];
  }

  /**
   * コンテナ内でメタデータを上書き
   */
  async setWorldMeta(meta: World): Promise<Result<void, Error>> {
    return err(new Error('notImplemented'));
  }

  /**
   * メタデータを取得
   */
  async getWorldMeta(
    container: WorldContainer,
    name: WorldName
  ): Promise<Result<World>> {
    return err(new Error('notImplemented'));
  }

  /**
   * ワールドデータを削除
   */
  async deleteWorldData(name: WorldName): Promise<Result<void>> {
    return err(new Error('notImplemented'));
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
  async extractWorldDataTo(world: World): Promise<Result<Path>> {
    return err(new Error('notImplemented'));
  }

  /**
   * extractWorldDataToで展開されたデータをWorldContainerに格納
   */
  async packWorldDataFrom(world: World): Promise<Result<void>> {
    return err(new Error('notImplemented'));
  }
}

/** In Source Testing */
if (import.meta.vitest) {
  const { test, expect } = import.meta.vitest;
  test('', () => {});
}
