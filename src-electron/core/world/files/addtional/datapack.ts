import { DATAPACK_CACHE_PATH, LEVEL_NAME } from 'app/src-electron/core/const';
import { DatapackData } from 'app/src-electron/schema/filedata';
import { BytesData } from 'app/src-electron/util/bytesData';
import { errorMessage } from 'app/src-electron/util/error/construct';
import { isError } from 'app/src-electron/util/error/error';
import { Failable } from 'app/src-electron/util/error/failable';
import { Path } from 'app/src-electron/util/path';
import { ZipFile } from 'app/src-electron/util/zipFile';
import { ServerAdditionalFiles } from './base';

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
    const metaPath = path.child(MCMETA_FILE);
    // pack.mcmetaが存在しない場合エラー
    if (!metaPath.exists())
      return errorMessage.data.path.notFound({
        type: 'file',
        path: metaPath.str(),
      });
    mcmetaData = await BytesData.fromPath(metaPath);
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
  `${LEVEL_NAME}/datapacks`,
  loader,
  installer
);
