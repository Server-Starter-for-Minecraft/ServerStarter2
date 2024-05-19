import {
  ErrorMessage,
  Failable,
  WithError,
} from 'app/src-electron/schema/error';
import { CustomMapData } from 'app/src-electron/schema/filedata';
import { isError, isValid } from 'app/src-electron/util/error/error';
import { withError } from 'app/src-electron/util/error/witherror';
import { asyncMap } from 'app/src-electron/util/objmap';
import { Path } from 'app/src-electron/util/path';
import { loadCustomMap } from '../../world/cusomMap';
import { getLocalSaveContainers } from './launcherProfile';

export async function getAllLocalSaveData(): Promise<
  WithError<Failable<CustomMapData[]>>
> {
  const containers = await getLocalSaveContainers();
  if (isError(containers)) return withError(containers);

  const savedatas = await asyncMap(Array.from(containers), getLocalSaveData);

  const errors: ErrorMessage[] = [];
  const values: CustomMapData[] = [];

  savedatas.forEach((v) => {
    errors.push(...v.errors);
    values.push(...v.value);
  });

  return withError(values, errors);
}

export async function getLocalSaveData(
  container: Path
): Promise<WithError<CustomMapData[]>> {
  const result = await asyncMap(await container.iter(), loadCustomMap);
  return withError(result.filter(isValid), result.filter(isError));
}
