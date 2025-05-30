import {
  ErrorMessage,
  Failable,
  WithError,
} from 'app/src-electron/schema/error';
import { CustomMapData } from 'app/src-electron/schema/filedata';
import { Path } from 'app/src-electron/util/binary/path';
import { isError, isValid } from 'app/src-electron/util/error/error';
import { withError } from 'app/src-electron/util/error/witherror';
import { asyncMap } from 'app/src-electron/util/obj/objmap';
import { loadCustomMap } from '../world/customMap';
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
  const containers = await container.iter();
  if (isError(containers)) return withError([], [containers]);

  const result = await asyncMap(containers, loadCustomMap);
  return withError(result.filter(isValid), result.filter(isError));
}
