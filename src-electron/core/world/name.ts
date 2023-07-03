import { WorldContainer, WorldName } from 'src-electron/schema/brands';
import { worldContainerToPath } from './worldContainer';
import { WORLDNAME_REGEX } from '../const';
import { Failable } from 'app/src-electron/util/error/failable';
import { errorMessage } from 'app/src-electron/util/error/construct';

export async function validateNewWorldName(
  worldContainer: WorldContainer,
  worldName: string
): Promise<Failable<WorldName>> {
  const match = worldName.match(WORLDNAME_REGEX);
  if (match === null)
    return errorMessage.value.worldName.notMatchRegex({
      value: worldName,
    });

  const path = worldContainerToPath(worldContainer).child(worldName);

  if (path.exists())
    return errorMessage.value.worldName.alreadyUsed({
      value: worldName,
    });

  return worldName as WorldName;
}
