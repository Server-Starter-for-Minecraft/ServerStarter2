import { WithError } from 'app/src-electron/schema/error';
import {
  CacheFileData,
  DatapackData,
  ModData,
  PluginData,
} from 'app/src-electron/schema/filedata';
import { datapackFiles } from '../world/files/addtional/datapack';
import { modFiles } from '../world/files/addtional/mod';
import { pluginFiles } from '../world/files/addtional/plugin';

const filesMap = {
  datapack: datapackFiles,
  plugin: pluginFiles,
  mod: modFiles,
};

export function getCacheContents(
  type: 'datapack'
): Promise<WithError<CacheFileData<DatapackData>[]>>;
export function getCacheContents(
  type: 'plugin'
): Promise<WithError<CacheFileData<PluginData>[]>>;
export function getCacheContents(
  type: 'mod'
): Promise<WithError<CacheFileData<ModData>[]>>;
export function getCacheContents(
  type: 'datapack' | 'plugin' | 'mod'
): Promise<WithError<CacheFileData<DatapackData | PluginData | ModData>[]>> {
  return filesMap[type].loadCache();
}
