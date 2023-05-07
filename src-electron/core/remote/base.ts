import { Failable } from 'src-electron/api/failable';
import { Path } from '../../util/path';
import { Remote } from 'src-electron/schema/remote';
import { World, WorldID } from 'src-electron/schema/world';

export type RemoteOperator<R extends Remote> = {
  pullWorld(local: Path, remote: R): Promise<Failable<undefined>>;
  pushWorld(local: Path, remote: R): Promise<Failable<undefined>>;
  getWorld: (id: WorldID, remote: R) => Promise<Failable<World>>;
};
