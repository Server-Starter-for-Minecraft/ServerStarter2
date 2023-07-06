import { datapackFiles } from './datapack';
import { pluginFiles } from './plugin';
import { modFiles } from './mod';
import { Path } from 'app/src-electron/util/path';
import {
  WorldAdditional,
  WorldAdditionalEdited,
  WorldID,
} from 'app/src-electron/schema/world';
import { withError } from 'app/src-electron/util/error/witherror';
import { ServerAdditionalFiles } from './base';
import { ErrorMessage, WithError } from 'app/src-electron/schema/error';
import { isError } from 'app/src-electron/util/error/error';
import { AllFileData } from 'app/src-electron/schema/filedata';

export const serverAllAdditionalFiles = {
  async load(cwdPath: Path, id: WorldID): Promise<WithError<WorldAdditional>> {
    const [_datapacks, _plugins, _mods] = await Promise.all([
      datapackFiles.load(cwdPath, id),
      pluginFiles.load(cwdPath, id),
      modFiles.load(cwdPath, id),
    ]);
    const errors = _datapacks.errors.concat(_plugins.errors, _mods.errors);

    const datapacks = _datapacks.value;

    const plugins = _plugins.value;

    const mods = _mods.value;

    return withError({ datapacks, plugins, mods }, errors);
  },

  async save(
    cwdPath: Path,
    value: WorldAdditionalEdited
  ): Promise<WithError<void>> {
    const errors: ErrorMessage[] = [];

    async function saveEach<T extends Record<string, any>>(
      files: ServerAdditionalFiles<T>,
      values: AllFileData<T>[] | ErrorMessage
    ): Promise<void> {
      if (isError(values)) return;
      const result = await files.save(cwdPath, values);
      errors.push(...result.errors);
      if (isError(result.value)) errors.push(result.value);
    }
    await Promise.all([
      saveEach(datapackFiles, value.datapacks),
      saveEach(pluginFiles, value.plugins),
      saveEach(modFiles, value.mods),
    ]);

    return withError(undefined, errors);
  },
};
