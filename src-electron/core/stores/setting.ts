import Store from 'electron-store';
import { SystemWorldSettings } from '../../api/schema';
import { mainPath } from '../const';

export type GitAccountSetting = {
  owner: string;
  repo: string;
  pat: string;
};

export type GitRemoteSetting = {
  accounts: GitAccountSetting[];
};

export type RemoteSetting = {
  git: GitRemoteSetting;
};

export const WORLD_CONTAINERS_KEY = 'world_containers';
export const SETTINGS_KEY = 'settings';
export const REMOTES_KEY = 'remotes';

export type ServerStarterSetting = {
  [WORLD_CONTAINERS_KEY]?: Record<string, string>;
  [SETTINGS_KEY]?: SystemWorldSettings;
  [REMOTES_KEY]?: RemoteSetting;
};

export const serverStarterSetting = new Store<ServerStarterSetting>({
  cwd: mainPath.str(),
  name: 'serversterter',
  fileExtension: 'json',
});
