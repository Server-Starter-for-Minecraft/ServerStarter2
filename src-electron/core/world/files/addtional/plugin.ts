import { PluginData } from 'app/src-electron/schema/filedata';
import { ServerAdditionalFiles } from './base';
import { Failable } from 'app/src-electron/util/error/failable';
import { Path } from 'app/src-electron/util/path';
import { PLUGIN_CACHE_PATH } from 'app/src-electron/core/stores/cache';
import { errorMessage } from 'app/src-electron/util/error/construct';

async function loader(path: Path): Promise<Failable<PluginData | undefined>> {
  if (path.extname() !== '.jar')
    return errorMessage.data.path.invalidContent.invalidPlugin({
      path: path.path,
      type: 'file',
    });

  return {
    kind: 'plugin',
  };
}

async function installer(sourcePath: Path, targetPath: Path): Promise<void> {
  await sourcePath.copyTo(targetPath);
}

export const pluginFiles = new ServerAdditionalFiles<PluginData>(
  PLUGIN_CACHE_PATH,
  'plugins',
  'file',
  loader,
  installer
);
