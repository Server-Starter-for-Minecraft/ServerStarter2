import { World, WorldLocation, WorldName } from '../../schema/world';
import { err, ok, Result } from '../../util/base';
import { Json } from '../../util/binary/json';
import { Path } from '../../util/binary/path';
import { InfinitMap } from '../../util/helper/infinitMap';
import { AsyncCache } from '../../util/promise/cache';
import { WorldContainerHandler } from './container';

const SETTING_FILE_NAME = 'server_settings.json';

/**
 * ローカルのワールドを管理するクラス
 */
export class LocalWorldSource implements WorldContainerHandler {
  private dirpath: Path;
  private worldMataMap: InfinitMap<WorldName, AsyncCache<World>>;

  constructor(dirpath: Path) {
    this.dirpath = dirpath;

    const settingJson = new Json(World);

    const getWorldMeta = async (
      worldName: WorldName
    ): Promise<Result<World>> => {
      // TODO: 読み込み失敗時にデフォルト値を使用?
      const data = await this.settingFilePath(worldName).into(settingJson);
      return data;
    };

    const setWorldMeta = async (
      worldName: WorldName,
      world: World
    ): Promise<Result<World>> => {
      settingJson.data = ok(world);
      const setResult = await settingJson.into(this.settingFilePath(worldName));
      return setResult.onOk(() => ok(world));
    };

    this.worldMataMap = InfinitMap.primitiveKeyWeakValue(
      (worldName: WorldName) =>
        new AsyncCache<World>(
          () => getWorldMeta(worldName),
          (world) => setWorldMeta(worldName, world)
        )
    );
  }

  private settingFilePath(worldName: WorldName): Path {
    return this.dirpath.child(worldName).child(SETTING_FILE_NAME);
  }

  async listWorldLocations(): Promise<WorldLocation[]> {
    const paths = await this.dirpath.iter();
    const parsed = await Promise.all(
      paths.map(async (path) => {
        if (await path.isDirectory()) {
          return Result.fromZod(
            WorldLocation.safeParse({
              container: {
                containerType: 'local',
                path: this.dirpath.toStr(),
              },
              worldName: path.basename(),
            })
          );
        }
        return err.error('ENOTDIR');
      })
    );
    return parsed.filter((x) => x.isOk).map((x) => x.value());
  }

  setWorldMeta(name: WorldName, world: World): Promise<Result<void>> {
    return this.worldMataMap.get(name).set(world);
  }

  getWorldMeta(name: WorldName): Promise<Result<World>> {
    return this.worldMataMap.get(name).get();
  }

  async deleteWorldData(name: WorldName): Promise<Result<void>> {
    return ok(await this.dirpath.child(name).remove());
  }

  async extractWorldData(name: WorldName): Promise<Result<Path>> {
    const meta = await this.getWorldMeta(name);
    if (meta.isErr) return meta;
    const world = meta.value();

    // TODO: ここでデータを展開
  }

  packWorldData(name: WorldName): Promise<Result<void>> {
    throw new Error('Method not implemented.');
  }
}

/** In Source Testing */
if (import.meta.vitest) {
  const { test, expect } = import.meta.vitest;
  test('', () => {});
}
