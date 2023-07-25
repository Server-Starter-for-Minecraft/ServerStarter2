import { ModData } from 'app/src-electron/schema/filedata';
import { ADDITIONALS_CACHE_PATH, ServerAdditionalFiles } from './base';
import { Failable } from 'app/src-electron/util/error/failable';
import { Path } from 'app/src-electron/util/path';
import { errorMessage } from 'app/src-electron/util/error/construct';

async function loader(path: Path): Promise<Failable<ModData>> {
  if (path.extname() !== '.jar')
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
  ADDITIONALS_CACHE_PATH.child('mods'),
  'mods',
  loader,
  installer
);
