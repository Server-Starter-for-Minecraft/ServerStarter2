import Store from 'electron-store';
import { userDataPath } from './userDataPath';
import { WorldSettings } from '../api/schema';

export type ServerStarterSetting = {
  world_containers?: string[];
  default_settings?: WorldSettings
};

export const serverStarterSetting = new Store<ServerStarterSetting>({
  cwd: userDataPath.str(),
  name: 'serversterter',
  fileExtension: 'json',
});
