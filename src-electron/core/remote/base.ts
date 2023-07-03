import { Failable } from 'app/src-electron/util/error/failable';
import { Path } from '../../util/path';
import { Remote } from 'src-electron/schema/remote';

export type RemoteOperator<R extends Remote> = {
  pullWorld(local: Path, remote: R): Promise<Failable<undefined>>;
  pushWorld(local: Path, remote: R): Promise<Failable<undefined>>;
};
