import { LocalSave, LocalSaveContainer } from 'app/src-electron/schema/system';
import { Path } from 'app/src-electron/util/path';
import { asyncMap } from 'app/src-electron/util/objmap';
import { Failable, isFailure, isSuccess } from 'app/src-electron/api/failable';
import { BytesData } from 'app/src-electron/util/bytesData';
import { ImageURI } from 'app/src-electron/schema/brands';
import { WithError, withError } from 'app/src-electron/api/witherror';

export async function getLocalSaveData(
  container: LocalSaveContainer
): Promise<WithError<LocalSave[]>> {
  const path = new Path(container);
  const result = await asyncMap(await path.iter(), (path) =>
    loadLocalSave(container, path)
  );
  return withError(result.filter(isSuccess), result.filter(isFailure));
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
    if (isSuccess(data)) {
      return await data.encodeURI('image/png');
    }
  }
  return undefined;
}
