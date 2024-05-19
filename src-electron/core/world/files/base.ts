import { Path } from 'src-electron/util/path';
import { Failable } from 'app/src-electron/util/error/failable';

export type ServerSettingFile<T> = {
  load(cwdPath: Path): Promise<Failable<T>>;
  save(cwdPath: Path, value: T): Promise<Failable<void>>;
  path(cwdPath: Path): Path;
};
