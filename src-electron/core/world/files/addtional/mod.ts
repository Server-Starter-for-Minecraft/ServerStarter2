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

const MODS_PATH = 'mods';
const MOD_FILE_REGEX = /^([^\\/:*?\"<>|]+)\.jar$/;

async function loadMod(path: Path): Promise<Failable<FileData>> {
  const fileName = path.basename();

  // *.jarにマッチしたらModファイルとみなす
  const match = fileName.match(MOD_FILE_REGEX);
  if (match === null)
    return errorMessage.invalidPathContent({
      type: 'file',
      path: path.path,
      reason: {
        key: 'invalidPlugin',
        attr: undefined,
      },
    });

  const pluginName = match[1];
  return {
    name: pluginName,
  };
}

async function installMod(
  dirPath: Path,
  source: FileData & { path?: string }
): Promise<void> {
  if (source.path === undefined) return;
  const sourcePath = new Path(source.path);
  const targetPath = dirPath.child(source.name + '.jar');
  await sourcePath.copyTo(targetPath);
}

export const modFiles: ServerAdditionalFiles<FileData> = {
  load(cwdPath) {
    const dirPath = modFiles.path(cwdPath);
    return loadAdditionalFiles(dirPath, loadMod);
  },
  async save(cwdPath, value): Promise<WithError<Failable<void>>> {
    const dirPath = modFiles.path(cwdPath);
    return saveAdditionalFiles(dirPath, value, installMod, loadMod);
  },
  path(cwdPath) {
    return cwdPath.child(MODS_PATH);
  },
};
