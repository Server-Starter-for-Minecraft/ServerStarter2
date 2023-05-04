import { Failable } from 'src-electron/api/failable';
import { Path } from '../../util/path';
import { Remote } from 'app/src-electron/schema/remote';
import { World } from 'app/src-electron/schema/world';

export type RemoteOperator<R extends Remote> = {
  pullWorld(local: Path, remote: R): Promise<Failable<undefined>>;
  pushWorld(local: Path, remote: R): Promise<Failable<undefined>>;
  getWorld: (
    name: string,
    container: string,
    remote: R
  ) => Promise<Failable<World>>;
};
