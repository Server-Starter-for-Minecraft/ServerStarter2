import { FileData } from 'app/src-electron/schema/filedata';
import {
  ServerAdditionalFiles,
  loadAdditionalFiles,
  saveAdditionalFiles,
} from './base';
import { Failable } from 'app/src-electron/util/error/failable';
import { Path } from 'app/src-electron/util/path';
import { WithError } from 'app/src-electron/util/error/witherror';
import { errorMessage } from 'app/src-electron/util/error/construct';

const PLUGINS_PATH = 'plugins';

const PLUGIN_FILE_REGEX = /^([^\\/:*?\"<>|]+)\.jar$/;

async function loadPlugin(path: Path): Promise<Failable<FileData | undefined>> {
  const fileName = path.basename();

  if (await path.isDirectory()) return;

  // *.jarにマッチしたらプラグインファイルとみなす
  const match = fileName.match(PLUGIN_FILE_REGEX);
  if (match === null)
    return errorMessage.data.path.invalidContent.invalidPlugin({
      type: 'file',
      path: path.path,
    });

  const pluginName = match[1];
  return {
    name: pluginName,
  };
}

async function installPlugin(
  dirPath: Path,
  source: FileData & { path?: string }
): Promise<void> {
  if (source.path === undefined) return;
  const sourcePath = new Path(source.path);
  const targetPath = dirPath.child(source.name + '.jar');
  await sourcePath.copyTo(targetPath);
}

export const pluginFiles: ServerAdditionalFiles<FileData> = {
  load(cwdPath) {
    const dirPath = pluginFiles.path(cwdPath);
    return loadAdditionalFiles(dirPath, loadPlugin);
  },
  async save(cwdPath, value): Promise<WithError<void>> {
    const dirPath = pluginFiles.path(cwdPath);
    return saveAdditionalFiles(dirPath, value, installPlugin, loadPlugin);
  },
  path(cwdPath) {
    return cwdPath.child(PLUGINS_PATH);
  },
};
