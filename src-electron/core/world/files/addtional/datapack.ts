import { DatapackData } from 'app/src-electron/schema/filedata';
import { ServerAdditionalFiles } from './base';
import { DATAPACK_CACHE_PATH, LEVEL_NAME } from 'app/src-electron/core/const';
import { Failable } from 'app/src-electron/util/error/failable';
import { Path } from 'app/src-electron/util/path';
import { isError } from 'app/src-electron/util/error/error';
import { errorMessage } from 'app/src-electron/util/error/construct';
import { BytesData } from 'app/src-electron/util/bytesData';
import { ZipFile } from 'app/src-electron/util/zipFile';

type Mcmeta = {
  pack: {
    pack_format: number;
    description: string;
  };
};

const MCMETA_FILE = 'pack.mcmeta';

async function loader(path: Path): Promise<Failable<DatapackData>> {
  let mcmetaData: Failable<BytesData>;

  if (await path.isDirectory()) {
    // ディレクトリの場合
    mcmetaData = await BytesData.fromPath(path.child(MCMETA_FILE));
  } else {
    if (path.extname() !== '.zip') {
      // zipでないファイル場合
      return errorMessage.data.path.invalidContent.invalidDatapack({
        type: 'file',
        path: path.path,
      });
    }
    // zipの場合
    const zip = new ZipFile(path);
    mcmetaData = await zip.getFile(MCMETA_FILE);
  }
  if (isError(mcmetaData)) return mcmetaData;

  // TODO: pack.mcmetaにdataFixerを付ける

  const mcmeta = await mcmetaData.json<Mcmeta>();
  if (isError(mcmeta)) return mcmeta;

  return {
    kind: 'datapack',
    description: mcmeta.pack.description,
  };
}

async function installer(sourcePath: Path, targetPath: Path): Promise<void> {
  await sourcePath.copyTo(targetPath);
}

export const datapackFiles = new ServerAdditionalFiles<DatapackData>(
  'datapack',
  DATAPACK_CACHE_PATH,
  LEVEL_NAME + '/datapacks',
  loader,
  installer
);
