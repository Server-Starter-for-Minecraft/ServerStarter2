import { LocalSave, LocalSaveContainer } from 'app/src-electron/schema/system';
import { Path } from 'app/src-electron/util/path';
import { asyncMap } from 'app/src-electron/util/objmap';
import { BytesData } from 'app/src-electron/util/bytesData';
import { ImageURI } from 'app/src-electron/schema/brands';
import { isError, isValid } from 'app/src-electron/util/error/error';
import { errorMessage } from 'app/src-electron/util/error/construct';
import {
  ErrorMessage,
  Failable,
  WithError,
} from 'app/src-electron/schema/error';
import { withError } from 'app/src-electron/util/error/witherror';
import { getLocalSaveContainers } from './launcherProfile';

export async function getAllLocalSaveData(): Promise<
  WithError<Failable<LocalSave[]>>
> {
  const containers = await getLocalSaveContainers();
  if (isError(containers)) return withError(containers);

  const savedatas = await asyncMap(Array.from(containers), getLocalSaveData);

  const errors: ErrorMessage[] = [];
  const values: LocalSave[] = [];

  savedatas.forEach((v) => {
    errors.push(...v.errors);
    values.push(...v.value);
  });

  return withError(values, errors);
}

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
  const levelDatPath = path.child('level.dat');
  if (levelDatPath.exists()) {
    return errorMessage.data.path.notFound({
      type: 'file',
      path: levelDatPath.path,
    });
  }
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
