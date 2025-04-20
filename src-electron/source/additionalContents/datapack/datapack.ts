import { z } from 'zod';
import { DatapackData } from 'app/src-electron/schema/filedata';
import { DATAPACK_CACHE_PATH, LEVEL_NAME } from 'app/src-electron/source/const';
import { ZipFile } from 'app/src-electron/util/binary/archive/zipFile';
import { BytesData } from 'app/src-electron/util/binary/bytesData';
import { Path } from 'app/src-electron/util/binary/path';
import { errorMessage } from 'app/src-electron/util/error/construct';
import { isError } from 'app/src-electron/util/error/error';
import { Failable } from 'app/src-electron/util/error/failable';
import { ServerAdditionalFiles } from '../base';

const Mcmeta = z.object({
  pack: z.object({
    pack_format: z.number(),
    description: z.string(),
  }),
});
type Mcmeta = z.infer<typeof Mcmeta>;

const MCMETA_FILE = 'pack.mcmeta';

async function loader(path: Path): Promise<Failable<DatapackData>> {
  let mcmetaData: Failable<BytesData>;
  const isPathDir = await path.isDirectory();
  if (isError(isPathDir)) return isPathDir;

  if (isPathDir) {
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

  const mcmeta = await mcmetaData.json<Mcmeta>();
  if (isError(mcmeta)) return mcmeta;

  const fixed = Mcmeta.safeParse(mcmeta);
  if (!fixed.success) {
    return errorMessage.data.path.invalidContent.invalidDatapack({
      type: 'file',
      path: path.path,
    });
  }

  return {
    kind: 'datapack',
    description: fixed.data.pack.description,
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
