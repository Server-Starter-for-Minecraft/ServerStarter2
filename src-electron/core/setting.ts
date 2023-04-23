import Store from 'electron-store';
import { userDataPath } from './userDataPath';

export type ServerStarterSetting = {
  world_containers: string[];
};

export const serverStarterSetting = new Store<ServerStarterSetting>({
  cwd: userDataPath.str(),
  name: 'serversterter',
  fileExtension: 'json',
});
