import { ServerSettingFile } from './base';
import { isError } from 'app/src-electron/util/error/error';
import { errorMessage } from 'app/src-electron/util/error/construct';

export const WORLD_SETTINGS_PATH = 'server_settings.json';

const 

export const serverJsonFile: ServerSettingFile<WorldSettings> = {

  async load(cwdPath) {
    const jsonPath = cwdPath.child(WORLD_SETTINGS_PATH);

    const data = await jsonPath.readJson<WorldSettings>();

    if (isError(data)) return data;

    const fixed = (await worldSettingsFixer())(data);

    if (fixed === FAIL)
      return errorMessage.data.path.invalidContent.invalidWorldSettingJson({
        type: 'file',
        path: jsonPath.path,
      });

    return fixed;
  },

  async save(cwdPath, value) {
    const jsonPath = cwdPath.child(WORLD_SETTINGS_PATH);
    await jsonPath.writeJson(value);
  },

  path(cwdPath) {
    return cwdPath.child(WORLD_SETTINGS_PATH);
  },
};
