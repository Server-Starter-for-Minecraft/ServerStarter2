import Store from 'electron-store';
import { userDataPath } from './userDataPath';
import { WorldSettings } from '../api/schema';

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

export type ServerStarterSetting = {
  world_containers?: Record<string, string>;
  default_settings?: WorldSettings;
  remote?: RemoteSetting;
};

export const serverStarterSetting = new Store<ServerStarterSetting>({
  cwd: userDataPath.str(),
  name: 'serversterter',
  fileExtension: 'json',
});
