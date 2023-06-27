import { FileData } from 'app/src-electron/schema/filedata';
import {
  ServerAdditionalFiles,
  loadAdditionalFiles,
  saveAdditionalFiles,
} from './base';
import { LEVEL_NAME } from 'app/src-electron/core/const';
import { Failable, isFailure } from 'app/src-electron/api/failable';
import { Path } from 'app/src-electron/util/path';
import { WithError } from 'app/src-electron/api/witherror';

const DATAPACKS_PATH = LEVEL_NAME + '/datapacks';

type Mcmeta = {
  pack: {
    pack_format: number;
    description: string;
  };
};

const MCMETA_FILE = 'pack.mcmeta';

async function loadDatapack(path: Path): Promise<Failable<FileData>> {
  const mcmetaPath = path.child(MCMETA_FILE);
  if (!mcmetaPath.exists())
    return new Error(`file not exists: ${mcmetaPath.path}`);
  const mcmeta = await mcmetaPath.readJson<Mcmeta>();
  if (isFailure(mcmeta)) return mcmeta;
  mcmeta.pack.description;
  return {
    name: path.basename(),
    description: mcmeta.pack.description,
  };
}

async function installDatapack(
  dirPath: Path,
  source: FileData & { path?: string }
): Promise<void> {
  if (source.path === undefined) return;
  const sourcePath = new Path(source.path);
  const targetPath = dirPath.child(source.name);
  await sourcePath.copyTo(targetPath);
}

export const datapackFiles: ServerAdditionalFiles<FileData> = {
  load(cwdPath) {
    const dirPath = datapackFiles.path(cwdPath);
    return loadAdditionalFiles(dirPath, loadDatapack);
  },
  async save(cwdPath, value): Promise<WithError<Failable<void>>> {
    const dirPath = datapackFiles.path(cwdPath);
    return saveAdditionalFiles(dirPath, value, installDatapack, loadDatapack);
  },
  path(cwdPath) {
    return cwdPath.child(DATAPACKS_PATH);
  },
};
