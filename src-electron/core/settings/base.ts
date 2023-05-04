import { Failable } from 'app/src-electron/api/failable';
import { Path } from 'app/src-electron/util/path';

export type ServerSettingHandler<T extends object> = {
  load(cwdPath: Path): Promise<Failable<T>>;
  save(cwdPath: Path, value: T): Promise<Failable<void>>;
  remove(cwdPath: Path): Promise<Failable<void>>;
};
