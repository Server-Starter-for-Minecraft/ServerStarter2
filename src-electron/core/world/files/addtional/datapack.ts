import { DatapackData } from 'app/src-electron/schema/filedata';
import { ServerAdditionalFiles } from './base';
import { LEVEL_NAME } from 'app/src-electron/core/const';
import { Failable } from 'app/src-electron/util/error/failable';
import { Path } from 'app/src-electron/util/path';
import { isError } from 'app/src-electron/util/error/error';
import { errorMessage } from 'app/src-electron/util/error/construct';
import { DATAPACK_CACHE_PATH } from 'app/src-electron/core/stores/cache';

const DATAPACKS_PATH = LEVEL_NAME + '/datapacks';

type Mcmeta = {
  pack: {
    pack_format: number;
    description: string;
  };
};

const MCMETA_FILE = 'pack.mcmeta';

async function loader(path: Path): Promise<Failable<DatapackData | undefined>> {
  const mcmetaPath = path.child(MCMETA_FILE);

  if (!mcmetaPath.exists())
    return errorMessage.data.path.notFound({
      type: 'file',
      path: mcmetaPath.path,
    });

  const mcmeta = await mcmetaPath.readJson<Mcmeta>();
  if (isError(mcmeta)) return mcmeta;
  mcmeta.pack.description;
  return {
    kind: 'datapack',
    description: mcmeta.pack.description,
  };
}

async function installer(sourcePath: Path, targetPath: Path): Promise<void> {
  await sourcePath.copyTo(targetPath);
}

export const datapackFiles = new ServerAdditionalFiles<DatapackData>(
  DATAPACK_CACHE_PATH,
  DATAPACKS_PATH,
  'directory',
  loader,
  installer
);
