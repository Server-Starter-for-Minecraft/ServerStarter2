import { PluginData } from 'app/src-electron/schema/filedata';
import { PLUGIN_CACHE_PATH } from 'app/src-electron/source/const';
import { Path } from 'app/src-electron/util/binary/path';
import { errorMessage } from 'app/src-electron/util/error/construct';
import { isError } from 'app/src-electron/util/error/error';
import { Failable } from 'app/src-electron/util/error/failable';
import { ServerAdditionalFiles } from '../base';

async function loader(path: Path, force: true): Promise<Failable<PluginData>>;
async function loader(
  path: Path,
  force: false
): Promise<Failable<PluginData | undefined>>;
async function loader(
  path: Path,
  force: boolean
): Promise<Failable<PluginData | undefined>> {
  const isPathDir = await path.isDirectory();
  if (isError(isPathDir)) return isPathDir;

  if (isPathDir) {
    if (force) {
      return errorMessage.data.path.invalidContent.invalidPlugin({
        path: path.path,
        type: 'file',
      });
    } else {
      return undefined;
    }
  }

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
  PLUGIN_CACHE_PATH,
  'plugins',
  loader,
  installer
);
