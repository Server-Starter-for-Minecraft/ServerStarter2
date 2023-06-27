import { datapackFiles } from './datapack';
import { pluginFiles } from './plugin';
import { modFiles } from './mod';
import { Path } from 'app/src-electron/util/path';
import { isFailure } from 'app/src-electron/api/failable';
import {
  WorldAdditional,
  WorldEditedAdditional,
} from 'app/src-electron/schema/world';
import { WithError, withError } from 'app/src-electron/api/witherror';
import {
  errorMessage,
  isErrorMessage,
} from 'app/src-electron/core/error/construct';
import { ServerAdditionalFiles } from './base';
import { FileData } from 'app/src-electron/schema/filedata';
import { ErrorMessage } from 'app/src-electron/schema/error';

export const serverAllAdditionalFiles = {
  async load(cwdPath: Path): Promise<WithError<WorldAdditional>> {
    const [_datapacks, _plugins, _mods] = await Promise.all([
      datapackFiles.load(cwdPath),
      pluginFiles.load(cwdPath),
      modFiles.load(cwdPath),
    ]);
    const errors = _datapacks.errors.concat(_plugins.errors, _mods.errors);

    let datapacks: WorldAdditional['datapacks'];
    if (isFailure(_datapacks.value)) {
      errors.push(_datapacks.value);
      datapacks = errorMessage.failLoading({
        contentType: 'datapack',
        path: datapackFiles.path(cwdPath).path,
      });
    } else {
      datapacks = _datapacks.value;
    }

    let plugins: WorldAdditional['plugins'];
    if (isFailure(_plugins.value)) {
      errors.push(_plugins.value);
      plugins = errorMessage.failLoading({
        contentType: 'plugin',
        path: pluginFiles.path(cwdPath).path,
      });
    } else {
      plugins = _plugins.value;
    }

    let mods: WorldAdditional['mods'];
    if (isFailure(_mods.value)) {
      errors.push(_mods.value);
      mods = errorMessage.failLoading({
        contentType: 'mod',
        path: modFiles.path(cwdPath).path,
      });
    } else {
      mods = _mods.value;
    }

    return withError({ datapacks, plugins, mods }, errors);
  },

  async save(
    cwdPath: Path,
    value: WorldEditedAdditional
  ): Promise<WithError<void>> {
    const errors: Error[] = [];

    async function saveEach<T extends FileData>(
      files: ServerAdditionalFiles<T>,
      values: (T & { path?: string })[] | ErrorMessage
    ): Promise<void> {
      if (isErrorMessage(values)) return;
      const result = await files.save(cwdPath, values);
      errors.push(...result.errors);
      if (isFailure(result.value)) errors.push(result.value);
    }
    await Promise.all([
      saveEach(datapackFiles, value.datapacks),
      saveEach(pluginFiles, value.plugins),
      saveEach(modFiles, value.mods),
    ]);

    return withError(undefined, errors);
  },
};
