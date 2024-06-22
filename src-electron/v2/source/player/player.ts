import { err } from '../../util/base';
import { Path } from '../../util/binary/path';

export class PlayerContainer {
  cachePath: Path;
  constructor(cachePath: Path) {
    this.cachePath = cachePath;
  }

  async exportUserCache(path: Path) {
    return err.error('not_implemanted');
  }
}
