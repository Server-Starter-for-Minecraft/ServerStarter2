import { Failable } from 'src-electron/api/failable';
import { Remote, World } from 'src-electron/api/schema';
import { Path } from '../../util/path';

export type RemoteOperator<R extends Remote> = {
  pullWorld(local: Path, remote: R): Promise<Failable<undefined>>;
  pushWorld(local: Path, remote: R): Promise<Failable<undefined>>;
  getWorld: (
    name: string,
    container: string,
    remote: R
  ) => Promise<Failable<World>>;
};
