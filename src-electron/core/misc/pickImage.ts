import { Failable } from 'app/src-electron/schema/error';
import { ImageURIData } from 'app/src-electron/schema/filedata';
import { BytesData } from 'app/src-electron/util/bytesData';
import { isError } from 'app/src-electron/util/error/error';
import { Path } from 'app/src-electron/util/path';

export async function pickImage(path: Path): Promise<Failable<ImageURIData>> {
  const data = await BytesData.fromPath(path);
  if (isError(data)) return data;
  return {
    kind: 'image',
    path: path.str(),
    data: await data.encodeURI('image/png'),
  };
}
