import {
  CacheFileData,
  DatapackData,
  ModData,
  PluginData,
} from 'app/src-electron/schema/filedata';
import { WithError } from 'app/src-electron/util/error/witherror';
import { datapackFiles } from '../world/files/addtional/datapack';
import { pluginFiles } from '../world/files/addtional/plugin';
import { modFiles } from '../world/files/addtional/mod';

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
