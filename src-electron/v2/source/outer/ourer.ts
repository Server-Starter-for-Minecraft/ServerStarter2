import { Path } from '../../util/binary/path';

/** OuterResourceリポジトリにアクセスしてデータを取得するためのクラス */
export class OuterContainer {
  private cacheDirPath;
  constructor(cacheDirPath: Path) {
    this.cacheDirPath = cacheDirPath;
  }
}
