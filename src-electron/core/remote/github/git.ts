import { GithubRemoteFolder } from 'app/src-electron/schema/remote';
import { RemoteOperator } from '../base';
import { deleteWorld, pullWorld, pushWorld } from './sync';
import { getWorlds } from './getWorlds';
import { validateWorldName } from './validateWorldName';

export const githubRemoteOperator: RemoteOperator<GithubRemoteFolder> = {
  pullWorld,
  pushWorld,
  getWorlds,
  deleteWorld,
  validateNewWorldName: validateWorldName,
};
