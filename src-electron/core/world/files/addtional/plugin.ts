import { PluginData } from 'app/src-electron/schema/filedata';
import { ADDITIONALS_CACHE_PATH, ServerAdditionalFiles } from './base';
import { Failable } from 'app/src-electron/util/error/failable';
import { Path } from 'app/src-electron/util/path';
import { errorMessage } from 'app/src-electron/util/error/construct';

async function loader(path: Path): Promise<Failable<PluginData | undefined>> {
  if (await path.isDirectory()) return undefined;

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
  'plugin',
  ADDITIONALS_CACHE_PATH.child('mod'),
  'plugins',
  loader,
  installer
);
