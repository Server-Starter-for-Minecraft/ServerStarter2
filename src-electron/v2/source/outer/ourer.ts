import { z } from 'zod';
import { Result } from '../../util/base';
import { Path } from '../../util/binary/path';

/** OuterResourceリポジトリにアクセスしてデータを取得するためのクラス */
export class OuterContainer {
  private cacheDirPath;
  constructor(cacheDirPath: Path) {
    this.cacheDirPath = cacheDirPath;
  }

  async fetchUniversalRuntimeMap(): Promise<Result<UniversalRuntimeMap>> {
    throw new Error('未実装');
  }
}

export const UniversalRuntimeMap = z.object({
  versions: z.record(
    z.string() /** TODO: z.string()をJavaMajorVersionに変更 */,
    z.record(
      z.enum(['windows', 'mac', 'linux']),
      z.record(
        z.enum(['x-64', 'arm-64'])
        /** TODO: valueの型をRuntimeにする */
      )
    )
  ),
});
export type UniversalRuntimeMap = z.infer<typeof UniversalRuntimeMap>;
