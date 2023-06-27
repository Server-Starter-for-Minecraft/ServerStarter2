import { Failable } from 'src-electron/api/failable';
import { Path } from 'src-electron/util/path';

export type ServerSettingFile<T> = {
  load(cwdPath: Path): Promise<Failable<T>>;
  save(cwdPath: Path, value: T): Promise<Failable<void>>;
  path(cwdPath: Path): Path;
};
