import { Failable } from 'app/src-electron/api/failable';
import { Remote } from 'app/src-electron/api/schema';
import { Path } from '../../utils/path/path';

export type RemoteOperator<R extends Remote> = {
  pull(local: Path, remote: R): Promise<Failable<undefined>>;
  push(local: Path, remote: R): Promise<Failable<undefined>>;
};
