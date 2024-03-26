import { ServerSettingFile } from './base';
import { getWorldSettingsHandler } from '../../file/handler/worldSetting';
import { WorldSettings$1 } from '../../file/schama/worldSetting';

export const WORLD_SETTINGS_PATH = 'server_settings.json';

export const serverJsonFile: ServerSettingFile<WorldSettings$1> = {
  async load(cwdPath) {
    const jsonPath = cwdPath.child(WORLD_SETTINGS_PATH);
    return await getWorldSettingsHandler(jsonPath).load();
  },

  async save(cwdPath, value) {
    const jsonPath = cwdPath.child(WORLD_SETTINGS_PATH);
    return await getWorldSettingsHandler(jsonPath).save(value);
  },

  path(cwdPath) {
    return cwdPath.child(WORLD_SETTINGS_PATH);
  },
};
