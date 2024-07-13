import { World, WorldLocation, WorldName } from '../../schema/world';
import { err, Result } from '../../util/base';
import { Path } from '../../util/binary/path';
import { InfinitMap } from '../../util/helper/infinitMap';
import { WorldContainerHandler } from './container';

/**
 * ローカルのワールドを管理するクラス
 */
export class LocalWorldSource implements WorldContainerHandler {
  private dirpath: Path;
  worldMataMap: any;

  constructor(dirpath: Path) {
    this.dirpath = dirpath;
    this.worldMataMap = InfinitMap.primitiveKeyWeakValue<WorldName, any>(
      (k) => {}
    );
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
    throw new Error('Method not implemented.');
  }
  getWorldMeta(name: WorldName): Promise<Result<World>> {
    throw new Error('Method not implemented.');
  }
  deleteWorldData(name: WorldName): Promise<Result<void>> {
    throw new Error('Method not implemented.');
  }
  extractWorldData(name: WorldName): Promise<Result<Path>> {
    throw new Error('Method not implemented.');
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
