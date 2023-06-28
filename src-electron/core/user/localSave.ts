import { LocalSave, LocalSaveContainer } from 'app/src-electron/schema/system';
import { Path } from 'app/src-electron/util/path';
import { asyncMap } from 'app/src-electron/util/objmap';
import {
  Failable
} from 'app/src-electron/util/error/failable';
import { BytesData } from 'app/src-electron/util/bytesData';
import { ImageURI } from 'app/src-electron/schema/brands';
import { WithError, withError } from 'app/src-electron/util/error/witherror';
import { isError, isValid } from 'app/src-electron/util/error/error';

export async function getLocalSaveData(
  container: LocalSaveContainer
): Promise<WithError<LocalSave[]>> {
  const path = new Path(container);
  const result = await asyncMap(await path.iter(), (path) =>
    loadLocalSave(container, path)
  );
  return withError(result.filter(isValid), result.filter(isError));
}

export async function loadLocalSave(
  container: LocalSaveContainer,
  path: Path
): Promise<Failable<LocalSave>> {
  const image = await getImage(path.child('icon.png'));
  return {
    name: path.basename(),
    container,
    avatar_path: image,
  };
}

export async function getImage(path: Path): Promise<ImageURI | undefined> {
  if (path.exists()) {
    const data = await BytesData.fromPath(path);
    if (isValid(data)) {
      return await data.encodeURI('image/png');
    }
  }
  return undefined;
}
