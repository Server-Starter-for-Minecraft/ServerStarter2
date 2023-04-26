import { Failable } from 'src-electron/api/failable';
import { Remote, World } from 'src-electron/api/schema';
import { Path } from '../../utils/path/path';

export type RemoteOperator<R extends Remote> = {
  pullWorld(local: Path, remote: R): Promise<Failable<undefined>>;
  pushWorld(local: Path, remote: R): Promise<Failable<undefined>>;
  getWorld: (local: Path, remote: R) => Promise<Failable<World>>;
};
