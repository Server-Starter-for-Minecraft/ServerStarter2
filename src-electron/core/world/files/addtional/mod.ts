import { MOD_CACHE_PATH } from 'app/src-electron/core/const';
import { ModData } from 'app/src-electron/schema/filedata';
import { errorMessage } from 'app/src-electron/util/error/construct';
import { Failable } from 'app/src-electron/util/error/failable';
import { Path } from 'app/src-electron/util/path';
import { ServerAdditionalFiles } from './base';

async function loader(path: Path): Promise<Failable<ModData>> {
  if (path.extname() !== '.jar' && path.extname() !== '.zip')
    return errorMessage.data.path.invalidContent.invalidMod({
      path: path.path,
      type: 'file',
    });

  return {
    kind: 'mod',
  };
}

async function installer(sourcePath: Path, targetPath: Path): Promise<void> {
  await sourcePath.copyTo(targetPath);
}

export const modFiles = new ServerAdditionalFiles<ModData>(
  'mod',
  MOD_CACHE_PATH,
  'mods',
  loader,
  installer
);
