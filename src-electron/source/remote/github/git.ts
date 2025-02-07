import { GithubRemoteFolder } from 'app/src-electron/schema/remote';
import { RemoteOperator } from '../base';
import { getWorlds } from './getWorlds';
import { deleteWorld, pullWorld, pushWorld } from './sync';
import { validate } from './validate';
import { validateWorldName } from './validateWorldName';

export const githubRemoteOperator: RemoteOperator<GithubRemoteFolder> = {
  pullWorld,
  pushWorld,
  getWorlds,
  deleteWorld,
  validateNewWorldName: validateWorldName,
  validate: validate,
};
