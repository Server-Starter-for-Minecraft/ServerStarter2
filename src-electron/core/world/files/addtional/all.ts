import {
  ErrorMessage,
  Failable,
  WithError,
} from 'app/src-electron/schema/error';
import {
  AllFileData,
  DatapackData,
  ModData,
  NewFileData,
  PluginData,
} from 'app/src-electron/schema/filedata';
import {
  WorldAdditional,
  WorldAdditionalEdited,
  WorldID,
} from 'app/src-electron/schema/world';
import { isError } from 'app/src-electron/util/error/error';
import { withError } from 'app/src-electron/util/error/witherror';
import { Path } from 'app/src-electron/util/path';
import { ServerAdditionalFiles } from './base';
import { datapackFiles } from './datapack';
import { modFiles } from './mod';
import { pluginFiles } from './plugin';

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

/**
 * パスを指定してNewContentsを返す
 */
export async function getAdditionalContent(
  cType: 'datapack',
  path: string
): Promise<Failable<NewFileData<DatapackData>>>;
export async function getAdditionalContent(
  cType: 'plugin',
  path: string
): Promise<Failable<NewFileData<PluginData>>>;
export async function getAdditionalContent(
  cType: 'mod',
  path: string
): Promise<Failable<NewFileData<ModData>>>;
export async function getAdditionalContent(
  cType: 'datapack' | 'plugin' | 'mod',
  path: string
): Promise<Failable<NewFileData<DatapackData | PluginData | ModData>>> {
  // pathを変換
  const pathObj = new Path(path);

  // typeに応じて結果を変える
  switch (cType) {
    case 'datapack':
      return datapackFiles.loadNew(pathObj);
    case 'plugin':
      return pluginFiles.loadNew(pathObj);
    case 'mod':
      return modFiles.loadNew(pathObj);
  }
}
